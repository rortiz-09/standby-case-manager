from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session, select
from typing import List
import shutil
import os
from pathlib import Path
from ..database import get_session
from ..models import Attachment, Case, User, UserRole
from ..auth import get_current_active_user

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
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    case = session.get(Case, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Generate safe filename
    timestamp = int(os.path.getctime(os.getcwd())) # Simple timestamp or uuid
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
    session.commit()
    session.refresh(attachment)
    return attachment

@router.get("/{case_id}/attachments", response_model=List[Attachment])
async def get_attachments(
    case_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    attachments = session.exec(select(Attachment).where(Attachment.case_id == case_id)).all()
    return attachments

@router.delete("/attachments/{attachment_id}")
async def delete_attachment(
    attachment_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    attachment = session.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Only admin or owner can delete (optional logic, kept simple for now)
    
    # Remove file
    try:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)
    except Exception:
        pass # Warn but continue DB deletion?

    session.delete(attachment)
    session.commit()
    return {"ok": True}
