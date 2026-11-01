"""
JanSetu AI — Model Evaluation Script

Loads saved models and produces a full evaluation report.
Run after training:
    python evaluate.py

Outputs:
    ml/models/<model>_eval.json  — per-model metrics
    ml/models/comparison_report.json — side-by-side comparison
"""
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    f1_score, precision_score, recall_score
)

from preprocessing.text_preprocessor import preprocess

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_PATH = BASE_DIR / "data" / "raw" / "complaints_dataset.csv"

CATEGORY_NAMES = {
    "water_supply":       "Water Supply",
    "roads_potholes":     "Roads & Potholes",
    "garbage_sanitation": "Garbage & Sanitation",
    "electricity_lights": "Electricity & Lights",
    "drainage_sewage":    "Drainage & Sewage",
    "public_safety":      "Public Safety",
    "public_transport":   "Public Transport",
    "other":              "Other",
}


def load_test_set():
    df = pd.read_csv(DATA_PATH)
    df["processed_text"] = df["complaint_text"].astype(str).apply(
        lambda t: preprocess(t, apply_spell_norm=True)
    )
    test_df = df[df["dataset_split"] == "test"]
    return test_df


def measure_latency(pipeline, samples=100):
    sample_texts = [
        "Water not coming in our area",
        "Road potholes causing damage",
        "Paani nahi aa raha hai",
        "Namma area alli neeru illa",
    ] * (samples // 4)
    t0 = time.time()
    for text in sample_texts:
        pipeline.predict([text])
    return (time.time() - t0) / samples * 1000


def evaluate_by_language(pipeline, df):
    """Evaluate per language group."""
    results = {}
    for lang in df["language"].unique():
        subset = df[df["language"] == lang]
        if len(subset) < 2:
            continue
        X = subset["processed_text"].tolist()
        y = subset["category"].tolist()
        y_pred = pipeline.predict(X)
        results[lang] = {
            "count": len(subset),
            "accuracy": round(float(accuracy_score(y, y_pred)), 4),
            "macro_f1": round(float(f1_score(y, y_pred, average="macro", zero_division=0)), 4),
        }
    return results


def run_evaluation(model_name: str, test_df: pd.DataFrame) -> dict:
    model_path = MODELS_DIR / f"{model_name}_pipeline.joblib"
    if not model_path.exists():
        return {"status": "model_not_found", "model": model_name}

    print(f"\n[EVAL] Evaluating {model_name}...")
    pipeline = joblib.load(model_path)

    X_test = test_df["processed_text"].tolist()
    y_test = test_df["category"].tolist()

    y_pred = pipeline.predict(X_test)
    labels_present = sorted(set(y_test) | set(y_pred))

    acc      = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    macro_p  = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    macro_r  = float(recall_score(y_test, y_pred, average="macro", zero_division=0))

    report = classification_report(
        y_test, y_pred,
        labels=labels_present,
        target_names=[CATEGORY_NAMES.get(l, l) for l in labels_present],
        output_dict=True, zero_division=0,
    )
    cm = confusion_matrix(y_test, y_pred, labels=labels_present).tolist()
    avg_latency = measure_latency(pipeline)
    by_language = evaluate_by_language(pipeline, test_df)

    # Error analysis — find misclassified examples
    errors = []
    for i, (true, pred) in enumerate(zip(y_test, y_pred)):
        if true != pred and len(errors) < 10:
            errors.append({
                "text": test_df.iloc[i]["complaint_text"],
                "true_label": true,
                "predicted_label": pred,
                "language": test_df.iloc[i]["language"],
            })

    result = {
        "model_name": model_name,
        "test_size": len(X_test),
        "accuracy": round(acc, 4),
        "macro_f1": round(macro_f1, 4),
        "macro_precision": round(macro_p, 4),
        "macro_recall": round(macro_r, 4),
        "avg_latency_ms": round(avg_latency, 3),
        "per_class_report": report,
        "confusion_matrix": cm,
        "confusion_labels": [CATEGORY_NAMES.get(l, l) for l in labels_present],
        "by_language": by_language,
        "error_analysis": errors,
        "status": "evaluated",
    }

    print(f"[EVAL] {model_name}: acc={acc:.4f}  f1={macro_f1:.4f}  latency={avg_latency:.2f}ms")
    return result


def main():
    test_df = load_test_set()
    print(f"[EVAL] Test set size: {len(test_df)}")

    results = {}
    for model_name in ["logistic_regression", "svm"]:
        result = run_evaluation(model_name, test_df)
        results[model_name] = result

        eval_path = MODELS_DIR / f"{model_name}_eval.json"
        with open(eval_path, "w") as f:
            json.dump(result, f, indent=2)

    # Comparison report
    comparison = {
        "generated_at": str(pd.Timestamp.utcnow()),
        "test_size": len(test_df),
        "models": {
            name: {
                "accuracy": r.get("accuracy"),
                "macro_f1": r.get("macro_f1"),
                "macro_precision": r.get("macro_precision"),
                "macro_recall": r.get("macro_recall"),
                "avg_latency_ms": r.get("avg_latency_ms"),
                "status": r.get("status"),
            }
            for name, r in results.items()
        }
    }
    cmp_path = MODELS_DIR / "comparison_report.json"
    with open(cmp_path, "w") as f:
        json.dump(comparison, f, indent=2)

    print(f"\n[EVAL] Comparison report saved to {cmp_path}")


if __name__ == "__main__":
    main()
