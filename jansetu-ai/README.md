# 🏛️ JanSetu AI (जनसेतु / ಜನಸೇತು)
### Multilingual & Code-Mixed Civic Complaint Classification Using Natural Language Processing

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-14%2F14%20Passing-brightgreen.svg)]()

JanSetu AI is an end-to-end NLP and civic intelligence web application designed for municipal governance in multilingual, dialect-rich urban centers. It empowers citizens to file grievances in **English**, **Hinglish** (Hindi + English), and **Kanglish** (Kannada + English) in natural Romanized script, while providing municipal administrators with automated triage, duplicate detection, and model benchmarking.

---

## 🌟 Key Features

- **🌐 Multilingual & Code-Mixed NLP Pipeline:**
  - Automated transliteration normalization and repeated character compression (*"paaaani"* → *"paani"*).
  - Dialect detection distinguishing standard English, Hinglish, and Kanglish.
  - Urgency and life-safety extraction (hazards, fires, electrical sparks, structural collapses).
- **🤖 Dual Model Benchmark & Leaderboard:**
  - **Model A (Baseline):** TF-IDF $(1, 3)$ n-grams + Multinomial Logistic Regression (Acc: **90.0%**, Macro F1: **0.810**, Latency: **~0.36 ms**).
  - **Model B (Production):** TF-IDF $(1, 2)$ n-grams + Linear Support Vector Classifier with Platt Calibrated Probability (Acc: **100.0%**, Macro F1: **1.000**, Latency: **~2.14 ms**).
- **🔍 Semantic Deduplication:**
  - Real-time cosine similarity search over complaint vector embeddings to detect and merge duplicate reports.
- **🎙️ Accessible Voice Assistant:**
  - Real-time voice grievance transcription with accents and code-mixed speech recognition.
- **🗺️ Interactive GIS Map:**
  - Visual civic issue map across wards with status color coding (Open, In Progress, Resolved).
- **📊 Administration & Research Command Center:**
  - Administrative triage and municipal action assignment desk.
  - Side-by-side interactive model inference sandbox.
  - Complete academic evaluation artifacts and confusion matrices.

---

## 🏗️ Monorepo Architecture

```
jansetu-ai/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # Endpoints: auth, complaints, ai, admin, notifications
│   │   ├── database/        # Async SQLAlchemy engine & seed scripts
│   │   ├── models/          # ORM models (Users, Complaints, Departments, Categories)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── security/        # JWT & direct bcrypt hashing
│   │   └── services/        # Core NLP service & priority detection
│   ├── tests/               # Pytest suite (14 unit & integration tests)
│   └── requirements.txt
├── frontend/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/      # UI components & design system tokens
│   │   ├── layouts/         # MainLayout, AdminLayout, AuthLayout
│   │   ├── pages/           # Landing, Dashboard, TextComplaint, VoiceComplaint, Map, etc.
│   │   ├── services/        # Axios API client with JWT interceptors
│   │   └── types/           # TypeScript interfaces & category constants
├── ml/                       # NLP Machine Learning Core
│   ├── data/raw/            # Multilingual civic complaints dataset
│   ├── models/              # Trained .joblib pipelines and evaluation JSON reports
│   ├── preprocessing/       # Phonetic & text normalization
│   ├── training/            # Model training script (train.py)
│   └── evaluation/          # Comparative evaluation script (evaluate.py)
├── docs/                     # University Project Documentation
│   ├── PROJECT_REPORT.md    # Formal academic research report
│   └── SETUP_GUIDE.md       # Step-by-step local execution instructions
├── docker-compose.yml        # Docker configuration
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup & Model Training
```bash
# 1. Create and activate virtual environment
py -3.13 -m venv venv
.\venv\Scripts\activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Train models
cd ml/training
python train.py --model all
cd ../evaluation
python evaluate.py
cd ../..

# 4. Seed database
cd backend
python -m app.database.seed

# 5. Start FastAPI
uvicorn app.main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/api/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Application UI: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Resident** | `resident@jansetu.in` | `Resident@123` |
| **Admin** | `admin@jansetu.in` | `Admin@123` |
| **Staff** | `staff@jansetu.in` | `Staff@123` |

---

## 🧪 Testing

```bash
# Backend pytest suite
cd backend
pytest tests

# Frontend TypeScript build
cd frontend
npm run build
```

---

## 📄 Documentation
For detailed academic methodology, linguistic landscape analysis, and mathematical formulations, refer to [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md).
