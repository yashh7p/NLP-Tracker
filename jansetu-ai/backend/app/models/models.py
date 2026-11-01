"""SQLAlchemy ORM models."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float,
    DateTime, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
import enum

from app.database.session import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    resident = "resident"
    staff = "staff"
    admin = "admin"


class ComplaintStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    reopened = "reopened"
    rejected = "rejected"


class Priority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class LanguageCode(str, enum.Enum):
    en = "en"
    hi = "hi"
    kn = "kn"
    hinglish = "hinglish"
    kanglish = "kanglish"
    mixed = "mixed"
    unknown = "unknown"


# ── Users ──────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.resident, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id")
    notifications = relationship("Notification", back_populates="user")
    preferences = relationship("UserPreference", back_populates="user", uselist=False)


# ── Departments ────────────────────────────────────────────────────────────────
class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("ComplaintAssignment", back_populates="department")


# ── Complaint Categories ───────────────────────────────────────────────────────
class ComplaintCategory(Base):
    __tablename__ = "complaint_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    default_department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    icon = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    default_department = relationship("Department")
    complaints = relationship("Complaint", back_populates="category", foreign_keys="[Complaint.category_id]")


# ── Complaints ─────────────────────────────────────────────────────────────────
class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    reference_id = Column(String(20), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    # Text
    original_text = Column(Text, nullable=False)
    edited_text = Column(Text, nullable=True)
    language = Column(SAEnum(LanguageCode), default=LanguageCode.unknown)
    is_code_mixed = Column(Boolean, default=False)

    # Classification
    category_id = Column(Integer, ForeignKey("complaint_categories.id"), nullable=True)
    user_corrected_category_id = Column(Integer, ForeignKey("complaint_categories.id"), nullable=True)
    priority = Column(SAEnum(Priority), default=Priority.normal)
    status = Column(SAEnum(ComplaintStatus), default=ComplaintStatus.submitted)

    # Location
    location_text = Column(String(500), nullable=True)
    landmark = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    category = relationship("ComplaintCategory", foreign_keys=[category_id], back_populates="complaints")
    user_corrected_category = relationship("ComplaintCategory", foreign_keys=[user_corrected_category_id])
    attachments = relationship("ComplaintAttachment", back_populates="complaint")
    status_history = relationship("ComplaintStatusHistory", back_populates="complaint", order_by="ComplaintStatusHistory.created_at")
    assignments = relationship("ComplaintAssignment", back_populates="complaint")
    model_predictions = relationship("ModelPrediction", back_populates="complaint")
    internal_notes = relationship("InternalNote", back_populates="complaint")
    notifications = relationship("Notification", back_populates="complaint")


# ── Attachments ────────────────────────────────────────────────────────────────
class ComplaintAttachment(Base):
    __tablename__ = "complaint_attachments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    storage_path = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="attachments")


# ── Status History ─────────────────────────────────────────────────────────────
class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    status = Column(SAEnum(ComplaintStatus), nullable=False)
    changed_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="status_history")
    changed_by = relationship("User")


# ── Assignments ────────────────────────────────────────────────────────────────
class ComplaintAssignment(Base):
    __tablename__ = "complaint_assignments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    assigned_by_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="assignments")
    department = relationship("Department", back_populates="assignments")
    assigned_by = relationship("User")


# ── Model Predictions ──────────────────────────────────────────────────────────
class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    input_text = Column(Text, nullable=False)
    predicted_category_id = Column(Integer, ForeignKey("complaint_categories.id"), nullable=True)
    confidence = Column(Float, nullable=True)
    raw_output = Column(JSON, nullable=True)
    latency_ms = Column(Float, nullable=True)
    human_corrected_category_id = Column(Integer, ForeignKey("complaint_categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="model_predictions")
    predicted_category = relationship("ComplaintCategory", foreign_keys=[predicted_category_id])
    human_corrected_category = relationship("ComplaintCategory", foreign_keys=[human_corrected_category_id])


# ── Notifications ──────────────────────────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    complaint = relationship("Complaint", back_populates="notifications")


# ── Internal Notes ─────────────────────────────────────────────────────────────
class InternalNote(Base):
    __tablename__ = "internal_notes"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    complaint_id = Column(String(36), ForeignKey("complaints.id"), nullable=False)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=False)
    is_visible_to_resident = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="internal_notes")
    author = relationship("User")


# ── Audit Logs ─────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# ── User Preferences ───────────────────────────────────────────────────────────
class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    language = Column(String(10), default="en")
    theme = Column(String(20), default="light")
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    tts_enabled = Column(Boolean, default=False)
    high_contrast = Column(Boolean, default=False)
    large_text = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="preferences")
