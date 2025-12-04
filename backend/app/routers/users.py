from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List
from app.database import get_session
from app.models import User, UserCreate, UserRead, UserRole, UserUpdate
from app.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserRead])
async def read_users(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    result = await session.execute(select(User))
    users = result.scalars().all()
    return users

@router.post("/", response_model=UserRead)
async def create_user(
    user: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if email already exists
    result = await session.execute(select(User).where(User.email == user.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user safely
    user_data = user.dict(exclude={"password"})
    hashed_pw = get_password_hash(user.password)
    db_user = User(**user_data, hashed_password=hashed_pw)
    
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await session.delete(user)
    await session.commit()
    return {"ok": True}

@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = await session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_update.dict(exclude_unset=True)
    if "password" in user_data and user_data["password"]:
        hashed_pw = get_password_hash(user_data["password"])
        user_data["hashed_password"] = hashed_pw
        del user_data["password"]
        
    for key, value in user_data.items():
        setattr(db_user, key, value)
        
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user
