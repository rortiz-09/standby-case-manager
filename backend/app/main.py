from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables, engine, get_session
from app.routers import auth, cases
from app.models import User, UserRole
from app.auth import get_password_hash
from sqlmodel import Session, select

app = FastAPI(title="Standby Case Manager")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Create initial admin user if not exists
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == "admin@example.com")).first()
        if not user:
            admin_user = User(
                nombre="Admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                rol=UserRole.ADMIN
            )
            session.add(admin_user)
            session.commit()
            print("Admin user created: admin@example.com / admin123")

@app.get("/")
def read_root():
    return {"message": "Standby Case Manager API"}
