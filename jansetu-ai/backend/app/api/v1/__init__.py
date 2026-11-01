"""API v1 router — aggregates all sub-routers."""
from fastapi import APIRouter
from app.api.v1 import auth, complaints, ai, notifications, admin

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])
router.include_router(ai.router, prefix="/ai", tags=["AI / NLP"])
router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
router.include_router(admin.router, prefix="/admin", tags=["Administration"])
