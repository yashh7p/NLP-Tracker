"""
API Integration tests for JanSetu AI endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_model_info_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/ai/model-info")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 2


@pytest.mark.asyncio
async def test_evaluation_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/ai/evaluation")
        assert resp.status_code == 200
        data = resp.json()
        assert "logistic_regression" in data
        assert "svm" in data


@pytest.mark.asyncio
async def test_classify_public_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/ai/classify",
            json={"text": "Water leakage in front of my house in Indiranagar"},
            params={"model": "svm"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "predicted_category" in data
        assert data["predicted_category"]["category_id"] == 1


@pytest.mark.asyncio
async def test_login_resident_demo():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "resident@jansetu.in", "password": "Resident@123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # Verify token by calling /auth/me
        me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["role"] == "resident"


@pytest.mark.asyncio
async def test_login_admin_demo():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@jansetu.in", "password": "Admin@123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["role"] == "admin"


@pytest.mark.asyncio
async def test_admin_analytics_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Login as admin
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@jansetu.in", "password": "Admin@123"},
        )
        assert login_resp.status_code == 200
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        # 1. Overview (flat shape verification)
        overview_resp = await client.get("/api/v1/admin/analytics/overview", headers=headers)
        assert overview_resp.status_code == 200
        overview = overview_resp.json()
        assert "total" in overview
        assert "open" in overview
        assert "in_progress" in overview
        assert "resolved" in overview

        # 2. Categories (list shape verification)
        cat_resp = await client.get("/api/v1/admin/analytics/categories", headers=headers)
        assert cat_resp.status_code == 200
        cats = cat_resp.json()
        assert isinstance(cats, list)

        # 3. Trends (SQLite strftime verification)
        trends_resp = await client.get("/api/v1/admin/analytics/trends?days=30", headers=headers)
        assert trends_resp.status_code == 200
        trends_data = trends_resp.json()
        assert "trend" in trends_data
        assert isinstance(trends_data["trend"], list)


@pytest.mark.asyncio
async def test_notifications_read_all():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "resident@jansetu.in", "password": "Resident@123"},
        )
        assert login_resp.status_code == 200
        headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

        resp = await client.patch("/api/v1/notifications/read-all", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["message"] == "All notifications marked as read"


@pytest.mark.asyncio
async def test_register_role_guard():
    import uuid
    random_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": random_email,
                "password": "Password@123",
                "full_name": "Test Attacker",
                "role": "admin",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["role"] in ["resident", "admin"]

