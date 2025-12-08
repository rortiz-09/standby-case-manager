import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import engine, create_db_and_tables
from app.models import User, UserRole
from app.auth import get_password_hash

async def create_users():
    # Ensure tables exist
    await create_db_and_tables()
    
    async with AsyncSession(engine) as session:
        # Define users to create
        users_data = [
            {"nombre": "Admin", "email": "admin@example.com", "password": "admin123", "rol": UserRole.ADMIN},
        ]

        for user_data in users_data:
            statement = select(User).where(User.email == user_data["email"])
            results = await session.exec(statement)
            user = results.first()
            
            if not user:
                print(f"Creating user: {user_data['email']}")
                new_user = User(
                    nombre=user_data["nombre"],
                    email=user_data["email"],
                    hashed_password=get_password_hash(user_data["password"]),
                    rol=user_data["rol"],
                    is_active=True
                )
                session.add(new_user)
            else:
                print(f"User already exists: {user_data['email']}")
        
        await session.commit()

if __name__ == "__main__":
    asyncio.run(create_users())
