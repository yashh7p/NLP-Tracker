"""Pydantic schemas for auth, complaints, NLP, and admin."""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ── Auth ───────────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=128)
    role: str = "resident"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Complaints ─────────────────────────────────────────────────────────────────
class ComplaintCreateRequest(BaseModel):
    original_text: str = Field(..., min_length=10, max_length=2000)
    edited_text: Optional[str] = Field(None, max_length=2000)
    language: Optional[str] = "unknown"
    location_text: Optional[str] = Field(None, max_length=500)
    landmark: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category_id: Optional[int] = None
    user_corrected_category_id: Optional[int] = None
    priority: Optional[str] = "normal"


class StatusHistoryItem(BaseModel):
    id: str
    status: str
    note: Optional[str]
    created_at: datetime
    changed_by: Optional[str] = None

    class Config:
        from_attributes = True


class ComplaintResponse(BaseModel):
    id: str
    reference_id: str
    original_text: str
    edited_text: Optional[str]
    language: Optional[str]
    is_code_mixed: bool
    status: str
    priority: str
    location_text: Optional[str]
    landmark: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    category_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ComplaintDetailResponse(ComplaintResponse):
    status_history: List[StatusHistoryItem] = []
    category_name: Optional[str] = None
    department_name: Optional[str] = None


class ComplaintListResponse(BaseModel):
    items: List[ComplaintResponse]
    total: int
    page: int
    per_page: int


# ── NLP / AI ───────────────────────────────────────────────────────────────────
class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=2000)
    language_hint: Optional[str] = None


class CategoryPrediction(BaseModel):
    category_id: int
    category_name: str
    category_slug: str
    confidence: Optional[float] = None


class DuplicateCandidate(BaseModel):
    complaint_id: str
    reference_id: str
    text_snippet: str
    similarity_score: float
    category_name: Optional[str]
    status: str
    created_at: datetime


class ClassifyResponse(BaseModel):
    predicted_category: CategoryPrediction
    all_predictions: List[CategoryPrediction]
    detected_language: Optional[str]
    is_code_mixed: bool
    suggested_priority: str
    priority_reason: str
    model_name: str
    model_version: str
    latency_ms: float
    similar_complaints: List[DuplicateCandidate] = []


class ModelInfoResponse(BaseModel):
    name: str
    version: str
    description: str
    trained_at: Optional[str]
    accuracy: Optional[float]
    macro_f1: Optional[float]
    is_available: bool
    notes: str


# ── Admin ──────────────────────────────────────────────────────────────────────
class OverviewStats(BaseModel):
    total: int
    new_today: int
    open: int
    in_progress: int
    resolved: int
    overdue: int


class CategoryStat(BaseModel):
    category: str
    count: int
    percentage: float


class TrendPoint(BaseModel):
    date: str
    count: int


class AdminAnalyticsResponse(BaseModel):
    overview: OverviewStats
    by_category: List[CategoryStat]
    trend: List[TrendPoint]


class AssignComplaintRequest(BaseModel):
    department_id: str
    note: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str
    note: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    complaint_id: Optional[str]

    class Config:
        from_attributes = True
