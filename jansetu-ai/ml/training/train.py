"""
JanSetu AI — Model Training Script

Trains Model A (TF-IDF + Logistic Regression) and
Model B (TF-IDF + Linear SVM) on the civic complaint dataset.

Usage:
    python train.py [--model lr|svm|all] [--dataset path/to/dataset.csv]

Output:
    ml/models/logistic_regression_pipeline.joblib
    ml/models/logistic_regression_metadata.json
    ml/models/svm_pipeline.joblib
    ml/models/svm_metadata.json
"""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import argparse
import json
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, f1_score, precision_score, recall_score
)

from preprocessing.text_preprocessor import preprocess

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
DATA_PATH = BASE_DIR / "data" / "raw" / "complaints_dataset.csv"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

# ── Category labels (slug → display name) ─────────────────────────────────────
CATEGORY_NAMES = {
    "water_supply":       "Water Supply and Leakage",
    "roads_potholes":     "Roads and Potholes",
    "garbage_sanitation": "Garbage and Sanitation",
    "electricity_lights": "Electricity and Streetlights",
    "drainage_sewage":    "Drainage and Sewage",
    "public_safety":      "Public Safety Hazards",
    "public_transport":   "Public Transport",
    "other":              "Other / Unclassified",
}
LABEL_ORDER = list(CATEGORY_NAMES.keys())


def load_dataset(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["complaint_text"] = df["complaint_text"].astype(str)
    df["category"] = df["category"].str.strip()
    df["processed_text"] = df["complaint_text"].apply(
        lambda t: preprocess(t, apply_spell_norm=True)
    )
    return df


def get_splits(df: pd.DataFrame):
    train = df[df["dataset_split"] == "train"]
    val   = df[df["dataset_split"] == "val"]
    test  = df[df["dataset_split"] == "test"]
    return train, val, test


def evaluate_model(pipeline, X_test, y_test, label_order):
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    macro_p  = precision_score(y_test, y_pred, average="macro", zero_division=0)
    macro_r  = recall_score(y_test, y_pred, average="macro", zero_division=0)

    labels_present = sorted(set(y_test) | set(y_pred))
    report = classification_report(
        y_test, y_pred,
        labels=labels_present,
        target_names=[CATEGORY_NAMES.get(l, l) for l in labels_present],
        output_dict=True, zero_division=0
    )
    cm = confusion_matrix(y_test, y_pred, labels=labels_present).tolist()

    return {
        "accuracy": round(float(acc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "macro_precision": round(float(macro_p), 4),
        "macro_recall": round(float(macro_r), 4),
        "per_class": report,
        "confusion_matrix": cm,
        "confusion_labels": [CATEGORY_NAMES.get(l, l) for l in labels_present],
    }


def train_logistic_regression(X_train, y_train, X_val, y_val, X_test, y_test):
    print("\n[LR] Training TF-IDF + Logistic Regression...")
    t0 = time.time()

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 3),
            max_features=10000,
            sublinear_tf=True,
            min_df=1,
        )),
        ("clf", LogisticRegression(
            max_iter=1000,
            C=1.0,
            solver="lbfgs",
            class_weight="balanced",
            random_state=42,
        )),
    ])
    pipeline.fit(X_train, y_train)
    train_time = time.time() - t0
    print(f"[LR] Trained in {train_time:.2f}s")

    # Latency benchmark
    t_lat = time.time()
    for _ in range(100):
        pipeline.predict(["Water pipe broken in our area"])
    avg_latency_ms = (time.time() - t_lat) / 100 * 1000

    # Evaluate
    val_metrics  = evaluate_model(pipeline, X_val, y_val, LABEL_ORDER)
    test_metrics = evaluate_model(pipeline, X_test, y_test, LABEL_ORDER)

    print(f"[LR] Val  accuracy={val_metrics['accuracy']:.4f}  macro_f1={val_metrics['macro_f1']:.4f}")
    print(f"[LR] Test accuracy={test_metrics['accuracy']:.4f}  macro_f1={test_metrics['macro_f1']:.4f}")

    # Save
    model_path = MODELS_DIR / "logistic_regression_pipeline.joblib"
    joblib.dump(pipeline, model_path)

    metadata = {
        "name": "logistic_regression",
        "version": "1.0.0",
        "description": "TF-IDF (1-3 grams, 10k features) + Logistic Regression (balanced class weights)",
        "trained_at": datetime.utcnow().isoformat(),
        "train_size": len(X_train),
        "val_size": len(X_val),
        "test_size": len(X_test),
        "train_time_seconds": round(train_time, 2),
        "avg_latency_ms": round(avg_latency_ms, 3),
        "accuracy": test_metrics["accuracy"],
        "macro_f1": test_metrics["macro_f1"],
        "val_metrics": val_metrics,
        "test_metrics": test_metrics,
        "notes": "Baseline model. Fast inference. Supports predict_proba for confidence estimation.",
    }
    meta_path = MODELS_DIR / "logistic_regression_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    eval_path = MODELS_DIR / "logistic_regression_eval.json"
    with open(eval_path, "w") as f:
        json.dump({"val": val_metrics, "test": test_metrics, "avg_latency_ms": avg_latency_ms}, f, indent=2)

    print(f"[LR] Saved to {model_path}")
    return pipeline, metadata


