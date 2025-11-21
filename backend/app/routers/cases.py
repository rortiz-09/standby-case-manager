from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_session
from sqlalchemy.orm import selectinload
from app.models import Case, CaseCreate, CaseUpdate, User, UserRole, CaseStatus, Priority, Observation, CaseReadWithDetails, ObservationUpdate, CaseAudit, CaseAuditType, CaseRead
from app.auth import get_current_user
from fastapi_cache.decorator import cache

router = APIRouter(prefix="/cases", tags=["cases"])

@router.post("/", response_model=Case)
async def create_case(case: CaseCreate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.rol not in [UserRole.INGRESO, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create cases")
    
    # Check uniqueness of mandatory code
    result = await session.execute(select(Case).where(Case.codigo == case.codigo))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Case code already exists")
    
    # Extract initial observation content
    initial_obs_content = case.observaciones
    
    # Create case without legacy observations field populated (or keep it for legacy compat, but we want it in the list)
    # We will set it to None in the DB object to encourage using the list, 
    # but if we need legacy support we might need to keep it. 
    # For now, let's clear it so we don't have duplication if we ever migrate fully.
    # Actually, let's keep it in the dict but override it in the model creation if needed.
    # To be safe and avoid "missing" data if something reads only the column, 
    # we can keep it, but we MUST create the Observation record.
    
    case_data = case.dict()
    if "observaciones" in case_data:
        del case_data["observaciones"] # Remove from case data so it's not set on the legacy column (or set to None)

    db_case = Case(
        **case_data,
        observaciones=None, # Explicitly set legacy field to None
        creado_por_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(db_case)
    await session.commit()
    await session.refresh(db_case)
    
    # Create Observation record if content exists
    if initial_obs_content:
        new_obs = Observation(
            case_id=db_case.id,
            content=initial_obs_content,
            created_by_id=current_user.id,
            created_at=datetime.utcnow()
        )
        session.add(new_obs)
        await session.commit()
        await session.refresh(db_case)
        
    return db_case

@router.get("/", response_model=List[Case])
async def read_cases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[CaseStatus] = None,
    priority: Optional[Priority] = None,
    service: Optional[str] = None,
    sby_responsable: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    timezone_offset: Optional[int] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    query = select(Case)
    
    if status:
        query = query.where(Case.estado == status)
    if priority:
        query = query.where(Case.prioridad == priority)
    if service:
        query = query.where(Case.servicio_o_plataforma.ilike(f"%{service}%"))
    if sby_responsable:
        query = query.where(Case.sby_responsable.ilike(f"%{sby_responsable}%"))
    if search:
        query = query.where(or_(Case.novedades_y_comentarios.ilike(f"%{search}%"), Case.codigo.ilike(f"%{search}%")))
    if start_date:
        if timezone_offset is not None:
             # Adjust for timezone: start_date is 00:00 local, so add offset to get UTC
             start_date = start_date + timedelta(minutes=timezone_offset)
        query = query.where(Case.updated_at >= start_date)
    if end_date:
        # Set time to end of day
        end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        if timezone_offset is not None:
             # Adjust for timezone
             end_date = end_date + timedelta(minutes=timezone_offset)
        query = query.where(Case.updated_at <= end_date)
        
    query = query.order_by(Case.updated_at.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    cases = result.scalars().all()
    return cases

@router.get("/{case_id}", response_model=CaseReadWithDetails)
async def read_case(case_id: int, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    query = select(Case).where(Case.id == case_id).options(selectinload(Case.observaciones_list), selectinload(Case.attachments))
    result = await session.execute(query)
    case = result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.patch("/{case_id}", response_model=Case)
async def update_case(case_id: int, case_update: CaseUpdate, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    db_case = await session.get(Case, case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Permission check
    if current_user.rol not in [UserRole.INGRESO, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to edit cases")
    
    case_data = case_update.dict(exclude_unset=True)
    
    # Handle observations as separate entities
    if "observaciones" in case_data and case_data["observaciones"]:
        new_obs_content = case_data["observaciones"]
        new_obs = Observation(
            case_id=db_case.id,
            content=new_obs_content,
            created_by_id=current_user.id,
            created_at=datetime.utcnow()
        )
        session.add(new_obs)
    
    # Always remove 'observaciones' from data to prevent overwriting legacy field with empty string/None
    if "observaciones" in case_data:
        del case_data["observaciones"]

    # Calculate diffs for audit
    audit_details = {}
    for key, value in case_data.items():
        if key == "observaciones": continue
        old_val = getattr(db_case, key)
        # Handle Enums comparison
        if isinstance(old_val, (CaseStatus, Priority)):
            old_val = old_val.value
        
        if old_val != value:
            audit_details[key] = {"old": old_val, "new": value}
            setattr(db_case, key, value)
    
    # Create Audit Log if there are changes
    if audit_details:
        audit = CaseAudit(
            case_id=db_case.id,
            user_id=current_user.id,
            action=CaseAuditType.UPDATE,
            details=audit_details,
            timestamp=datetime.utcnow()
        )
        session.add(audit)
    
    db_case.updated_at = datetime.utcnow()
    session.add(db_case)
    await session.commit()
    await session.refresh(db_case)
    return db_case

@router.patch("/observations/{observation_id}", response_model=Observation)
async def update_observation(
    observation_id: int, 
    observation_update: ObservationUpdate, 
    session: AsyncSession = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    obs = await session.get(Observation, observation_id)
    if not obs:
        raise HTTPException(status_code=404, detail="Observation not found")
        
    if current_user.rol not in [UserRole.INGRESO, UserRole.ADMIN]:
        if obs.created_by_id != current_user.id:
             raise HTTPException(status_code=403, detail="Not authorized to edit this observation")

    obs.content = observation_update.content
    obs.edited_at = datetime.utcnow()
    session.add(obs)
    await session.commit()
    await session.refresh(obs)
    return obs

from app.schemas import BulkUpdateSchema

@router.post("/bulk-update", status_code=200)
async def bulk_update_cases(
    payload: BulkUpdateSchema,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol not in [UserRole.INGRESO, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to perform bulk updates")

    query = select(Case).where(Case.id.in_(payload.ids))
    result = await session.execute(query)
    cases = result.scalars().all()
    
    updated_count = 0
    
    for case in cases:
        audit_details = {}
        
        if payload.action == "CLOSE":
             if case.estado != CaseStatus.CERRADO:
                 audit_details["estado"] = {"old": case.estado, "new": CaseStatus.CERRADO}
                 case.estado = CaseStatus.CERRADO
        
        elif payload.action == "ASSIGN":
             if case.sby_responsable != payload.value:
                  audit_details["sby_responsable"] = {"old": case.sby_responsable, "new": payload.value}
                  case.sby_responsable = payload.value

        elif payload.action == "PRIORITY":
             try:
                 new_prio = Priority(payload.value)
                 if case.prioridad != new_prio:
                     audit_details["prioridad"] = {"old": case.prioridad, "new": new_prio}
                     case.prioridad = new_prio
             except ValueError:
                 pass # Ignore invalid enum values

        if audit_details:
            case.updated_at = datetime.utcnow()
            session.add(case)
            
            # Create Audit
            audit = CaseAudit(
                case_id=case.id,
                user_id=current_user.id,
                action=CaseAuditType.BULK_UPDATE,
                details=audit_details,
                timestamp=datetime.utcnow()
            )
            session.add(audit)
            updated_count += 1
            
    await session.commit()
    return {"message": f"Updated {updated_count} cases successfully"}

@router.get("/{case_id}/timeline")
async def get_case_timeline(
    case_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Fetch observations
    obs_query = select(Observation).where(Observation.case_id == case_id)
    obs_result = await session.execute(obs_query)
    observations = obs_result.scalars().all()
    
    # Fetch audits
    audit_query = select(CaseAudit).where(CaseAudit.case_id == case_id).options(selectinload(CaseAudit.user))
    audit_result = await session.execute(audit_query)
    audits = audit_result.scalars().all()
    
    timeline = []
    
    for obs in observations:
        # Fetch user name for obs? Ideally join or preload
        # For simplicity assuming created_by_id logic or we can preload User in Observation too
        timeline.append({
            "type": "OBSERVATION",
            "id": obs.id,
            "content": obs.content,
            "created_at": obs.created_at,
            "user_id": obs.created_by_id
        })
        
    for audit in audits:
        timeline.append({
            "type": "AUDIT",
            "id": audit.id,
            "action": audit.action,
            "details": audit.details,
            "created_at": audit.timestamp,
            "user_name": audit.user.nombre if audit.user else "Unknown"
        })
        
    # Sort by date
    timeline.sort(key=lambda x: x["created_at"])
    
    return timeline
