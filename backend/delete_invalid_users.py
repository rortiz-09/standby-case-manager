import asyncio
from sqlmodel import select, delete, update
from sqlmodel.ext.asyncio.session import AsyncSession
from app.database import engine
from app.models import User, Case, Observation

async def delete_users():
    async with AsyncSession(engine) as session:
        # Get legacy and new admin
        legacy_admin = (await session.exec(select(User).where(User.email == "admin@example.com"))).first()
        new_admin = (await session.exec(select(User).where(User.email == "admin@standby.com"))).first()

        if legacy_admin and new_admin:
            print(f"Reassigning cases from {legacy_admin.email} (ID: {legacy_admin.id}) to {new_admin.email} (ID: {new_admin.id})...")
            
            # Reassign cases
            stmt_update_cases = update(Case).where(Case.creado_por_id == legacy_admin.id).values(creado_por_id=new_admin.id)
            await session.exec(stmt_update_cases)
            
            # Reassign observations
            stmt_update_obs = update(Observation).where(Observation.created_by_id == legacy_admin.id).values(created_by_id=new_admin.id)
            await session.exec(stmt_update_obs)
            
            await session.commit()
            print(f"Reassignment complete.")

            # Delete legacy admin
            await session.delete(legacy_admin)
            await session.commit()
            print("Deleted legacy admin user (admin@example.com).")
        else:
            print("Could not find both users. Aborting.")

if __name__ == "__main__":
    asyncio.run(delete_users())
