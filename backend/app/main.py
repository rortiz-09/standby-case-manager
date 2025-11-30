from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_db_and_tables, get_session
from app.routers import auth, cases, users, files
from app.models import User, UserRole
from app.auth import get_password_hash
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from app.database import engine
from fastapi.staticfiles import StaticFiles

from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis import asyncio as aioredis
import os

app = FastAPI(
    title="Standby Case Manager API",
    version="1.0.0",
    description="API for managing operation cases"
)

# Mount uploads directory to serve files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(cases.router)
app.include_router(users.router)

app.include_router(files.router)
from app.routers import import_export
app.include_router(import_export.router)
from app.routers import stats
app.include_router(stats.router)

@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()
    
    # Initialize Redis Cache
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
    redis = aioredis.from_url(redis_url, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")

    # Create initial admin user if not exists
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == "admin@example.com"))
        user = result.scalars().first()
        if not user:
            admin_user = User(
                nombre="Admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                rol=UserRole.ADMIN
            )
            session.add(admin_user)
            await session.commit()
            print("Admin user created: admin@example.com / admin123")

@app.get("/")
def read_root():
    return {"message": "Standby Case Manager API"}
