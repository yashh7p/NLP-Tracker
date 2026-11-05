# NLP Tracker / JanSetu AI

A multilingual civic complaint intelligence platform for classifying, prioritizing, and tracking public grievances using NLP and a modern web dashboard.

This repository contains the application workspace for the JanSetu AI project, including:

- FastAPI backend for complaint processing and APIs
- React + TypeScript frontend for the user/admin experience
- ML pipeline for multilingual complaint classification and analysis
- Docker support for local orchestration

## Project Overview

JanSetu AI is designed for municipal governance use cases in multilingual and code-mixed urban environments. It allows citizens to file complaints in different languages and dialects, while the system normalizes text, identifies urgency, and supports triage workflows through an interactive dashboard.

## Features

- Multilingual and code-mixed complaint handling
- NLP preprocessing for transliteration and normalization
- Complaint categorization and urgency detection
- Duplicate detection and semantic similarity checks
- Voice-based grievance submission support
- GIS-style issue tracking dashboard
- Admin workflow for review, assignment, and monitoring
- Modern React frontend with reusable UI components

## Repository Structure

```text
NLP-Tracker/
├── package.json                 # Root workspace scripts
├── package-lock.json            # Root dependency lockfile
├── README.md                   # Project overview and setup guide
├── jansetu-ai/
│   ├── README.md               # Detailed project documentation
│   ├── docker-compose.yml      # Local service orchestration
│   ├── .env.example            # Environment variable template
│   ├── backend/                # FastAPI app
│   │   ├── app/
│   │   ├── tests/
│   │   └── requirements.txt
│   ├── frontend/               # React + TypeScript app
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.*
│   ├── ml/                     # NLP training and evaluation scripts
│   └── docs/                   # Project report and setup guide
└── node_modules/               # Installed root dependencies
```

## Tech Stack

### Backend
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Uvicorn

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
- Leaflet

### ML / NLP
- scikit-learn
- TF-IDF vectorization
- Classifier benchmarking
- Text normalization and transliteration logic

## Prerequisites

Before running the project locally, make sure you have:

- Python 3.11+
- Node.js 18+
- npm
- Git
- Optional: Docker for local containerized setup

## Quick Start

### 1. Install root dependencies

```bash
npm install
```

### 2. Backend setup

```bash
cd jansetu-ai/backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend setup

```bash
cd jansetu-ai/frontend
npm install
```

### 4. Start the app

From the repository root:

```bash
npm run dev
```

This starts the backend and frontend together using the workspace scripts.

## Run Individually

### Backend

```bash
cd jansetu-ai/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd jansetu-ai/frontend
npm run dev
```

## Environment Variables

Copy the example environment file in the JanSetu AI project and adjust values for your local setup:

```bash
cp jansetu-ai/.env.example jansetu-ai/.env
```

Then update the file with your local database, API, and service configuration values.

## API and UI

- Backend docs: http://localhost:8000/api/docs
- Frontend: http://localhost:5173

## Testing

```bash
cd jansetu-ai/backend
pytest tests
```

```bash
cd jansetu-ai/frontend
npm run build
```

## Documentation

For deeper technical and academic project details, see:

- `jansetu-ai/README.md`
- `jansetu-ai/docs/PROJECT_REPORT.md`
- `jansetu-ai/docs/SETUP_GUIDE.md`

## License

This project does not currently declare a license in the repository metadata.

## Contact

Repository owner: yashh7p

If you want, I can also create a more polished GitHub-style README with badges, screenshots, an architecture diagram, and a contributor section.
