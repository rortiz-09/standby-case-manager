import asyncio
from sqlmodel import select, delete
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import engine
from app.models import User

async def delete_users():
    async with AsyncSession(engine) as session:
        # Delete users with invalid emails
        statement = delete(User).where(User.email.in_(["admin", "ingreso", "consulta"]))
        await session.exec(statement)
        await session.commit()
        print("Deleted invalid users.")

if __name__ == "__main__":
    asyncio.run(delete_users())
