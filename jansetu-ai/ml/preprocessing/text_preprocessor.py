"""
JanSetu AI — NLP Preprocessing Module

Handles:
- Unicode normalisation
- Whitespace/punctuation normalisation
- Emoji handling
- Negation preservation
- Romanized Hindi/Kannada text handling
- Language-aware tokenisation

Design principle: Preserve meaning. Do NOT aggressively remove words
that express negation, severity, or contextual meaning.
"""
import re
import unicodedata
from typing import Tuple


# ── Stop words that should NOT be removed (negation-preserving) ────────────────
PRESERVE_WORDS = {
    # English negations
    "not", "no", "never", "none", "neither", "nor", "nothing", "nowhere",
    "nohow", "without", "lack", "missing", "broken", "failed", "issue",
    # Hindi negations (romanized)
    "nahi", "nahi", "mat", "na", "koi nahi", "nhi",
    # Kannada negations (romanized)
    "illa", "beda", "agtilla", "bartha_illa",
    # Severity
    "dangerous", "urgent", "emergency", "serious", "severe", "critical",
    "very", "extremely", "bahut", "tumba", "kastu",
}

# Emoji → text replacement table (common civic-complaint emojis)
EMOJI_MAP = {
    "💧": " water ",
    "🚰": " tap water ",
    "🔌": " electricity ",
    "💡": " light ",
    "🗑️": " garbage ",
    "🚗": " road vehicle ",
    "⚠️": " warning ",
    "🆘": " emergency ",
    "🔥": " fire ",
    "💦": " water leak ",
    "🌊": " flooding ",
    "🛣️": " road ",
    "🚌": " bus ",
}

# Romanised Hindi/Kannada spelling normalisation
# Maps variant spellings to a canonical form
SPELLING_NORM = {
    # Hindi water
    "paani": "water", "pani": "water",
    # Hindi electricity
    "bijli": "electricity", "current": "electricity",
    # Hindi road
    "sadak": "road", "rastha": "road", "raste": "road",
    # Hindi garbage
    "kachra": "garbage", "kachre": "garbage",
    # Hindi drain
    "naali": "drain", "nali": "drain", "naala": "drain",
    # Hindi not/no
    "nahi": "not", "nhi": "not",
    # Kannada water
    "neeru": "water",
    # Kannada road
    "raste": "road",
    # Common negation
    "illa": "not",
    "agtilla": "not_working",
    "bartha_illa": "not_coming",
}


def replace_emojis(text: str) -> str:
    """Replace known emojis with text equivalents."""
    for emoji, replacement in EMOJI_MAP.items():
        text = text.replace(emoji, replacement)
    # Remove remaining emoji characters (broad unicode ranges for emoji)
    text = re.sub(r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
                  r"\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF"
                  r"\U00002702-\U000027B0\U000024C2-\U0001F251]+", " ", text)
    return text


def normalize_unicode(text: str) -> str:
    """NFC normalisation + remove control characters."""
    text = unicodedata.normalize("NFC", text)
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C")
    return text


def normalize_whitespace(text: str) -> str:
    """Collapse multiple spaces/newlines into single space."""
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def normalize_punctuation(text: str) -> str:
    """Collapse repeated punctuation, preserve sentence-ending marks."""
    text = re.sub(r"[!]{2,}", "!", text)
    text = re.sub(r"[?]{2,}", "?", text)
    text = re.sub(r"[.]{3,}", "...", text)
    text = re.sub(r"[-]{2,}", " ", text)
    return text


def apply_spelling_normalization(text: str, enabled: bool = True) -> str:
    """
    Replace common Romanised regional-language words with English equivalents.

    NOTE: This is an EXPERIMENTAL component. It should be evaluated against
    a held-out test set before enabling in production, as over-normalisation
    can destroy meaning in code-mixed text. Disabled by default in evaluation.
    """
    if not enabled:
        return text
    words = text.split()
    normalised = []
    for w in words:
        normalised.append(SPELLING_NORM.get(w, w))
    return " ".join(normalised)


def preprocess(
    text: str,
    lowercase: bool = True,
    apply_spell_norm: bool = True,
    remove_urls: bool = True,
) -> str:
    """
    Full preprocessing pipeline.

    Pipeline:
    1. Unicode normalisation
    2. Emoji handling
    3. URL removal (optional)
    4. Lowercase
    5. Punctuation normalisation
    6. Whitespace normalisation
    7. Spelling normalisation (optional, experimental)

    Preserves negation words, severity markers, and contextual information.
    Does NOT perform stemming or aggressive stop-word removal.
    """
    if not isinstance(text, str):
        text = str(text)

    text = normalize_unicode(text)
    text = replace_emojis(text)

    if remove_urls:
        text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    if lowercase:
        text = text.lower()

    text = normalize_punctuation(text)
    text = normalize_whitespace(text)
    text = apply_spelling_normalization(text, enabled=apply_spell_norm)
    text = normalize_whitespace(text)

    return text


def detect_language_heuristic(text: str) -> Tuple[str, bool]:
    """
    Heuristic language detection for English, Hinglish, Kanglish.

    Returns:
        (language_code, is_code_mixed)

    Language codes:
        en         — predominantly English
        hi         — predominantly Hindi (Romanised)
        kn         — predominantly Kannada (Romanised)
        hinglish   — Hindi-English code-mixed
        kanglish   — Kannada-English code-mixed
        mixed      — multiple regional languages detected
        unknown    — insufficient signal
    """
    lower = text.lower()
    words = set(lower.split())

    hindi_lexicon = {
        "nahi", "mein", "hai", "ka", "ki", "ko", "se", "aur", "kya",
        "kuch", "log", "paani", "pani", "bijli", "sadak", "ghar", "mere",
        "humara", "hamare", "area", "nhi", "nali", "naali", "kachra",
        "bahut", "raha", "ho", "hain", "hua", "karo",
    }
    kannada_lexicon = {
        "alli", "ide", "illa", "namma", "avru", "bartha", "agtilla",
        "madidare", "kastu", "tumba", "beku", "neeru", "raste",
        "hogbheku", "maadilla", "ilyalla",
    }
    english_lexicon = {
        "the", "is", "are", "was", "there", "road", "water", "light",
        "garbage", "drain", "bus", "near", "have", "has", "not", "no",
        "our", "area", "complaint", "problem", "broken", "issue",
    }

    hi_score = len(words & hindi_lexicon)
    kn_score = len(words & kannada_lexicon)
    en_score = len(words & english_lexicon)

    is_code_mixed = (
        (hi_score >= 1 and en_score >= 1) or
        (kn_score >= 1 and en_score >= 1)
    )

    if kn_score >= 2 and hi_score <= 1:
        lang = "kanglish" if is_code_mixed else "kn"
    elif hi_score >= 2 and kn_score <= 1:
        lang = "hinglish" if is_code_mixed else "hi"
    elif kn_score >= 1 and hi_score >= 1:
        lang = "mixed"
        is_code_mixed = True
    elif en_score >= 2:
        lang = "en"
    else:
        lang = "unknown"

    return lang, is_code_mixed
