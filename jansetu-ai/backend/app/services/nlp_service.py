"""
NLP inference service — loads trained models from disk and provides
classification, language detection, and semantic similarity.
"""
import time
import os
import json
import re
import unicodedata
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple

import joblib
import numpy as np
from sklearn.pipeline import Pipeline

from app.core.config import settings


# ── Category registry ──────────────────────────────────────────────────────────
CATEGORIES = [
    {"id": 1, "name": "Water Supply and Leakage",    "slug": "water_supply"},
    {"id": 2, "name": "Roads and Potholes",           "slug": "roads_potholes"},
    {"id": 3, "name": "Garbage and Sanitation",       "slug": "garbage_sanitation"},
    {"id": 4, "name": "Electricity and Streetlights", "slug": "electricity_lights"},
    {"id": 5, "name": "Drainage and Sewage",          "slug": "drainage_sewage"},
    {"id": 6, "name": "Public Safety Hazards",        "slug": "public_safety"},
    {"id": 7, "name": "Public Transport",             "slug": "public_transport"},
    {"id": 8, "name": "Other / Unclassified",         "slug": "other"},
]
CAT_BY_SLUG = {c["slug"]: c for c in CATEGORIES}
CAT_BY_ID = {c["id"]: c for c in CATEGORIES}
SLUG_LIST = [c["slug"] for c in CATEGORIES]


# ── Priority keywords ──────────────────────────────────────────────────────────
URGENT_PATTERNS = [
    r"\bfire\b", r"\belectr(ic|ical).?(shock|spark|hazard|wire)\b",
    r"\bspark(ed|ing)?\b",
    r"\bflooding\b", r"\bflood\b", r"\bstructural.?collapse\b",
    r"\bgas.?leak\b", r"\bopen.?(manhole|drain)\b", r"\bdead\b",
    r"\baccident\b", r"\bdanger(ous)?\b", r"\bkhatra\b",
]
HIGH_PATTERNS = [
    r"\bno.?water\b", r"\bpaani\s*(nahi|ka|ki|problem|issue)\b",
    r"\bpani\s*(nahi|ka|ki|problem)\b",
    r"\bbijli\s*(nahi|ka|ki|problem|gul|cut)\b",
    r"\blight\s*(band|off|nahi|problem)\b",
    r"\bsewage.?overflow\b", r"\bpothole.?(large|deep|major)\b",
    r"\bstreet.?light\b", r"\bgutter\b", r"\bkachra\b",
    r"\bsadak\s*(ka|ki|problem|tuti)\b",
    r"\bnaali\s*(band|overflow|ka|ki|problem)\b",
]


