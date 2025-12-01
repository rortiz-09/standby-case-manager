from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import List
import shutil
import os
from pathlib import Path
from ..database import get_session
from ..models import Attachment, Case, User, UserRole
from ..auth import get_current_user

router = APIRouter(
    prefix="/cases",
    tags=["files"]
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/{case_id}/attachments", response_model=Attachment)
async def upload_attachment(
    case_id: int,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    case = await session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Generate safe filename
    import uuid
    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename

    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Could not save file: {e}")

    # Create DB entry
    attachment = Attachment(
        filename=file.filename, # Original name
        file_path=str(file_path),
        file_size=file_path.stat().st_size,
        content_type=file.content_type or "application/octet-stream",
        case_id=case_id
    )
    
    session.add(attachment)
    
    # Create Audit Log
    from ..models import CaseAudit, CaseAuditType
    audit_log = CaseAudit(
        case_id=case_id,
        user_id=current_user.id,
        action=CaseAuditType.EVIDENCE,
        details={"filename": file.filename, "size": file_path.stat().st_size},
        timestamp=attachment.uploaded_at
    )
    session.add(audit_log)

    await session.commit()
    await session.refresh(attachment)
    return attachment

@router.get("/{case_id}/attachments", response_model=List[Attachment])
async def get_attachments(
    case_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    result = await session.execute(select(Attachment).where(Attachment.case_id == case_id))
    attachments = result.scalars().all()
    return attachments

@router.delete("/attachments/{attachment_id}")
async def delete_attachment(
    attachment_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    attachment = await session.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Only admin or owner can delete (optional logic, kept simple for now)
    
    # Remove file
    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception:
        pass # Warn but continue DB deletion?

    await session.delete(attachment)
    await session.commit()
    return {"ok": True}