def train_svm(X_train, y_train, X_val, y_val, X_test, y_test):
    print("\n[SVM] Training TF-IDF + Linear SVM (CalibratedClassifierCV)...")
    t0 = time.time()

    # LinearSVC wrapped in CalibratedClassifierCV to support predict_proba
    base_svm = LinearSVC(
        C=0.5,
        max_iter=2000,
        class_weight="balanced",
        random_state=42,
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=10000,
            sublinear_tf=True,
            min_df=1,
        )),
        ("clf", CalibratedClassifierCV(base_svm, cv=3, method="sigmoid")),
    ])
    pipeline.fit(X_train, y_train)
    train_time = time.time() - t0
    print(f"[SVM] Trained in {train_time:.2f}s")

    t_lat = time.time()
    for _ in range(100):
        pipeline.predict(["Water pipe broken in our area"])
    avg_latency_ms = (time.time() - t_lat) / 100 * 1000

    val_metrics  = evaluate_model(pipeline, X_val, y_val, LABEL_ORDER)
    test_metrics = evaluate_model(pipeline, X_test, y_test, LABEL_ORDER)

    print(f"[SVM] Val  accuracy={val_metrics['accuracy']:.4f}  macro_f1={val_metrics['macro_f1']:.4f}")
    print(f"[SVM] Test accuracy={test_metrics['accuracy']:.4f}  macro_f1={test_metrics['macro_f1']:.4f}")

    model_path = MODELS_DIR / "svm_pipeline.joblib"
    joblib.dump(pipeline, model_path)

    metadata = {
        "name": "svm",
        "version": "1.0.0",
        "description": "TF-IDF (1-2 grams) + LinearSVC wrapped in CalibratedClassifierCV for probability output",
        "trained_at": datetime.utcnow().isoformat(),
        "train_size": len(X_train),
        "val_size": len(X_val),
        "test_size": len(X_test),
        "train_time_seconds": round(train_time, 2),
        "avg_latency_ms": round(avg_latency_ms, 3),
        "accuracy": test_metrics["accuracy"],
        "macro_f1": test_metrics["macro_f1"],
        "val_metrics": val_metrics,
        "test_metrics": test_metrics,
        "notes": "Calibrated SVM. Generally strong on sparse text. Probabilities via Platt/sigmoid calibration.",
    }
    meta_path = MODELS_DIR / "svm_metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    eval_path = MODELS_DIR / "svm_eval.json"
    with open(eval_path, "w") as f:
        json.dump({"val": val_metrics, "test": test_metrics, "avg_latency_ms": avg_latency_ms}, f, indent=2)

    print(f"[SVM] Saved to {model_path}")
    return pipeline, metadata


def main():
    parser = argparse.ArgumentParser(description="Train JanSetu AI NLP models")
    parser.add_argument("--model", choices=["lr", "svm", "all"], default="all")
    parser.add_argument("--dataset", type=str, default=str(DATA_PATH))
    args = parser.parse_args()

    print(f"[TRAIN] Loading dataset from {args.dataset}")
    df = load_dataset(Path(args.dataset))
    print(f"[TRAIN] Total samples: {len(df)}")
    print(f"[TRAIN] Class distribution:\n{df['category'].value_counts().to_string()}")

    train_df, val_df, test_df = get_splits(df)
    print(f"[TRAIN] Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")

    X_train, y_train = train_df["processed_text"].tolist(), train_df["category"].tolist()
    X_val,   y_val   = val_df["processed_text"].tolist(),   val_df["category"].tolist()
    X_test,  y_test  = test_df["processed_text"].tolist(),  test_df["category"].tolist()

    if args.model in ("lr", "all"):
        train_logistic_regression(X_train, y_train, X_val, y_val, X_test, y_test)

    if args.model in ("svm", "all"):
        train_svm(X_train, y_train, X_val, y_val, X_test, y_test)

    print("\n[TRAIN] Done. Models saved in:", MODELS_DIR)


if __name__ == "__main__":
    main()
