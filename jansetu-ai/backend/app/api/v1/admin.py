"""Admin endpoints: analytics, complaint management, model monitoring."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, update, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from app.database.session import get_db
from app.models.models import (
    Complaint, ComplaintStatusHistory, ComplaintAssignment,
    ComplaintCategory, Department, User, Notification, ModelPrediction,
    AuditLog, ComplaintStatus, Priority
)
from app.schemas.schemas import (
    OverviewStats, AdminAnalyticsResponse, AssignComplaintRequest, UpdateStatusRequest
)
from app.security.dependencies import require_staff_or_admin, require_admin

router = APIRouter()


def gen_id():
    return str(uuid.uuid4())


# ── Analytics ──────────────────────────────────────────────────────────────────
@router.get("/analytics/overview")
async def analytics_overview(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total = (await db.execute(select(func.count(Complaint.id)))).scalar()
    new_today = (await db.execute(
        select(func.count(Complaint.id)).where(Complaint.created_at >= today)
    )).scalar()
    open_count = (await db.execute(
        select(func.count(Complaint.id)).where(
            Complaint.status.in_(["submitted", "under_review", "assigned", "reopened"])
        )
    )).scalar()
    in_progress = (await db.execute(
        select(func.count(Complaint.id)).where(Complaint.status == "in_progress")
    )).scalar()
    resolved = (await db.execute(
        select(func.count(Complaint.id)).where(Complaint.status == "resolved")
    )).scalar()

    return {
        "total": total, "new_today": new_today, "open": open_count,
        "in_progress": in_progress, "resolved": resolved, "overdue": 0
    }


@router.get("/analytics/categories")
async def analytics_categories(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    result = await db.execute(
        select(ComplaintCategory.name, func.count(Complaint.id))
        .join(Complaint, Complaint.category_id == ComplaintCategory.id, isouter=True)
        .group_by(ComplaintCategory.name)
        .order_by(desc(func.count(Complaint.id)))
    )
    rows = result.all()
    total = sum(r[1] for r in rows)
    return [
        {"category": r[0], "count": r[1],
         "percentage": round(r[1] / total * 100, 1) if total else 0}
        for r in rows
    ]


@router.get("/analytics/trends")
async def analytics_trends(
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    # Use SQLite-compatible strftime instead of PostgreSQL-only date_trunc
    result = await db.execute(
        select(
            func.strftime("%Y-%m-%d", Complaint.created_at).label("day"),
            func.count(Complaint.id)
        )
        .where(Complaint.created_at >= datetime.utcnow() - timedelta(days=days))
        .group_by("day")
        .order_by("day")
    )
    rows = result.all()
    return {
        "trend": [{"date": str(r[0])[:10], "count": r[1]} for r in rows]
    }


# ── Complaint Management ───────────────────────────────────────────────────────
@router.get("/complaints")
async def admin_list_complaints(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    priority: Optional[str] = None,
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    query = select(Complaint)
    if status:
        query = query.where(Complaint.status == status)
    if category_id:
        query = query.where(Complaint.category_id == category_id)
    if priority:
        query = query.where(Complaint.priority == priority)
    if q:
        query = query.where(
            Complaint.original_text.ilike(f"%{q}%") |
            Complaint.reference_id.ilike(f"%{q}%")
        )

    total_res = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_res.scalar()

    query = query.order_by(desc(Complaint.created_at)).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "items": [
            {
                "id": c.id, "reference_id": c.reference_id,
                "original_text": c.original_text[:150],
                "status": str(c.status), "priority": str(c.priority),
                "category_id": c.category_id,
                "location_text": c.location_text,
                "created_at": c.created_at,
            }
            for c in items
        ],
        "total": total, "page": page, "per_page": per_page
    }


@router.patch("/complaints/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    req: AssignComplaintRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_staff_or_admin),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Mark previous assignments inactive
    await db.execute(
        update(ComplaintAssignment)
        .where(ComplaintAssignment.complaint_id == complaint_id)
        .values(is_current=False)
    )

    assignment = ComplaintAssignment(
        id=gen_id(), complaint_id=complaint_id,
        department_id=req.department_id, assigned_by_id=admin_user.id,
    )
    db.add(assignment)

    complaint.status = ComplaintStatus.assigned
    history = ComplaintStatusHistory(
        id=gen_id(), complaint_id=complaint_id,
        status=ComplaintStatus.assigned, changed_by_id=admin_user.id,
        note=req.note or "Assigned to department",
    )
    db.add(history)

    # Notify resident
    notif = Notification(
        id=gen_id(), user_id=complaint.user_id,
        complaint_id=complaint_id,
        title="Complaint Assigned",
        message=f"Your complaint {complaint.reference_id} has been assigned to a department.",
        type="info",
    )
    db.add(notif)

    await db.commit()
    return {"message": "Complaint assigned"}


@router.patch("/complaints/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    req: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_staff_or_admin),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    valid_statuses = [s.value for s in ComplaintStatus]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")

    complaint.status = req.status
    if req.status == "resolved":
        complaint.resolved_at = datetime.utcnow()

    history = ComplaintStatusHistory(
        id=gen_id(), complaint_id=complaint_id,
        status=req.status, changed_by_id=admin_user.id,
        note=req.note,
    )
    db.add(history)

    notif = Notification(
        id=gen_id(), user_id=complaint.user_id,
        complaint_id=complaint_id,
        title=f"Status Updated: {req.status.replace('_', ' ').title()}",
        message=req.note or f"Your complaint {complaint.reference_id} status has been updated.",
        type="info",
    )
    db.add(notif)

    await db.commit()
    return {"message": "Status updated"}


@router.get("/model-monitoring")
async def model_monitoring(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_staff_or_admin),
):
    total_preds = (await db.execute(select(func.count(ModelPrediction.id)))).scalar()
    low_confidence = (await db.execute(
        select(func.count(ModelPrediction.id))
        .where(ModelPrediction.confidence < 0.5, ModelPrediction.confidence != None)
    )).scalar()
    corrected = (await db.execute(
        select(func.count(ModelPrediction.id))
        .where(ModelPrediction.human_corrected_category_id != None)
    )).scalar()

    return {
        "total_predictions": total_preds,
        "low_confidence_count": low_confidence,
        "human_corrected_count": corrected,
        "models": nlp_service.get_model_info(),
    }


# import inside function to avoid circular
from app.services.nlp_service import nlp_service
