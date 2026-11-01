"""
JanSetu AI — Database Seeding Script

Populates:
1. Categories & Departments
2. Demo Users (Resident, Staff, Admin)
3. Initial multilingual and code-mixed civic complaints
"""
import asyncio
from datetime import datetime, timezone
import uuid
from sqlalchemy import select

from app.database.session import AsyncSessionLocal, create_tables
from app.models.models import (
    User, UserRole, Department, ComplaintCategory,
    Complaint, ComplaintStatus, Priority, LanguageCode, ComplaintStatusHistory
)
from app.security.auth import hash_password


CATEGORIES_DATA = [
    {
        "id": 1,
        "name": "Water Supply and Leakage",
        "slug": "water_supply",
        "description": "Pipe leaks, water scarcity, contaminated supply, low pressure",
        "icon": "💧",
        "color": "#0284c7",
        "dept_name": "Bangalore Water Supply and Sewerage Board (BWSSB)",
        "dept_code": "BWSSB",
        "dept_email": "water@jansetu.in",
    },
    {
        "id": 2,
        "name": "Roads and Potholes",
        "slug": "roads_potholes",
        "description": "Potholes, broken roads, damaged pavements, footpaths",
        "icon": "🛣️",
        "color": "#92400e",
        "dept_name": "Road Infrastructure & Engineering Division",
        "dept_code": "BBMP-ROADS",
        "dept_email": "roads@jansetu.in",
    },
    {
        "id": 3,
        "name": "Garbage and Sanitation",
        "slug": "garbage_sanitation",
        "description": "Garbage dumps, missed collection, unhygienic spots, dead animals",
        "icon": "🗑️",
        "color": "#166534",
        "dept_name": "Solid Waste Management Department",
        "dept_code": "SWM",
        "dept_email": "swm@jansetu.in",
    },
    {
        "id": 4,
        "name": "Electricity and Streetlights",
        "slug": "electricity_lights",
        "description": "Broken streetlights, faulty transformers, loose live wires, outages",
        "icon": "💡",
        "color": "#a16207",
        "dept_name": "Electricity Supply Company (BESCOM)",
        "dept_code": "BESCOM",
        "dept_email": "electricity@jansetu.in",
    },
    {
        "id": 5,
        "name": "Drainage and Sewage",
        "slug": "drainage_sewage",
        "description": "Blocked drains, overflowing sewage, open manholes, storm water",
        "icon": "🌊",
        "color": "#0369a1",
        "dept_name": "Stormwater & Underground Drainage Cell",
        "dept_code": "SWD",
        "dept_email": "drainage@jansetu.in",
    },
    {
        "id": 6,
        "name": "Public Safety Hazards",
        "slug": "public_safety",
        "description": "Fallen trees, dangerous poles, open construction pits, fire risks",
        "icon": "⚠️",
        "color": "#dc2626",
        "dept_name": "Disaster Management & Public Safety",
        "dept_code": "SAFETY",
        "dept_email": "safety@jansetu.in",
    },
    {
        "id": 7,
        "name": "Public Transport",
        "slug": "public_transport",
        "description": "Bus frequency, bus stops, metro feeder issues, illegal parking",
        "icon": "🚌",
        "color": "#7c3aed",
        "dept_name": "Metropolitan Transport Corporation",
        "dept_code": "BMTC",
        "dept_email": "transport@jansetu.in",
    },
    {
        "id": 8,
        "name": "Other / Unclassified",
        "slug": "other",
        "description": "General civic issues, stray animal menace, noise pollution",
        "icon": "📋",
        "color": "#6b7280",
        "dept_name": "Citizen Grievance Redressal Cell",
        "dept_code": "GRIEVANCE",
        "dept_email": "general@jansetu.in",
    },
]

DEMO_USERS = [
    {
        "email": "resident@jansetu.in",
        "full_name": "Aarav Sharma",
        "phone": "+91 98765 43210",
        "password": "Resident@123",
        "role": UserRole.resident,
    },
    {
        "email": "staff@jansetu.in",
        "full_name": "Priya Nair",
        "phone": "+91 98765 43211",
        "password": "Staff@123",
        "role": UserRole.staff,
    },
    {
        "email": "admin@jansetu.in",
        "full_name": "Chief Commissioner Admin",
        "phone": "+91 98765 43212",
        "password": "Admin@123",
        "role": UserRole.admin,
    },
]

