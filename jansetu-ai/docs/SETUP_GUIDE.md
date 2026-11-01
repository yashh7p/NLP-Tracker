# JanSetu AI — Local Setup and Execution Guide

This guide describes how to run **JanSetu AI** locally on Windows, macOS, or Linux.

---

## 📋 Prerequisites
1. **Python 3.11 – 3.13** installed and available in PATH.
2. **Node.js 18+** & **npm** installed.

---

## 🚀 Quick Start (Running Both Services)

### Step 1: Clone and Navigate to the Repository
```bash
cd path/to/jansetu-ai
```

### Step 2: Set Up Python Virtual Environment & Dependencies
```bash
# Windows
py -3.13 -m venv venv
.\venv\Scripts\activate
pip install -r backend/requirements.txt

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### Step 3: Train and Evaluate NLP Models
```bash
cd ml/training
python train.py --model all

cd ../evaluation
python evaluate.py
cd ../..
```
*(Trained models will be saved to `ml/models/`)*

### Step 4: Seed the Database
```bash
cd backend
python -m app.database.seed
cd ..
```
*Initializes SQLite database `jansetu.db` with all 8 municipal categories, departments, demo accounts, and sample grievances.*

---

## 🏃 Running the Application

### 1. Start the Backend API Server
In Terminal 1:
```bash
cd backend
# With virtual environment activated:
uvicorn app.main:app --reload --port 8000
```
- API Docs (Swagger): `http://localhost:8000/api/docs`
- Health check: `http://localhost:8000/health`

### 2. Start the Frontend Dev Server
In Terminal 2:
```bash
cd frontend
npm install
npm run dev
```
- Open your browser at: `http://localhost:5173`

---

## 🔑 Demo Login Credentials

The database comes pre-seeded with three demo roles:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Resident (Citizen)** | `resident@jansetu.in` | `Resident@123` | File text/voice grievances, view my complaints, GIS map |
| **Civic Staff** | `staff@jansetu.in` | `Staff@123` | View assigned department complaints, update status |
| **Administrator** | `admin@jansetu.in` | `Admin@123` | Operations overview, model comparison, research analytics |

*Quick-fill demo buttons are provided directly on the Login page.*

---

## 🧪 Running Automated Tests

### Run Backend & NLP Tests
```bash
cd backend
pytest tests
```
Runs 14 automated unit and integration tests verifying text preprocessing, language detection, code-mixed classification, priority rules, and API endpoints.

### Build and Validate Frontend
```bash
cd frontend
npm run build
```
Type-checks TypeScript and compiles production bundles.