class NLPService:
    """Loads and serves TF-IDF + Logistic Regression / SVM models."""

    def __init__(self):
        self._models: Dict[str, Any] = {}
        self._metadata: Dict[str, Any] = {}
        self._tfidf_vectorizers: Dict[str, Any] = {}
        self._loaded = False
        models_dir = Path(settings.ML_MODELS_DIR)
        if not models_dir.exists():
            candidate = Path(__file__).resolve().parent.parent.parent.parent / "ml" / "models"
            if candidate.exists():
                models_dir = candidate
        self.models_dir = models_dir

    def _ensure_loaded(self):
        if not self._loaded:
            self._load_models()
            self._loaded = True

    def _load_models(self):
        """Attempt to load saved models; fall back gracefully."""
        for model_name in ["logistic_regression", "svm"]:
            model_path = self.models_dir / f"{model_name}_pipeline.joblib"
            meta_path = self.models_dir / f"{model_name}_metadata.json"
            if model_path.exists():
                try:
                    self._models[model_name] = joblib.load(model_path)
                    if meta_path.exists():
                        with open(meta_path) as f:
                            self._metadata[model_name] = json.load(f)
                except Exception as e:
                    print(f"[NLP] Could not load {model_name}: {e}")

    # ── Preprocessing ──────────────────────────────────────────────────────────
    @staticmethod
    def preprocess(text: str) -> str:
        """
        Normalise unicode, collapse whitespace, preserve negations and
        important context words. Avoids aggressive stemming.
        """
        # Unicode normalisation (NFC)
        text = unicodedata.normalize("NFC", text)
        # Remove control characters, keep printable + basic unicode
        text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C")
        # Lowercase
        text = text.lower()
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    # ── Language detection ───────────────────────────────────────────────────
    @staticmethod
    def detect_language(text: str) -> Tuple[str, bool]:
        """
        Multilingual language detection supporting both native scripts and Romanized code-mixed text.
        Supports Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Gujarati, English, and code-mixing.
        Returns (language_code, is_code_mixed).
        """
        # 1. Native script detection
        has_devanagari = bool(re.search(r"[\u0900-\u097F]", text))
        has_kannada    = bool(re.search(r"[\u0C80-\u0CFF]", text))
        has_tamil      = bool(re.search(r"[\u0B80-\u0BFF]", text))
        has_telugu     = bool(re.search(r"[\u0C00-\u0C7F]", text))
        has_bengali    = bool(re.search(r"[\u0980-\u09FF]", text))
        has_gujarati   = bool(re.search(r"[\u0A80-\u0AFF]", text))
        has_latin      = bool(re.search(r"[a-zA-Z]", text))

        if has_kannada:
            return "kn", has_latin
        if has_tamil:
            return "ta", has_latin
        if has_telugu:
            return "te", has_latin
        if has_bengali:
            return "bn", has_latin
        if has_gujarati:
            return "gu", has_latin
        if has_devanagari:
            # Check for Marathi specific markers
            marathi_markers = {"आहे", "नाही", "आणि", "झाले", "रस्त्यावर"}
            if any(w in text for w in marathi_markers):
                return "mr", has_latin
            return "hi", has_latin

        # 2. Romanized heuristic detection (Hinglish, Kanglish, English)
        hindi_words = {
            "nahi", "mein", "hai", "ka", "ki", "ko", "se", "aur", "kya",
            "kuch", "log", "paani", "bijli", "sadak", "ghar", "mere",
            "humara", "hamare", "area", "pani", "kachra", "gatta", "naali",
            "kar", "raha", "rahe", "bhi", "bahut", "karo", "gaya",
            "problem", "samasya", "kami", "kharab", "band", "nahi", "hai",
            "bahut", "zyada", "thoda", "jaldi", "please", "bhai", "yahan",
            "hamara", "hamare", "wahan", "idhar", "udhar",
        }
        kannada_words = {
            "alli", "ide", "illa", "namma", "avru", "bartha", "agtilla",
            "madidare", "kastu", "tumba", "beku", "neeru", "gundi", "kasa",
            "aitu", "maadi", "agide", "nodi", "bidbedi", "kelsa",
        }
        words = set(text.lower().split())

        hi_hits = len(words & hindi_words)
        kn_hits = len(words & kannada_words)
        common_en = {
            "the", "is", "are", "was", "were", "there", "road", "water",
            "light", "street", "garbage", "drain", "bus", "near", "have",
            "has", "been", "on", "in", "at", "for", "of", "to", "and", "off",
            "our", "my", "we", "this", "that", "days", "problem", "issue", "please",
            "not", "working", "broken", "overflow", "blocked",
        }
        en_hits = len(words & common_en)
        is_code_mixed = (hi_hits > 0 and (en_hits > 0 or "area" in words)) or (kn_hits > 0 and (en_hits > 0 or "area" in words))

        if kn_hits >= 1:
            return ("kanglish" if is_code_mixed else "kn"), is_code_mixed
        if hi_hits >= 1:
            return ("hinglish" if is_code_mixed else "hi"), is_code_mixed
        if en_hits >= 1:
            return "en", False
        return ("en" if has_latin else "unknown"), is_code_mixed


    # ── Priority detection ─────────────────────────────────────────────────────
    @staticmethod
    def detect_priority(text: str) -> Tuple[str, str]:
        """Returns (priority_level, reason) supporting multilingual patterns."""
        lower = text.lower()
        urgent_native = [
            "आग", "करंट", "खतरा", "हादसा", "दुर्घटना", "विस्फोट", "बिजली का झटका",
            "अಪಾಯ", "ಬೆಂಕಿ", "ವಿದ್ಯುತ್ ಶಾಕ್", "ಅಪಘಾತ", "ತೀವ್ರ", "తీవ్ర", "ప్రమాదం", "தீ"
        ]
        if any(w in text for w in urgent_native):
            return "urgent", "Contains urgent safety indicator"

        for pattern in URGENT_PATTERNS:
            if re.search(pattern, lower):
                return "urgent", f"Contains urgent safety indicator: '{pattern}'"

        high_native = [
            "पानी नहीं", "बिजली नहीं", "गटर ओवरफ्लो", "सड़क टूटी", "कचरा",
            "ನೀರಿಲ್ಲ", "ವಿದ್ಯುತ್ ಇಲ್ಲ", "ಚರಂಡಿ ನೀರು", "ಗುಂಡಿ ಬಿದ್ದಿದೆ"
        ]
        if any(w in text for w in high_native):
            return "high", "Involves critical civic service disruption"

        for pattern in HIGH_PATTERNS:
            if re.search(pattern, lower):
                return "high", "Involves critical civic service disruption"
        return "normal", "Standard complaint"

    # ── Classification ─────────────────────────────────────────────────────────
    def classify(self, text: str, model_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Classify a complaint. Returns structured prediction dict.
        Uses the requested model if available, else falls back to rule-based.
        """
        self._ensure_loaded()
        model_name = model_name or settings.DEFAULT_MODEL
        processed = self.preprocess(text)
        lang, is_mixed = self.detect_language(processed)
        priority, priority_reason = self.detect_priority(text)

        start = time.time()

        # Run rule-based domain detection in parallel
        rule_cat = self._rule_based(text)

        if model_name in self._models:
            pipeline: Pipeline = self._models[model_name]
            meta = self._metadata.get(model_name, {})
            try:
                pred_idx = pipeline.predict([processed])[0]
                classes = [str(c) for c in getattr(pipeline, "classes_", [])]

                # Map predict_proba correctly to pipeline.classes_
                if hasattr(pipeline, "predict_proba") and len(classes) > 0:
                    proba = pipeline.predict_proba([processed])[0]
                    top_indices = np.argsort(proba)[::-1][:5]
                    all_preds = []
                    for i in top_indices:
                        if i < len(classes):
                            slug = classes[i]
                            c_info = CAT_BY_SLUG.get(slug, CATEGORIES[-1])
                            all_preds.append({
                                "category_id": int(c_info["id"]),
                                "category_name": str(c_info["name"]),
                                "category_slug": str(c_info["slug"]),
                                "confidence": round(float(proba[i]), 4),
                            })
                    confidence = round(float(proba[top_indices[0]]), 4) if len(top_indices) > 0 else None
                else:
                    confidence = None
                    all_preds = []

                # pred_idx is the label (slug string or integer index in classes)
                pred_slug = str(pred_idx)
                if pred_slug in CAT_BY_SLUG:
                    cat = CAT_BY_SLUG[pred_slug]
                elif isinstance(pred_idx, (int, np.integer)) and 0 <= int(pred_idx) < len(classes):
                    cat = CAT_BY_SLUG.get(classes[int(pred_idx)], CATEGORIES[-1])
                else:
                    cat = CATEGORIES[-1]

                # Domain keyword ensemble boost: if strong civic keyword detected and model is uncertain
                strong_keywords = ["kachra", "garbage", "kooda", "safai", "paani", "water", "pipe", "neeru", "bijli", "light", "current", "pothole", "sadak", "naali", "drain", "sewage", "g गड्ढा"]
                has_strong_kw = any(kw in processed.lower() for kw in strong_keywords)
                if rule_cat["slug"] != "other" and (cat["slug"] == "other" or (confidence and confidence < 0.40) or has_strong_kw):
                    cat = rule_cat
                    confidence = max(confidence or 0.85, 0.85)

                latency_ms = round((time.time() - start) * 1000, 2)
                return {
                    "predicted_category": {
                        "category_id": int(cat["id"]),
                        "category_name": str(cat["name"]),
                        "category_slug": str(cat["slug"]),
                        "confidence": confidence,
                    },
                    "all_predictions": all_preds or [
                        {"category_id": int(cat["id"]), "category_name": str(cat["name"]),
                         "category_slug": str(cat["slug"]), "confidence": confidence}
                    ],
                    "detected_language": lang,
                    "is_code_mixed": is_mixed,
                    "suggested_priority": priority,
                    "priority_reason": priority_reason,
                    "model_name": model_name,
                    "model_version": meta.get("version", "1.0.0"),
                    "latency_ms": latency_ms,
                }
            except Exception as e:
                print(f"[NLP] Inference error with {model_name}: {e}")

        # ── Rule-based fallback ────────────────────────────────────────────────
        latency_ms = (time.time() - start) * 1000
        cat = self._rule_based(processed)
        return {
            "predicted_category": {
                "category_id": cat["id"],
                "category_name": cat["name"],
                "category_slug": cat["slug"],
                "confidence": None,
            },
            "all_predictions": [
                {"category_id": cat["id"], "category_name": cat["name"],
                 "category_slug": cat["slug"], "confidence": None}
            ],
            "detected_language": lang,
            "is_code_mixed": is_mixed,
            "suggested_priority": priority,
            "priority_reason": priority_reason,
            "model_name": "rule_based_fallback",
            "model_version": "1.0.0",
            "latency_ms": latency_ms,
        }

    @staticmethod
    def _rule_based(text: str) -> Dict:
        """
        Multilingual keyword-based classification fallback.
        Supports native scripts, romanized words, and common Hinglish/Kanglish
        possessive constructions like 'paani ka problem', 'bijli ki samasya'.
        """
        # Normalize common possessive/descriptive patterns first
        # e.g. "paani ka problem" → contains "paani"; "bijli ki samasya" → contains "bijli"
        # These are already matched as sub-keywords, but we expand variant spellings:
        text_lower = text.lower()

        # Compound pattern expansion — map common phrases to their primary keyword
        compound_map = {
            # Water variants
            "paani ka": "paani", "pani ka": "paani", "paani ki": "paani",
            "water ka": "water", "water ki": "water", "water problem": "water",
            "paani problem": "paani", "pani problem": "paani",
            "neeru illa": "neeru", "neeru bartha": "neeru",
            # Road variants
            "sadak ka": "sadak", "sadak ki": "sadak", "sadak problem": "sadak",
            "road problem": "road", "pothole problem": "pothole",
            "rasta kharab": "road", "raste mein": "sadak",
            # Electricity variants
            "bijli ka": "bijli", "bijli ki": "bijli", "bijli problem": "bijli",
            "light problem": "light", "light nahi": "bijli", "bijli nahi": "bijli",
            "light band": "light", "light off": "light",
            "current nahi": "bijli", "power cut": "bijli",
            # Garbage variants
            "kachra ka": "kachra", "kachra ki": "kachra", "garbage problem": "garbage",
            "safai nahi": "garbage", "kachra nahi": "kachra",
            # Drainage variants
            "naali ka": "naali", "naali ki": "naali", "drain problem": "drain",
            "gutter problem": "gutter", "sewage problem": "sewage",
            "naali band": "naali", "naali overflow": "naali",
            # Safety variants
            "danger hai": "danger", "khatra hai": "khatra",
        }

        for phrase, replacement in compound_map.items():
            if phrase in text_lower:
                text_lower = text_lower.replace(phrase, replacement)

        # Now run standard keyword matching on (possibly expanded) text
        rules = [
            (
                ["water", "paani", "pani", "pipe", "leakage", "leak", "supply", "tap",
                 "neeru", "drinking water", "no water", "water nahi",
                 "पानी", "जल", "नल", "पाइप", "लीकेज", "पानी की समस्या",
                 "ನೀರು", "ನಲ್ಲಿ", "ಕುಡಿಯುವ ನೀರು", "தண்ணீர்", "నీరు",
                 "pani", "jal", "nali", "nalka"],
                CATEGORIES[0]
            ),
            (
                ["road", "pothole", "potholes", "sadak", "tar", "asphalt", "rasta",
                 "gundi", "gutter road", "broken road", "damaged road",
                 "सड़क", "गड्ढा", "गड्ढे", "डामर", "रास्ता", "सड़क टूटी",
                 "ರಸ್ತೆ", "ಗುಂಡಿ", "ಡಾಂಬರು", "சாலை", "రహదారి", "గుంతలు"],
                CATEGORIES[1]
            ),
            (
                ["garbage", "waste", "dustbin", "sanitation", "kachra", "clean", "kasa",
                 "safai", "sweeping", "trash", "rubbish", "litter",
                 "कचरा", "कूड़ा", "सफाई", "डस्टबिन", "कचरे",
                 "ಕಸ", "ತ್ಯಾಜ್ಯ", "ಸ್ವಚ್ಛತೆ", "குப்பை", "చెత్త"],
                CATEGORIES[2]
            ),
            (
                ["electricity", "light", "streetlight", "bijli", "power", "wire",
                 "current", "vidyut", "blackout", "no power", "dark",
                 "बिजली", "करंट", "बत्ती", "लाइट", "स्ट्रीट लाइट", "तार", "अंधेरा",
                 "ವಿದ್ಯುತ್", "ದೀಪ", "ಬೆಳಕು", "மின்சாரம்", "విద్యుత్"],
                CATEGORIES[3]
            ),
            (
                ["drain", "drainage", "sewage", "gutter", "overflow", "naali",
                 "charandi", "gatar", "blockage", "blocked drain", "manhole",
                 "नाली", "गटर", "सीवर", "नालियां", "बदबू", "सीवेज",
                 "ಗಟಾರ", "ಚರಂಡಿ", "ಮಳೆನೀರು", "சாக்கடை", "మురుగుకాల్వ"],
                CATEGORIES[4]
            ),
            (
                ["safety", "hazard", "dangerous", "accident", "fire", "khatra",
                 "aag", "apaya", "benki", "danger", "risk", "threat",
                 "खतरा", "आग", "दुर्घटना", "हादसा", "करंट लगना", "खतरनाक",
                 "ಅಪಾಯ", "ಬೆಂಕಿ", "ಆಪತ್ತು", "தீ", "ప్రమాదం"],
                CATEGORIES[5]
            ),
            (
                ["bus", "transport", "auto", "route", "metro", "train", "stop",
                 "gaadi", "bussu", "vehicle", "rickshaw",
                 "बस", "गाड़ी", "मेट्रो", "ऑटो", "स्टॉप", "बस स्टैंड",
                 "ಬಸ್ಸು", "ಸಾರಿಗೆ", "ಮೆಟ್ರೋ", "பேருந்து", "బస్సు"],
                CATEGORIES[6]
            ),
        ]

        for keywords, cat in rules:
            if any(kw in text_lower for kw in keywords):
                return cat

        # Also check original text for native script keywords (not lowercased)
        native_rules = [
            (["पानी", "जल", "नल", "ಕುಡಿಯುವ ನೀರು", "தண்ணீர்"], CATEGORIES[0]),
            (["सड़क", "गड्ढा", "ರಸ್ತೆ", "ಗುಂಡಿ"], CATEGORIES[1]),
            (["कचरा", "ಕಸ", "குப்பை"], CATEGORIES[2]),
            (["बिजली", "ವಿದ್ಯುತ್", "மின்சாரம்"], CATEGORIES[3]),
            (["नाली", "गटर", "ಚರಂಡಿ"], CATEGORIES[4]),
            (["खतरा", "आग", "ಅಪಾಯ"], CATEGORIES[5]),
            (["बस", "ಬಸ್ಸು"], CATEGORIES[6]),
        ]
        for keywords, cat in native_rules:
            if any(kw in text for kw in keywords):
                return cat

        return CATEGORIES[-1]

    def get_model_info(self) -> List[Dict]:
        """Return metadata for all available models."""
        self._ensure_loaded()
        results = []
        for model_name in ["logistic_regression", "svm", "transformer"]:
            meta = self._metadata.get(model_name, {})
            available = model_name in self._models
            results.append({
                "name": model_name,
                "version": meta.get("version", "1.0.0"),
                "description": meta.get("description", ""),
                "trained_at": meta.get("trained_at"),
                "accuracy": meta.get("accuracy"),
                "macro_f1": meta.get("macro_f1"),
                "is_available": available,
                "notes": meta.get("notes", "Model not yet trained." if not available else ""),
            })
        return results


# Singleton
nlp_service = NLPService()
