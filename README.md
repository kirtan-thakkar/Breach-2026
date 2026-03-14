# Phishlytics – Cybersecurity Awareness Simulation Platform

![Cybersecurity Dashboard](https://phishlytics.vercel.app/)

Phishlytics is a full-stack cybersecurity awareness simulation platform that allows organizations to run controlled phishing exercises, track employee responses, and generate actionable security insights.

Built during **Breach 2026 Hackathon at Pandit Deendayal Energy University (PDEU)**, the platform demonstrates how organizations can move from **guessing security risks → measuring human security behavior**.

🔗 **Live MVP:**  
https://phishlytics.vercel.app/

---

# Problem Statement

Phishing attacks remain one of the **most common entry points for cyber breaches** in modern organizations.

The goal of this project was to design a system that allows organizations to:

- Simulate phishing attacks in a controlled environment
- Track how employees respond to phishing attempts
- Identify vulnerable departments and behavioral patterns
- Improve cybersecurity awareness through measurable insights

Phishlytics helps security teams **understand human risk factors** in cybersecurity and take **data-driven actions to reduce threats.**

---

# Key Features

![Security Analytics](https://images.unsplash.com/photo-1563986768609-322da13575f3)

### Risk Visibility
Track who opened emails, clicked phishing links, or submitted credentials using timestamped activity logs.

### Priority Alerts
Identify vulnerable departments or high-risk employee groups so security teams can respond quickly.

### Behavior Trends
Analyze campaign-to-campaign performance to understand whether security awareness training is improving employee behavior.

### Actionable Guidance
Generate recommendations for administrators, managers, and employees based on phishing simulation results.

---

# Platform Architecture

![System Architecture](https://images.unsplash.com/photo-1558494949-ef010cbdcc31)

The system uses a **modern full-stack architecture** consisting of:

### Frontend
Admin dashboards, campaign creation interfaces, analytics, Dashboard

### Backend
Handles authentication, campaign orchestration, event tracking, analytics processing, and AI services.

### Data Layer
Supabase-powered PostgreSQL database storing organizations, campaigns, simulations, and telemetry events.

---

# Technology Stack

## Frontend
- Next.js (App Router)
- React
- Tailwind CSS
- Chart.js
- Radix UI
- Custom UI components

## Backend
- Python
- FastAPI
- Supabase Python SDK
- Pydantic

## Database
- PostgreSQL (Supabase)

---

# Repository Structure
