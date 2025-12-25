import io
import pandas as pd
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models import Case, CaseCreate, CaseStatus, Priority
from app.auth import get_current_user

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
                creado_por_id=current_user.id
            )
            
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
