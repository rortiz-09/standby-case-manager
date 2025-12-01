from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import Field, SQLModel

class UserRole(str, Enum):
    CONSULTA = "CONSULTA"
    VISUALIZACION = "VISUALIZACION"
    INGRESO = "INGRESO"
    ADMIN = "ADMIN"

class CaseStatus(str, Enum):
    ABIERTO = "ABIERTO"
    STANDBY = "STANDBY"
    EN_MONITOREO = "EN_MONITOREO"
    CERRADO = "CERRADO"

class Priority(str, Enum):
    CRITICO = "CRITICO"
    ALTO = "ALTO"
    MEDIO = "MEDIO"
    BAJO = "BAJO"

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    rol: UserRole = Field(default=UserRole.CONSULTA)

class Case(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    codigo: str = Field(unique=True, index=True)
    fecha_inicio: datetime = Field(default_factory=datetime.utcnow)
    fecha_fin: Optional[datetime] = None
    estado: CaseStatus = Field(default=CaseStatus.ABIERTO)
    sby_responsable: Optional[str] = None
    servicio_o_plataforma: str
    prioridad: Priority = Field(default=Priority.MEDIO)
    novedades_y_comentarios: str = Field(default="")
    observaciones: Optional[str] = None
    creado_por_id: Optional[int] = Field(default=None, foreign_key="user.id")
    ultima_actualizacion: datetime = Field(default_factory=datetime.utcnow)

class CaseCreate(SQLModel):
    servicio_o_plataforma: str
    prioridad: Priority
    novedades_y_comentarios: str
    sby_responsable: Optional[str] = None
    observaciones: Optional[str] = None

class CaseUpdate(SQLModel):
    estado: Optional[CaseStatus] = None
    sby_responsable: Optional[str] = None
    novedades_y_comentarios: Optional[str] = None
    observaciones: Optional[str] = None
    fecha_fin: Optional[datetime] = None

class UserCreate(SQLModel):
    nombre: str
    email: str
    password: str
    rol: UserRole

class UserRead(SQLModel):
    id: int
    nombre: str
    email: str
    rol: UserRole

class Token(SQLModel):
    access_token: str
    token_type: str
