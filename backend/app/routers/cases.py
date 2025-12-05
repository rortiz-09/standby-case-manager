from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, or_
from typing import List, Optional
from datetime import datetime
from app.database import get_session
from app.models import Case, CaseCreate, CaseUpdate, User, UserRole, CaseStatus, Priority
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
    
    db_case = Case(
        **case.dict(),
        creado_por_id=current_user.id,
        ultima_actualizacion=datetime.utcnow()
    )
    
    session.add(db_case)
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
        query = query.where(Case.ultima_actualizacion >= start_date)
    if end_date:
        query = query.where(Case.ultima_actualizacion <= end_date)
        
    query = query.order_by(Case.ultima_actualizacion.desc()).offset(skip).limit(limit)
    result = await session.execute(query)
    cases = result.scalars().all()
    return cases

@router.get("/{case_id}", response_model=Case)
async def read_case(case_id: int, session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)):
    case = await session.get(Case, case_id)
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
    
    # Handle observations with timestamp
    if "observaciones" in case_data and case_data["observaciones"]:
        new_obs = case_data["observaciones"]
        # User requested dd/mm/yyyy format
        timestamp = datetime.utcnow().strftime("%d/%m/%Y")
        if db_case.observaciones:
            db_case.observaciones += f"\n[{timestamp}] {new_obs}"
        else:
            db_case.observaciones = f"[{timestamp}] {new_obs}"
        del case_data["observaciones"]

    for key, value in case_data.items():
        setattr(db_case, key, value)
    
    db_case.ultima_actualizacion = datetime.utcnow()
    session.add(db_case)
    await session.commit()
    await session.refresh(db_case)
    return db_case
