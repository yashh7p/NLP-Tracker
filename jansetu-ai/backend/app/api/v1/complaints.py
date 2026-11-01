"""Complaint CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional, List
import uuid, os, aiofiles, re
from datetime import datetime

from app.database.session import get_db
from app.models.models import (
    Complaint, ComplaintStatusHistory, ComplaintAttachment,
    ComplaintCategory, Department, ComplaintAssignment, Notification, User,
    ComplaintStatus, Priority, LanguageCode
)
from app.schemas.schemas import (
    ComplaintCreateRequest, ComplaintResponse, ComplaintListResponse,
    ComplaintDetailResponse, StatusHistoryItem
)
from app.security.dependencies import get_current_user
from app.core.config import settings

router = APIRouter()


def gen_id():
    return str(uuid.uuid4())


def gen_reference_id():
    import random, string
    prefix = "JS"
    suffix = "".join(random.choices(string.digits, k=8))
    return f"{prefix}{suffix}"


@router.post("", response_model=ComplaintResponse, status_code=201)
async def create_complaint(
    req: ComplaintCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = Complaint(
        id=gen_id(),
        reference_id=gen_reference_id(),
        user_id=current_user.id,
        original_text=req.original_text,
        edited_text=req.edited_text,
        language=req.language or "unknown",
        location_text=req.location_text,
        landmark=req.landmark,
        latitude=req.latitude,
        longitude=req.longitude,
        category_id=req.category_id,
        user_corrected_category_id=req.user_corrected_category_id,
        priority=req.priority or "normal",
        status=ComplaintStatus.submitted,
    )
    db.add(complaint)

    # Initial status history
    history = ComplaintStatusHistory(
        id=gen_id(),
        complaint_id=complaint.id,
        status=ComplaintStatus.submitted,
        changed_by_id=current_user.id,
        note="Complaint submitted by resident",
    )
    db.add(history)

    # Notification for resident
    notif = Notification(
        id=gen_id(),
        user_id=current_user.id,
        complaint_id=complaint.id,
        title="Complaint Submitted",
        message=f"Your complaint {complaint.reference_id} has been submitted successfully.",
        type="success",
    )
    db.add(notif)

    await db.commit()
    await db.refresh(complaint)
    return complaint


@router.get("", response_model=ComplaintListResponse)
async def list_complaints(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Complaint).where(Complaint.user_id == current_user.id)
    if status:
        q = q.where(Complaint.status == status)
    if category_id:
        q = q.where(Complaint.category_id == category_id)

    total_res = await db.execute(select(func.count()).select_from(q.subquery()))
    total = total_res.scalar()

    q = q.order_by(desc(Complaint.created_at)).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(q)
    items = result.scalars().all()

    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
async def get_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Ownership or staff/admin
    from app.models.models import UserRole
    if complaint.user_id != current_user.id and current_user.role not in (UserRole.staff, UserRole.admin):
        raise HTTPException(status_code=403, detail="Access denied")

    # Status history
    hist_result = await db.execute(
        select(ComplaintStatusHistory)
        .where(ComplaintStatusHistory.complaint_id == complaint_id)
        .order_by(ComplaintStatusHistory.created_at)
    )
    history = hist_result.scalars().all()

    # Category name
    cat_name = None
    if complaint.category_id:
        cat_res = await db.execute(select(ComplaintCategory).where(ComplaintCategory.id == complaint.category_id))
        cat = cat_res.scalar_one_or_none()
        if cat:
            cat_name = cat.name

    response = ComplaintDetailResponse(
        **{c.key: getattr(complaint, c.key) for c in complaint.__table__.columns},
        status_history=[
            StatusHistoryItem(
                id=h.id, status=h.status.value if hasattr(h.status, 'value') else str(h.status),
                note=h.note, created_at=h.created_at,
            )
            for h in history
        ],
        category_name=cat_name,
    )
    return response


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: str,
    req: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    allowed = {"edited_text", "location_text", "landmark", "latitude", "longitude", "user_corrected_category_id"}
    for key, val in req.items():
        if key in allowed:
            setattr(complaint, key, val)

    await db.commit()
    await db.refresh(complaint)
    return complaint


@router.get("/{complaint_id}/history")
async def get_complaint_history(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    from app.models.models import UserRole
    if complaint.user_id != current_user.id and current_user.role not in (UserRole.staff, UserRole.admin):
        raise HTTPException(status_code=403, detail="Access denied")

    hist_result = await db.execute(
        select(ComplaintStatusHistory)
        .where(ComplaintStatusHistory.complaint_id == complaint_id)
        .order_by(ComplaintStatusHistory.created_at)
    )
    history = hist_result.scalars().all()
    return [
        {"id": h.id, "status": str(h.status), "note": h.note, "created_at": h.created_at}
        for h in history
    ]


@router.post("/{complaint_id}/reopen")
async def reopen_complaint(
    complaint_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if complaint.status != ComplaintStatus.resolved:
        raise HTTPException(status_code=400, detail="Only resolved complaints can be reopened")

    complaint.status = ComplaintStatus.reopened
    history = ComplaintStatusHistory(
        id=gen_id(), complaint_id=complaint.id,
        status=ComplaintStatus.reopened, changed_by_id=current_user.id,
        note="Reopened by resident",
    )
    db.add(history)
    await db.commit()
    return {"message": "Complaint reopened"}


@router.post("/{complaint_id}/attachments")
async def upload_attachment(
    complaint_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File too large (max {settings.MAX_UPLOAD_SIZE_MB}MB)")

    # Safe filename
    safe_name = re.sub(r"[^a-zA-Z0-9._-]", "_", file.filename or "upload")
    stored_name = f"{gen_id()}_{safe_name}"
    complaint_dir = os.path.join(settings.UPLOAD_DIR, complaint_id)
    os.makedirs(complaint_dir, exist_ok=True)
    file_path = os.path.join(complaint_dir, stored_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    attachment = ComplaintAttachment(
        id=gen_id(),
        complaint_id=complaint_id,
        filename=stored_name,
        original_filename=file.filename,
        content_type=file.content_type,
        file_size=len(content),
        storage_path=file_path,
    )
    db.add(attachment)
    await db.commit()

    return {"id": attachment.id, "filename": stored_name, "url": f"/uploads/{complaint_id}/{stored_name}"}
