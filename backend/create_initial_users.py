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
            {"nombre": "Administrador", "email": "admin@standby.com", "password": "admin123", "rol": UserRole.ADMIN},
            {"nombre": "Operador Ingreso", "email": "ingreso@standby.com", "password": "ingreso123", "rol": UserRole.INGRESO},
            {"nombre": "Usuario Consulta", "email": "consulta@standby.com", "password": "consulta123", "rol": UserRole.CONSULTA},
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
                print(f"User exists, updating password: {user_data['email']}")
                user.hashed_password = get_password_hash(user_data["password"])
                session.add(user)
        
        await session.commit()

if __name__ == "__main__":
    asyncio.run(create_users())
