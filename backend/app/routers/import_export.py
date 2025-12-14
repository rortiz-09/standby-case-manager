import io
import pandas as pd
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import Case, CaseCreate, CaseStatus, Priority, Observation, CaseAudit, CaseAuditType, User
from app.auth import get_current_user
import re
from datetime import datetime
from sqlmodel import delete

# Regex to find cases: [STATUS] CASO CODE. DESCRIPTION
CASE_PATTERN = re.compile(r"\[(ABIERTO|CERRADO|EN MONITOREO|STANDBY|PENDIENTE)\]\s*CASO\s*([^.]+)\.?\s*(.*)", re.IGNORECASE | re.DOTALL)


router = APIRouter(prefix="/cases-io", tags=["Import/Export"])

@router.post("/import", status_code=201)
async def import_cases(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload Excel or CSV.")

    contents = await file.read()
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    # Expected columns validation
    required_cols = ['codigo', 'servicio_o_plataforma', 'prioridad', 'novedades_y_comentarios']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing_cols)}")

    # Fill NaN
    df.fillna('', inplace=True)

    imported_count = 0
    errors = []

    for index, row in df.iterrows():
        try:
            # Check validation for Enum types
            try:
                priority = Priority(row['prioridad'].upper())
            except:
                priority = Priority.MEDIO
            
            try:
                status = CaseStatus(str(row.get('estado', 'ABIERTO')).upper())
            except:
                status = CaseStatus.ABIERTO

            new_case = Case(
                codigo=str(row['codigo']),
                servicio_o_plataforma=str(row['servicio_o_plataforma']),
                prioridad=priority,
                estado=status,
                novedades_y_comentarios=str(row['novedades_y_comentarios']),
                sby_responsable=str(row.get('sby_responsable', '')),
                observaciones=str(row.get('observaciones', '')),
                creado_por_id=current_user.id,
                created_at=row.get('created_at', row.get('Fecha Inicio', datetime.utcnow())),
                updated_at=row.get('updated_at', row.get('Ultima Actualización', datetime.utcnow()))
            )
            
            # Try parsing dates if they are strings
            if isinstance(new_case.created_at, str):
                try: new_case.created_at = pd.to_datetime(new_case.created_at)
                except: new_case.created_at = datetime.utcnow()
                
            if isinstance(new_case.updated_at, str):
                try: new_case.updated_at = pd.to_datetime(new_case.updated_at)
                except: new_case.updated_at = datetime.utcnow()
            
            # Check duplicate code
            existing = await session.exec(select(Case).where(Case.codigo == new_case.codigo))
            if existing.first():
                errors.append(f"Row {index+2}: Duplicate Code {new_case.codigo}")
                continue

            session.add(new_case)
            imported_count += 1
            
        except Exception as e:
            errors.append(f"Row {index+2}: {str(e)}")

    await session.commit()
    
    return {
        "message": f"Successfully imported {imported_count} cases.",
        "errors": errors
    }