SAMPLE_COMPLAINTS = [
    {
        "text": "Mere area Indiranagar 100ft road mein paani nahi aa raha hai pichle 2 din se. Bahut pareshani ho rahi hai.",
        "lang": LanguageCode.hinglish,
        "code_mixed": True,
        "cat_slug": "water_supply",
        "priority": Priority.high,
        "status": ComplaintStatus.in_progress,
        "location": "100ft Road, Indiranagar, Bengaluru",
        "lat": 12.9784,
        "lng": 77.6408,
    },
    {
        "text": "Road alli tumba potholes ide, car suspension damage agtide. Accident chances are very high near metro.",
        "lang": LanguageCode.kanglish,
        "code_mixed": True,
        "cat_slug": "roads_potholes",
        "priority": Priority.high,
        "status": ComplaintStatus.under_review,
        "location": "Near Swami Vivekananda Metro Station, Old Madras Road",
        "lat": 12.9860,
        "lng": 77.6387,
    },
    {
        "text": "Hamare street corner pe garbage collect nahi hua hai 5 din se, bad smell aa rahi hai aur stray dogs gathering here.",
        "lang": LanguageCode.hinglish,
        "code_mixed": True,
        "cat_slug": "garbage_sanitation",
        "priority": Priority.normal,
        "status": ComplaintStatus.submitted,
        "location": "4th Cross, Koramangala 5th Block",
        "lat": 12.9352,
        "lng": 77.6245,
    },
    {
        "text": "Street light work agtilla pichle 1 week se, raat ko raste pe andhera rehta hai safety issue ide.",
        "lang": LanguageCode.kanglish,
        "code_mixed": True,
        "cat_slug": "electricity_lights",
        "priority": Priority.normal,
        "status": ComplaintStatus.resolved,
        "location": "17th Main, HSR Layout Sector 4",
        "lat": 12.9116,
        "lng": 77.6389,
    },
    {
        "text": "Open drainage overflowing on road in front of hospital, dirty water coming into pedestrian pathway.",
        "lang": LanguageCode.en,
        "code_mixed": False,
        "cat_slug": "drainage_sewage",
        "priority": Priority.urgent,
        "status": ComplaintStatus.assigned,
        "location": "Outer Ring Road, Marathahalli",
        "lat": 12.9592,
        "lng": 77.6974,
    },
    {
        "text": "High voltage wire broken and hanging down near school gate! It can cause electric shock, please fix urgently!",
        "lang": LanguageCode.en,
        "code_mixed": False,
        "cat_slug": "public_safety",
        "priority": Priority.urgent,
        "status": ComplaintStatus.assigned,
        "location": "Govt High School, Malleshwaram 8th Cross",
        "lat": 13.0031,
        "lng": 77.5703,
    },
]


async def seed():
    print("[SEED] Initializing database tables...")
    await create_tables()

    async with AsyncSessionLocal() as session:
        # 1. Departments & Categories
        print("[SEED] Seeding categories and departments...")
        dept_map = {}
        for cat_info in CATEGORIES_DATA:
            res = await session.execute(
                select(Department).where(Department.code == cat_info["dept_code"])
            )
            dept = res.scalar_one_or_none()
            if not dept:
                dept = Department(
                    id=str(uuid.uuid4()),
                    name=cat_info["dept_name"],
                    code=cat_info["dept_code"],
                    contact_email=cat_info["dept_email"],
                    is_active=True,
                )
                session.add(dept)
                await session.flush()
            dept_map[cat_info["slug"]] = dept

            res_cat = await session.execute(
                select(ComplaintCategory).where(ComplaintCategory.slug == cat_info["slug"])
            )
            cat = res_cat.scalar_one_or_none()
            if not cat:
                cat = ComplaintCategory(
                    id=cat_info["id"],
                    name=cat_info["name"],
                    slug=cat_info["slug"],
                    description=cat_info["description"],
                    icon=cat_info["icon"],
                    default_department_id=dept.id,
                    is_active=True,
                )
                session.add(cat)

        # 2. Users
        print("[SEED] Seeding demo users...")
        user_map = {}
        for u_info in DEMO_USERS:
            res_user = await session.execute(
                select(User).where(User.email == u_info["email"])
            )
            user = res_user.scalar_one_or_none()
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    email=u_info["email"],
                    full_name=u_info["full_name"],
                    phone=u_info["phone"],
                    hashed_password=hash_password(u_info["password"]),
                    role=u_info["role"],
                    is_active=True,
                )
                session.add(user)
                await session.flush()
            user_map[u_info["role"]] = user

        # 3. Complaints
        print("[SEED] Seeding complaints...")
        resident_user = user_map[UserRole.resident]

        # Get existing count
        res_existing = await session.execute(select(Complaint))
        existing_complaints = res_existing.scalars().all()

        if len(existing_complaints) == 0:
            for idx, c_info in enumerate(SAMPLE_COMPLAINTS, start=1):
                # Fetch category
                res_c = await session.execute(
                    select(ComplaintCategory).where(ComplaintCategory.slug == c_info["cat_slug"])
                )
                category = res_c.scalar_one_or_none()
                cat_id = category.id if category else 1

                ref_id = f"JS-{2026}{idx:04d}"
                comp = Complaint(
                    id=str(uuid.uuid4()),
                    reference_id=ref_id,
                    user_id=resident_user.id,
                    category_id=cat_id,
                    original_text=c_info["text"],
                    edited_text=c_info["text"],
                    language=c_info["lang"],
                    is_code_mixed=c_info["code_mixed"],
                    status=c_info["status"],
                    priority=c_info["priority"],
                    location_text=c_info["location"],
                    latitude=c_info["lat"],
                    longitude=c_info["lng"],
                )
                session.add(comp)
                await session.flush()

                # Add initial status history
                history = ComplaintStatusHistory(
                    id=str(uuid.uuid4()),
                    complaint_id=comp.id,
                    status=comp.status,
                    note="Complaint logged into JanSetu AI municipal queue.",
                    changed_by_id=resident_user.id,
                )
                session.add(history)

        await session.commit()
        print("[SEED] Database seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
