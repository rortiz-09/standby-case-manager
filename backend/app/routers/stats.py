from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func
from typing import Dict
from datetime import datetime, timedelta

from app.database import get_session
from app.models import Case, CaseStatus, Priority

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("/")
async def get_stats(session: AsyncSession = Depends(get_session)):
    # Total Cases
    total_cases = (await session.exec(select(func.count()).select_from(Case))).one()

    # By Status
    by_status = {}
    for status in CaseStatus:
        count = (await session.exec(select(func.count()).select_from(Case).where(Case.estado == status))).one()
        by_status[status.value] = count

    # By Priority (Active Cases Only)
    by_priority = {}
    for priority in Priority:
        count = (await session.exec(select(func.count()).select_from(Case).where(Case.prioridad == priority, Case.estado != CaseStatus.CERRADO))).one()
        by_priority[priority.value] = count

    # Cases Last 24h
    last_24h = datetime.utcnow() - timedelta(hours=24)
    cases_last_24h = (await session.exec(select(func.count()).select_from(Case).where(Case.created_at >= last_24h))).one()

    return {
        "total_cases": total_cases,
        "by_status": by_status,
        "by_priority": by_priority,
        "cases_last_24h": cases_last_24h
    }
