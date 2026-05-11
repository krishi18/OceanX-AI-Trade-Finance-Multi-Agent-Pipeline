# OceanX AI - Trade Finance Multi-Agent Pipeline

Built for the OceanX AI Intern Assignment · May 2026

## What happens when you click the button

**Agent 1 - Is this lead worth pursuing?**
Scores the company 0–100, assigns a tier, flags any concerns, recommends the right outreach channel. If the score is too low, the pipeline stops here. No credit check runs on a bad lead.

**Supervisor review**
Before anything moves forward, the Master Supervisor reads Agent 1's output and checks it makes sense. If it spots an inconsistency, it halts the pipeline and explains why.

**Agent 2 - How much can we safely lend?**
Uses OceanX's actual credit rules — maximum 40% of annual revenue, repayment over 13 weeks via GoCardless weekly direct debits — to calculate a safe credit limit, upfront percentage, and weekly debit amount. Passes all of this to the next agent.

**Supervisor review**
Checks the numbers add up. Credit limit against revenue. Order size against the approved limit. Catches problems before a contract gets drafted around them.

**Agent 3 - Draft the agreement**
Every number in the contract comes directly from Agent 2 — credit limit, upfront amount, finance margin, total repayable. Nothing typed manually. DocuSign-ready the moment it's generated.

**Supervisor review**
Final check before ops systems are touched.

**Agent 4 - Set everything up**
CIN7 gets a product record and a purchase order. Xero gets an invoice and a supplier bill. GoCardless gets a mandate initiated. The system also picks the right collections model automatically:
- **Model 1 — Open Credit**: fixed weekly GoCardless direct debit over 13 weeks, for standard import finance under $100k
- **Model 2 — Stock & Release**: customer pays per batch of goods drawn down, for inventory finance or larger orders

Then it stops. The Wise supplier payment is held for human approval — OceanX's capital control checkpoint.

## Project structure

```
oceanx-agent-pipeline/
│
├── backend/
│   └── app.py              Flask server + all agent logic
│
├── frontend/
│   ├── templates/
│   │   └── index.html      The form and result cards
│   └── static/
│       ├── style.css       Styling
│       └── pipeline.js     What happens when you click the button
│
├── .env.example            API key template
├── .gitignore
├── requirements.txt
└── README.md
```
## Tech stack

| | |
|--|--|
| Backend | Python, Flask |
| AI | Claude Sonnet via Anthropic API |
| Frontend | Vanilla HTML, CSS, JavaScript — no frameworks |
| Fonts | Inter, JetBrains Mono |

## Running it locally

You need Python 3.8+ and a free Anthropic API key from [console.anthropic.com](https://console.anthropic.com).

**1. Clone the repo**
```bash
git clone https://github.com/krishi18/OceanX-AI-Trade-Finance-Multi-Agent-Pipeline.git
cd OceanX-AI-Trade-Finance-Multi-Agent-Pipeline
```

**2. Create a virtual environment**
```bash
python -m venv venv

# Mac / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Add your API key**
```bash
# Mac / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Open `.env` and replace `your_api_key_here` with your actual Anthropic API key.

**5. Start the server**
```bash
cd backend
python app.py
```

**6. Open in browser**
```
http://localhost:5000
```

---

## Two inputs worth trying

### Clean run — everything approves

A straightforward Singapore electronics importer. Strong revenue, no debt, order well within credit limit. All four agents complete, supervisor clears every stage.

| Field | Value |
|-------|-------|
| Company name | Meridian Supply Co |
| Country | Singapore |
| Industry | Electronics |
| Years in business | 7 |
| Annual revenue | 4500000 |
| Order value | 55000 |
| Finance type | Import Finance |
| Existing debt | None |

---

### Flagged run — supervisor catches a bad deal

A tiny company with high existing debt asking for a loan nearly equal to their entire annual revenue. Watch the supervisor halt the pipeline at underwriting and explain exactly why.

| Field | Value |
|-------|-------|
| Company name | Redstone Traders Ltd |
| Country | India |
| Industry | Chemicals |
| Years in business | 1 |
| Annual revenue | 85000 |
| Order value | 70000 |
| Finance type | Inventory Finance |
| Existing debt | High (over $500k) |

## How agents hand off to each other

```python
# Each agent's output becomes the next agent's input
qualification = agent_qualify(deal)
underwriting  = agent_underwrite(deal, qualification)
contract      = agent_generate_contract(deal, underwriting)
ops           = agent_ops_setup(deal, contract, underwriting)
```

The credit limit from underwriting flows into the contract automatically. The contract terms flow into the ops setup. Nothing is typed twice. Nothing gets out of sync.

## What's simulated vs what's real

The AI reasoning is real — Claude is genuinely evaluating each decision. The back-office API calls are simulated. In production, each line in Agent 4 becomes a real HTTP request:

| Currently | Production |
|-----------|-----------|
| Mock CIN7 product ID | POST to CIN7 REST API |
| Mock Xero invoice | POST to Xero API (OAuth2) |
| Mock GoCardless mandate | POST to GoCardless API |
| Wise payment hold | POST to Wise Business API |

The pipeline logic doesn't change. You're swapping mock return values for real API calls, one system at a time.

## API endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| GET | `/` | Serves the UI |
| POST | `/api/run-pipeline` | Runs the full pipeline |
| POST | `/api/agent/qualify` | Runs Agent 1 only |
| POST | `/api/agent/underwrite` | Runs Agent 2 only |
| POST | `/api/agent/contract` | Runs Agent 3 only |

## Cost

About $0.01–0.02 per full run (5 Claude API calls). Free tier covers a few hundred demo runs.

---

*Krishi Thiruppathi — OceanX AI Intern Assignment, May 2026*