@router.post("/import-legacy", status_code=201)
async def import_legacy_cases(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user)
):
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload Excel.")

    contents = await file.read()
    
    try:
        # Load '2024' sheet or search for year-like sheets
        xl = pd.ExcelFile(io.BytesIO(contents))
        target_sheet = None
        for sheet in xl.sheet_names:
            if "202" in sheet: # Heuristic for year sheets
                target_sheet = sheet
                break
        
        if not target_sheet:
            target_sheet = xl.sheet_names[0] # Fallback
            
        df = pd.read_excel(io.BytesIO(contents), sheet_name=target_sheet, header=None)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing legacy file: {str(e)}")

    # CONFIG CONSTANTS
    COL_DATE = 1
    COL_RESP = 4
    COL_CONTENT = 25
    
    cases_map = {}
    admin_id = current_user.id
    
    # Pre-fetch existing cases to map
    # Ideally should be doing upsert, but script logic was comprehensive
    
    warnings = []
    
    count_created = 0
    count_updated = 0

    for idx, row in df.iterrows():
        # Validate Row bounds
        if len(row) < 26: continue
        
        # Date Check
        raw_date = row[COL_DATE]
        if pd.isna(raw_date) or str(raw_date).strip() == "":
            continue
            
        try:
            date_val = pd.to_datetime(raw_date)
        except:
            continue
        
        # Responsible
        resp = str(row[COL_RESP]).strip() if not pd.isna(row[COL_RESP]) else "Sin Asignar"
        if resp == "nan": resp = "Sin Asignar"
        
        # Content
        content_block = str(row[COL_CONTENT])
        if pd.isna(row[COL_CONTENT]) or content_block == "nan":
            continue
            
        # Parse Block
        content_block = content_block.replace("\n", " ").strip()
        for status in ["ABIERTO", "CERRADO", "EN MONITOREO", "STANDBY"]:
            content_block = content_block.replace(f"[{status}]", f"\n[{status}]")
            content_block = content_block.replace(f"[{status.lower()}]", f"\n[{status}]")
        
        lines = content_block.split("\n")
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            match = CASE_PATTERN.match(line)
            if match:
                status_str, code_str, desc_str = match.groups()
                
                # Normalize
                status_enum = CaseStatus.ABIERTO
                s_upper = status_str.upper()
                if "CERRADO" in s_upper: status_enum = CaseStatus.CERRADO
                elif "MONITOREO" in s_upper: status_enum = CaseStatus.EN_MONITOREO
                elif "STANDBY" in s_upper: status_enum = CaseStatus.STANDBY
                
                code = code_str.strip()
                desc = desc_str.strip()
                service = code.split(' ')[0] if ' ' in code else "General"
                
                # Check Local Map first (to handle duplicates in same file logic)
                # But we also need DB check
                
                if code in cases_map:
                    # Logic for updating existing object in memory
                    existing_case = cases_map[code]
                    
                    # Audit Logic
                    audit_details = {}
                    if existing_case.sby_responsable != resp:
                        audit_details["sby_responsable"] = {"old": existing_case.sby_responsable, "new": resp}
                        existing_case.sby_responsable = resp
                    
                    if existing_case.estado != status_enum:
                        audit_details["estado"] = {"old": existing_case.estado, "new": status_enum}
                        existing_case.estado = status_enum
                        
                    existing_case.updated_at = date_val
                    
                    if audit_details:
                        audit = CaseAudit(
                            case_id=existing_case.id, # Might be None if new, but we flush later? 
                            # If new in this transaction, ID is not available till flush.
                            # Complex imports usually need session.flush() inside loop.
                            user_id=admin_id,
                            action=CaseAuditType.UPDATE,
                            details=audit_details,
                            timestamp=date_val
                        )
                        # We can't add audit if ID is None. 
                        # Simplified: Just add observation for legacy import
                        # OR: flush new_case immediately upon creation.
                    
                    # Observation
                    obs = Observation(
                        case=existing_case,
                        content=f"**[{date_val.strftime('%Y-%m-%d')}] Actualización Semanal:**\n{desc}",
                        created_by_id=admin_id,
                        created_at=date_val
                    )
                    session.add(obs)
                    session.add(existing_case)
                    count_updated += 1
                    
                else:
                    # Check DB
                    existing_db = await session.exec(select(Case).where(Case.codigo == code))
                    existing_case_db = existing_db.first()
                    
                    if existing_case_db:
                        # Existing in DB, add to map and update
                        cases_map[code] = existing_case_db
                        existing_case_db.estado = status_enum
                        existing_case_db.sby_responsable = resp
                        existing_case_db.updated_at = date_val
                        
                        obs = Observation(
                            case_id=existing_case_db.id,
                            content=f"**[{date_val.strftime('%Y-%m-%d')}] Actualización Semanal:**\n{desc}",
                            created_by_id=admin_id,
                            created_at=date_val
                        )
                        session.add(obs)
                        session.add(existing_case_db)
                        count_updated += 1
                    else:
                        # New Case
                        new_case = Case(
                            codigo=code,
                            servicio_o_plataforma=service,
                            prioridad=Priority.MEDIO,
                            estado=status_enum,
                            sby_responsable=resp,
                            novedades_y_comentarios=desc,
                            creado_por_id=admin_id,
                            fecha_inicio=date_val,
                            updated_at=date_val
                        )
                        session.add(new_case)
                        # We need to map it, but it doesn't have ID yet.
                        cases_map[code] = new_case
                        
                        # Initial Obser
                        obs = Observation(
                            case=new_case,
                            content=f"**[{date_val.strftime('%Y-%m-%d')}] Importación Inicial:**\n{desc}",
                            created_by_id=admin_id,
                            created_at=date_val
                        )
                        session.add(obs)
                        count_created += 1

    await session.commit()
    return {"message": f"Legacy Import Processed: {count_created} created, {count_updated} updates."}
 

@router.get("/export")
async def export_cases(
    format: str = Query("tsv", regex="^(tsv|csv|xlsx)$"),
    session: AsyncSession = Depends(get_session)
):
    statement = select(Case)
    results = await session.exec(statement)
    cases = results.all()

    if not cases:
        raise HTTPException(status_code=404, detail="No cases found to export.")

    # Convert to DataFrame
    data = [case.dict() for case in cases]
    df = pd.DataFrame(data)

    # Clean data (remove IDs potentially, or keep them)
    # Keeping all data is usually better for backup purposes

    stream = io.BytesIO()

    if format == 'tsv':
        df.to_csv(stream, sep='\t', index=False, encoding='utf-8')
        media_type = "text/tab-separated-values"
        filename = "cases_export.tsv"
    elif format == 'csv':
        df.to_csv(stream, index=False, encoding='utf-8')
        media_type = "text/csv"
        filename = "cases_export.csv"
    else:
        df.to_excel(stream, index=False)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "cases_export.xlsx"

    stream.seek(0)
    
    return StreamingResponse(
        stream, 
        media_type=media_type, 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
