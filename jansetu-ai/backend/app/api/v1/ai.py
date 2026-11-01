"""AI / NLP endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional, List
from datetime import datetime
import math

from app.database.session import get_db
from app.models.models import Complaint, ComplaintCategory, ModelPrediction, User
from app.schemas.schemas import ClassifyRequest, ClassifyResponse, ModelInfoResponse, DuplicateCandidate
from app.services.nlp_service import nlp_service, CATEGORIES
from app.security.dependencies import get_current_user, get_optional_user

router = APIRouter()


@router.post("/classify", response_model=ClassifyResponse)
async def classify_complaint(
    req: ClassifyRequest,
    model: Optional[str] = Query(None, description="Model to use: logistic_regression | svm"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Classify a complaint text using the specified (or default) model."""
    result = nlp_service.classify(req.text, model_name=model)

    # Find similar complaints (TF-IDF cosine similarity via stored texts)
    similar = await _find_similar(req.text, db, current_user.id if current_user else None, top_k=3)
    result["similar_complaints"] = similar

    # Save prediction record
    pred = ModelPrediction(
        complaint_id=None,
        model_name=result["model_name"],
        model_version=result["model_version"],
        input_text=req.text,
        predicted_category_id=result["predicted_category"]["category_id"],
        confidence=result["predicted_category"].get("confidence"),
        raw_output=result,
        latency_ms=result["latency_ms"],
    )
    db.add(pred)
    await db.commit()

    return result


@router.post("/duplicates")
async def find_duplicates(
    req: ClassifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Find potentially duplicate complaints by semantic similarity."""
    similar = await _find_similar(req.text, db, current_user.id if current_user else None, top_k=5)
    return {"similar_complaints": similar, "query": req.text}


@router.get("/model-info", response_model=List[ModelInfoResponse])
async def get_model_info():
    """Return metadata for all available trained models."""
    return nlp_service.get_model_info()


@router.get("/evaluation")
async def get_evaluation_results():
    """Return evaluation metrics for trained models (from saved eval reports)."""
    from pathlib import Path
    import json
    results = {}
    for model_name in ["logistic_regression", "svm"]:
        report_path = Path(nlp_service.models_dir) / f"{model_name}_eval.json"
        if report_path.exists():
            with open(report_path) as f:
                results[model_name] = json.load(f)
        else:
            results[model_name] = {"status": "not_evaluated", "message": "Run ml/evaluation/evaluate.py to generate."}
    return results


# ── Helper: TF-IDF cosine similarity ──────────────────────────────────────────
async def _find_similar(
    text: str,
    db: AsyncSession,
    exclude_user_id: Optional[str] = None,
    top_k: int = 3,
) -> List[dict]:
    """Find similar complaints using TF-IDF cosine similarity."""
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np

        # Load recent complaints (last 500)
        stmt = select(Complaint).order_by(desc(Complaint.created_at)).limit(500)
        if exclude_user_id:
            stmt = stmt.where(Complaint.user_id != exclude_user_id)
        res = await db.execute(stmt)
        complaints = res.scalars().all()
        if not complaints:
            return []

        corpus = [c.edited_text or c.original_text for c in complaints]
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = vectorizer.transform([text])
        scores = cosine_similarity(query_vec, tfidf_matrix)[0]

        top_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score < 0.1:
                continue
            c = complaints[idx]
            created_str = c.created_at.isoformat() if hasattr(c.created_at, 'isoformat') else str(c.created_at)
            results.append({
                "complaint_id": str(c.id),
                "reference_id": c.reference_id,
                "text_snippet": (c.edited_text or c.original_text)[:120],
                "similarity_score": round(score, 3),
                "category_name": None,
                "status": str(c.status),
                "created_at": created_str,
            })
        return results
    except Exception as e:
        print(f"[NLP] Similarity search failed: {e}")
        return []
