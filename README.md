# Breach 2026

Breach 2026 is a full-stack cybersecurity awareness simulation platform for running controlled phishing exercises, tracking user behavior, and generating AI-guided coaching insights.

![Breach 2026 Platform Architecture](docs/images/platform-architecture.svg)

The system includes:
- A FastAPI backend for authentication, campaign orchestration, tracking, analytics, and AI services.
- A Next.js frontend for admin and user dashboards, campaign operations, and security coaching views.
- A Supabase-backed data layer for organizations, users, targets, campaigns, simulations, and event telemetry.

## Core Capabilities

- Role-based authentication with admin and user experiences.
- Campaign creation and launch for email and WhatsApp simulation flows.
- Event tracking for email opens, link clicks, and credential submissions.
- Organization and campaign-level risk analytics.
- AI-generated phishing templates and recommendation summaries.
- RAG-powered chat assistant for awareness coaching.

## Technology Stack

### Backend
- Python
- FastAPI
- Supabase Python SDK
- Pydantic
- Scikit-learn
- LangChain with FAISS and Groq support
- Google Generative AI

### Frontend
- Next.js App Router
- React
- Tailwind CSS
- Chart.js
- Radix and custom UI primitives

### Data
- PostgreSQL-compatible schema (Supabase)

## Repository Structure

```text
Breach-2026/
	backend/
		app/
			api/v1/endpoints/
			core/
			services/
			models/
			templates/
			langchain/
		schema.sql
		scripts/init_db.sql
		requirements.txt
	frontend/
		app/
		components/
		lib/
		package.json
```

## Architecture Overview

![Campaign Lifecycle](docs/images/campaign-lifecycle.svg)

1. Admin signs in and creates campaigns in the frontend.
2. Frontend sends campaign payloads to FastAPI endpoints.
3. Backend creates simulation records and dispatches messages.
4. Tracking endpoints capture open, click, and credential events.
5. Analytics endpoints aggregate telemetry into risk metrics.
6. AI and RAG services provide template generation and contextual coaching.

![Operations and Analytics Preview](docs/images/analytics-preview.svg)

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm 9 or newer
- Supabase project with required tables
- Optional provider credentials for AI and messaging features

## Local Development Setup

## 1) Backend Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a backend environment file at backend/.env and configure values from the Environment Variables section.

Initialize the database using your preferred script:
- backend/schema.sql
- backend/scripts/init_db.sql

Start backend server:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend base URL: http://127.0.0.1:8000

## 2) Frontend Setup

From the repository root:

```powershell
cd frontend
npm install
```

Create a frontend environment file at frontend/.env.local:

```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

Start frontend server:

```powershell
npm run dev
```

Frontend URL: http://localhost:3000

## Environment Variables

## Backend Required

```env
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Backend Authentication and App

```env
JWT_SECRET=
FRONTEND_ORIGIN=http://localhost:3000
APP_BASE_URL=http://localhost:8000
API_BASE_URL=http://localhost:8000
```

## Backend AI

```env
GOOGLE_API_KEY=
GROQ_API_KEY=
RAG_PDF_PATH=backend/app/langchain/lang.pdf
RAG_LLM_MODEL=openai/gpt-oss-120b
RAG_EMBEDDING_MODEL=nomic-embed-text
RAG_CHUNK_SIZE=300
RAG_CHUNK_OVERLAP=20
RAG_TOP_K=4
```

## Backend Email

```env
SMTP_HOST=
SMTP_SERVER=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=
```

## Backend WhatsApp

```env
WHATSAPP_SEND_MODE=uri
WHATSAPP_API_KEY=
WHATSAPP_SENDER=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

## Frontend

```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

## API Overview

Base prefix: /api/v1

Authentication:
- POST /auth/signup
- POST /auth/login

Campaigns:
- GET /campaigns
- POST /campaigns
- POST /campaigns/{campaign_id}/launch
- POST /campaigns/test-email
- POST /campaigns/test-whatsapp

Targets:
- GET /targets
- POST /targets
- POST /targets/batch-upload

Tracking:
- GET /tracking/open/{tracking_id}
- GET /tracking/click/{tracking_id}
- POST /tracking/credentials
- GET /tracking/stats/{tracking_id}

Analytics:
- GET /analytics/summary/{org_id}
- GET /analytics/campaign/{campaign_id}

AI and Chat:
- POST /ai/generate-template
- POST /ai/predict-risk
- POST /ai/summarize-insights
- POST /chat/ask

Users:
- GET /users/me

## Database Model Summary

Primary entities:
- organizations
- users
- targets
- templates
- campaigns
- simulations
- simulation_events
- credentials_audit
- risk_scores
- ai_insights

Telemetry flow:
- campaigns generate simulations
- simulations generate simulation_events
- credential submissions generate credentials_audit records
- analytics and ML derive organization and campaign risk outputs

## Role Flows

Admin flow:
1. Sign up or log in as admin.
2. Add or import targets.
3. Create campaign payload.
4. Run email or WhatsApp test dispatch.
5. Launch campaign and monitor analytics.

User flow:
1. Log in as user.
2. View personal simulation history.
3. Review risk profile and recent events.
4. Use assistant guidance for remediation.

## Operational Notes

- Messaging services support dry-run and URI-based fallback behavior when provider credentials are not configured.
- Tracking service stores password quality signals only and does not persist raw credential values.
- Campaign dispatch runs in background tasks and updates campaign state when dispatch completes.

## Known Integration Gaps

Frontend currently calls several endpoints that are not implemented in backend routes in this repository snapshot:
- GET /analytics/overview/{org_id}
- GET /analytics/employees/{org_id}
- GET /organizations/mine
- POST /targets/{target_id}/test-attack

Current frontend logic includes graceful fallbacks for several of these missing responses, but full behavior requires implementing these endpoints.

## Security and Ethical Use

This project is intended for authorized internal security awareness programs only. Use in production must include:
- Explicit organizational approval
- Controlled scope and participant communication policy
- Secure secret management
- Compliance review for data handling and retention

## Development Commands

Backend:

```powershell
cd backend
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm run dev
npm run build
npm run lint
```

## Production Readiness Checklist

- Enforce strict CORS origins.
- Enable route protection in frontend middleware.
- Configure robust JWT/session hardening.
- Implement missing analytics and organization endpoints.
- Add automated tests for backend endpoints and key frontend flows.
- Add observability, alerting, and audit logging strategy.
