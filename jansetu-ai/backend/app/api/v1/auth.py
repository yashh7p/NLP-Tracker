"""Authentication routes: register, login, refresh, logout, me."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.models.models import User, UserRole, UserPreference
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.security.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.security.dependencies import get_current_user
import uuid

router = APIRouter()


def gen_id():
    return str(uuid.uuid4())


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.lower().strip()
    clean_name = req.full_name.strip()
    clean_phone = req.phone.strip() if req.phone else None

    # Check duplicate email
    result = await db.execute(select(User).where(User.email == clean_email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Allow role selection if valid, fallback to resident
    try:
        role = UserRole(req.role) if req.role else UserRole.resident
    except (ValueError, KeyError):
        role = UserRole.resident

    user = User(
        id=gen_id(),
        email=clean_email,
        full_name=clean_name,
        phone=clean_phone,
        hashed_password=hash_password(req.password),
        role=role,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    prefs = UserPreference(id=gen_id(), user_id=user.id)
    db.add(prefs)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    clean_email = req.email.lower().strip()
    result = await db.execute(select(User).where(User.email == clean_email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    user_role = getattr(user.role, "value", str(user.role))
    return TokenResponse(
        access_token=create_access_token(user.id, user_role),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: dict, db: AsyncSession = Depends(get_db)):
    token = body.get("refresh_token", "")
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    user_role = getattr(user.role, "value", str(user.role))
    return TokenResponse(
        access_token=create_access_token(user.id, user_role),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
