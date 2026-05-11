# OceanX AI — Multi-Step Agent Pipeline

A working demo of a 4-agent trade finance automation system built for the OceanX AI intern assignment.

## What It Does

Takes a single deal input form and runs 4 AI agents sequentially:

| Agent | Role | Tools (simulated) |
|-------|------|-------------------|
| 1 — Lead Qualification | Score, tier, and qualify the lead | Apollo, HubSpot |
| 2 — Underwriting | Risk score, credit limit, payment terms | OceanX credit logic |
| 3 — Contract Generation | DocuSign-ready contract with pricing | DocuSign |
| 4 — Operations Setup | Create product, PO, invoice, bill, mandate | CIN7, Xero, GoCardless |

Each agent's output feeds the next as input. If a lead doesn't qualify, the pipeline halts early and no downstream agents run.

The only human checkpoint: supplier payment approval via Wise (per OceanX capital control policy).

---

## Project Structure

```
oceanx-agent-pipeline/
├── backend/
│   └── app.py              # Flask API + all 4 agent functions
├── frontend/
│   ├── templates/
│   │   └── index.html      # Main UI
│   └── static/
│       ├── style.css       # Styling
│       └── pipeline.js     # Frontend logic + API calls
├── requirements.txt
├── .env.example
└── README.md
```

---

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/oceanx-agent-pipeline.git
cd oceanx-agent-pipeline
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set your API key
```bash
cp .env.example .env
# Open .env and paste your Anthropic API key
# Get one at: https://console.anthropic.com
```

### 5. Run the server
```bash
cd backend
python app.py
```

### 6. Open in browser
```
http://localhost:5000
```

---

## How to Demo It

1. Open `http://localhost:5000`
2. The form is pre-filled with a sample deal (BlueStar Trading, $3.2M revenue, $65k order)
3. Click **Run agent pipeline**
4. Watch all 4 agents run and display their outputs sequentially
5. Try changing inputs — e.g. set "Years in business" to 0 and "Existing debt" to High to see the pipeline halt or decline

---

## How the Agent Architecture Works

```
Input Form
    │
    ▼
Agent 1: Lead Qualification
    │  (qualified = false → HALT, log to HubSpot)
    │  (qualified = true → continue)
    ▼
Agent 2: Underwriting
    │  (decision = Decline → HALT)
    │  (decision = Approve / Conditional → continue)
    ▼
Agent 3: Contract Generation
    │
    ▼
Agent 4: Operations Setup
    │  Creates: CIN7 product, CIN7 PO, Xero invoice,
    │           Xero bill, GoCardless mandate
    │  Holds:   Wise payment (human approval required)
    ▼
Human Checkpoint: Approve supplier payment
```

Each agent is a separate Python function with its own system prompt. The `call_claude()` helper is shared — only the prompts differ. This is the core principle of multi-agent design: isolated responsibilities, shared infrastructure.

---

## Extending to a Real System

| Currently simulated | Real implementation |
|---------------------|---------------------|
| CIN7 product + PO   | CIN7 REST API |
| Xero invoice + bill | Xero API (OAuth2) |
| GoCardless mandate  | GoCardless API |
| Wise payment        | Wise Business API |
| Apollo enrichment   | Apollo.io API |
| DocuSign contract   | DocuSign eSignature API |

Each of these is a one-function swap — replace the mock `agent_ops_setup()` return with a real API call.

---

## Tech Stack

- **Backend:** Python, Flask, Anthropic Python SDK
- **Frontend:** Vanilla HTML/CSS/JS (no framework, easy to explain)
- **AI:** Claude Sonnet via Anthropic API
- **No database needed** — stateless per request

---

## Built for

OceanX AI Intern Automation Assignment — May 2026
