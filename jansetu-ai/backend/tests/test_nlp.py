"""
Unit tests for JanSetu AI NLP Service & Preprocessor
"""
import pytest
from app.services.nlp_service import nlp_service, CATEGORIES


def test_preprocess_basic():
    text = "   Water pipe is LEAKING in our area!!!   "
    clean = nlp_service.preprocess(text)
    assert clean == "water pipe is leaking in our area!!!"


def test_language_detection_hinglish():
    text = "Mere area mein paani nahi aa raha hai"
    lang, is_code_mixed = nlp_service.detect_language(text)
    assert lang == "hinglish"
    assert is_code_mixed is True


def test_language_detection_kanglish():
    text = "Namma area alli road tumba damage aagide"
    lang, is_code_mixed = nlp_service.detect_language(text)
    assert lang == "kanglish"
    assert is_code_mixed is True


def test_language_detection_english():
    text = "The streetlight on 5th cross has been turned off for three days."
    lang, is_code_mixed = nlp_service.detect_language(text)
    assert lang == "en"
    assert is_code_mixed is False


def test_priority_extraction_urgent():
    text = "Electric wire broken and sparked near school gate, high danger!"
    priority, reason = nlp_service.detect_priority(text)
    assert priority == "urgent"


def test_priority_extraction_high():
    text = "Hamare area mein paani nahi hai 3 din se"
    priority, reason = nlp_service.detect_priority(text)
    assert priority in ("high", "urgent")


def test_model_classification_inference():
    text = "Heavy water pipe leakage in indiranagar"
    res = nlp_service.classify(text, model_name="svm")
    assert res is not None
    assert "predicted_category" in res
    assert res["predicted_category"]["category_id"] == 1  # Water Supply
    assert res["model_name"] == "svm"
    assert res["latency_ms"] > 0


def test_model_info():
    info = nlp_service.get_model_info()
    assert len(info) >= 2
    model_names = [m["name"] for m in info]
    assert "logistic_regression" in model_names
    assert "svm" in model_names
