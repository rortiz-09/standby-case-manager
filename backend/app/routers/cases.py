from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_
from typing import List, Optional
from datetime import datetime
from app.database import get_session
from app.models import Case, CaseCreate, CaseUpdate, User, UserRole, CaseStatus, Priority
from app.auth import get_current_user

router = APIRouter(prefix="/cases", tags=["cases"])

@router.post("/", response_model=Case)
def create_case(case: CaseCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.rol not in [UserRole.INGRESO, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create cases")
    # Generate code
    last_case = session.exec(select(Case).order_by(Case.id.desc())).first()
    next_id = (last_case.id + 1) if last_case and last_case.id else 1
    code = f"CASO-{next_id:04d}"
    
    db_case = Case(
        **case.dict(),
        codigo=code,
        creado_por_id=current_user.id,
        ultima_actualizacion=datetime.utcnow()
    )
    
    session.add(db_case)
    session.commit()
    session.refresh(db_case)
    return db_case

@router.get("/", response_model=List[Case])
def read_cases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[CaseStatus] = None,
    priority: Optional[Priority] = None,
    service: Optional[str] = None,
    sby_responsable: Optional[str] = None,
    search: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    query = select(Case)
    
    if status:
        query = query.where(Case.estado == status)
    if priority:
        query = query.where(Case.prioridad == priority)
    if service:
        query = query.where(Case.servicio_o_plataforma.contains(service))
    if sby_responsable:
        query = query.where(Case.sby_responsable.contains(sby_responsable))
    if search:
        query = query.where(or_(Case.novedades_y_comentarios.contains(search), Case.codigo.contains(search)))
        
    query = query.order_by(Case.ultima_actualizacion.desc()).offset(skip).limit(limit)
    cases = session.exec(query).all()
    return cases

@router.get("/{case_id}", response_model=Case)
def read_case(case_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.patch("/{case_id}", response_model=Case)
def update_case(case_id: int, case_update: CaseUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    db_case = session.get(Case, case_id)
    if not db_case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Permission check
    if current_user.rol not in [UserRole.INGRESO, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to edit cases")
    
    # STANDBY can update status, news, observations.
    # ADMIN can do everything.
    
    case_data = case_update.dict(exclude_unset=True)
    for key, value in case_data.items():
        setattr(db_case, key, value)
    
    db_case.ultima_actualizacion = datetime.utcnow()
    session.add(db_case)
    session.commit()
    session.refresh(db_case)
    return db_case
