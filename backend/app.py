"""
OceanX AI — Multi-Step Agent Pipeline
Backend: Flask API that orchestrates 4 sequential AI agents
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import anthropic
import json
import os
import random
import string
from dotenv import load_dotenv

load_dotenv()

app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static"
)
CORS(app)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-20250514"


# ─────────────────────────────────────────────
#  HELPER: call Claude and parse JSON response
# ─────────────────────────────────────────────
def call_claude(system_prompt: str, user_prompt: str) -> dict:
    """
    Sends a prompt to Claude and returns parsed JSON.
    All agents use this same function — only their prompts differ.
    """
    response = client.messages.create(
        model=MODEL,
        max_tokens=1000,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}]
    )
    raw = response.content[0].text
    # Strip markdown code fences if Claude wraps the JSON
    clean = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)


# ─────────────────────────────────────────────
#  AGENT 1: Lead Qualification
# ─────────────────────────────────────────────
def agent_qualify(deal: dict) -> dict:
    """
    Takes raw deal input, returns qualification decision.
    Simulates Apollo enrichment + HubSpot lead scoring.
    """
    system = """
You are OceanX AI's lead qualification agent.
You score B2B trade finance leads using Apollo enrichment data and HubSpot criteria.
OceanX finances import and inventory deals for SMEs across Asia-Pacific and the UK.

Return ONLY valid JSON. No explanation, no markdown. Schema:
{
  "qualified": boolean,
  "score": number (0-100),
  "tier": "A" | "B" | "C",
  "channel": string (recommended outreach channel),
  "flags": [list of risk flags, empty if none],
  "reasoning": [exactly 3 strings explaining the decision]
}
"""
    user = f"""
Qualify this trade finance lead:

Company: {deal['company']}
Country: {deal['country']}
Industry: {deal['industry']}
Years in business: {deal['years']}
Annual revenue: ${deal['revenue']}
Order value: ${deal['order_value']}
Finance type: {deal['finance_type']}
Existing debt: {deal['existing_debt']}

Score the lead 0-100. Tier A = score 70+, B = 45-69, C = below 45.
A lead is qualified if score >= 45.
Recommend the best outreach channel (cold email, LinkedIn, broker referral, etc).
List any red flags. Provide exactly 3 reasoning points.
"""
    return call_claude(system, user)


# ─────────────────────────────────────────────
#  AGENT 2: Underwriting
# ─────────────────────────────────────────────
def agent_underwrite(deal: dict, qualification: dict) -> dict:
    """
    Takes deal + qualification output, returns credit decision.
    Mirrors OceanX's actual underwriting logic (Import Finance / Inventory Finance).
    """
    system = """
You are OceanX AI's underwriting agent specialising in Import Finance and Inventory Finance.
OceanX lends to SMEs and collects repayments via GoCardless weekly direct debits.

Key underwriting rules:
- Credit limit = maximum 40% of annual revenue, minimum $10,000
- Upfront payment = 20% to 50% depending on risk
- Repayment period = 90 days via weekly direct debits (13 weeks)
- Higher risk = lower credit limit, higher upfront percentage

Return ONLY valid JSON. No explanation, no markdown. Schema:
{
  "risk_score": number (0-100, higher = riskier),
  "risk_band": "Low" | "Medium" | "High",
  "credit_limit": number,
  "upfront_pct": number (20-50),
  "payment_terms": string (e.g. "Net 30", "50% upfront, balance Net 60"),
  "weekly_debit": number (repayment spread over 13 weeks),
  "decision": "Approve" | "Conditional Approve" | "Decline",
  "reasoning": [exactly 3 strings explaining the credit decision]
}
"""
    user = f"""
Underwrite this application:

Company: {deal['company']}
Country: {deal['country']}
Industry: {deal['industry']}
Years operating: {deal['years']}
Annual revenue: ${deal['revenue']}
Order value: ${deal['order_value']}
Finance type: {deal['finance_type']}
Existing debt: {deal['existing_debt']}
Lead qualification score: {qualification['score']}/100
Lead tier: {qualification['tier']}
Lead flags: {qualification['flags']}

Calculate credit limit (max 40% of annual revenue), upfront %, weekly direct debit to clear in 13 weeks, and make a decision.
"""
    return call_claude(system, user)


# ─────────────────────────────────────────────
#  AGENT 3: Contract Generation
# ─────────────────────────────────────────────
def agent_generate_contract(deal: dict, underwriting: dict) -> dict:
    """
    Takes underwriting output, generates a DocuSign-ready contract structure.
    In production this would use a DocuSign API call.
    """
    system = """
You are OceanX AI's contract structuring agent.
You generate trade finance contracts based on underwriting outputs.
OceanX's finance margin is 2.5% to 4.5% depending on risk band.

Return ONLY valid JSON. No explanation, no markdown. Schema:
{
  "contract_ref": string (format: OX-YYYY-XXXXX),
  "finance_margin": number (2.5 to 4.5, based on risk),
  "total_repayable": number (order value + finance margin amount),
  "key_terms": [exactly 4 strings, each a key contract clause],
  "docusign_ready": true,
  "contract_preview": string (3 sentences of formal contract opening text)
}
"""
    user = f"""
Generate a {deal['finance_type']} contract for:

Company: {deal['company']}
Country: {deal['country']}
Order value: ${deal['order_value']}
Credit limit approved: ${underwriting['credit_limit']}
Upfront required: {underwriting['upfront_pct']}%
Payment terms: {underwriting['payment_terms']}
Weekly direct debit: ${underwriting['weekly_debit']}
Risk band: {underwriting['risk_band']}
Decision: {underwriting['decision']}

Set finance margin based on risk (Low=2.5%, Medium=3.5%, High=4.5%).
Calculate total repayable. Write 4 key contract clauses. Write a formal contract preview.
"""
    return call_claude(system, user)


# ─────────────────────────────────────────────
#  AGENT 4: Operations Setup (Simulated)
# ─────────────────────────────────────────────
def agent_ops_setup(deal: dict, contract: dict, underwriting: dict) -> dict:
    """
    Simulates creating records in CIN7, Xero, and GoCardless.
    In production each of these would be a real API call.
    Returns mock reference numbers for each system.
    """

    def rand_id(prefix, length=6):
        return prefix + ''.join(random.choices(string.digits, k=length))

    industry_code = deal['industry'][:3].upper()
    order_num = rand_id("", 5)

    return {
        "cin7_product_id": f"PRD-{industry_code}-{rand_id('', 4)}",
        "cin7_po_number": f"PO-{order_num}",
        "xero_invoice_id": f"INV-OX-{order_num}",
        "xero_bill_id": f"BILL-OX-{order_num}",
        "gocardless_mandate": f"MD-GC-{rand_id('', 8).upper()}",
        "wise_payment_status": "AWAITING_HUMAN_APPROVAL",  # Human checkpoint
        "systems_provisioned": ["CIN7", "Xero", "GoCardless"],
        "human_checkpoint": "Supplier payment via Wise requires manual approval per OceanX capital control policy."
    }


# ─────────────────────────────────────────────
#  MAIN PIPELINE ENDPOINT
# ─────────────────────────────────────────────
@app.route("/api/run-pipeline", methods=["POST"])
def run_pipeline():
    """
    Receives deal input, runs all 4 agents sequentially,
    passes each output as input to the next agent.
    Returns the full pipeline result.
    """
    deal = request.json

    try:
        # Agent 1: Qualify
        qualification = agent_qualify(deal)

        # If lead doesn't qualify, stop here — don't waste agents 2/3/4
        if not qualification.get("qualified", False):
            return jsonify({
                "status": "halted",
                "reason": "Lead did not qualify",
                "qualification": qualification,
                "underwriting": None,
                "contract": None,
                "ops": None
            })

        # Agent 2: Underwrite
        underwriting = agent_underwrite(deal, qualification)

        # If underwriting declines, stop before contract
        if underwriting.get("decision") == "Decline":
            return jsonify({
                "status": "declined",
                "reason": "Underwriting declined",
                "qualification": qualification,
                "underwriting": underwriting,
                "contract": None,
                "ops": None
            })

        # Agent 3: Generate contract
        contract = agent_generate_contract(deal, underwriting)

        # Agent 4: Ops setup (simulated, always runs if contract is generated)
        ops = agent_ops_setup(deal, contract, underwriting)

        return jsonify({
            "status": "complete",
            "qualification": qualification,
            "underwriting": underwriting,
            "contract": contract,
            "ops": ops
        })

    except json.JSONDecodeError as e:
        return jsonify({"error": f"Claude returned invalid JSON: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────
#  INDIVIDUAL AGENT ENDPOINTS (for testing)
# ─────────────────────────────────────────────
@app.route("/api/agent/qualify", methods=["POST"])
def qualify_only():
    return jsonify(agent_qualify(request.json))

@app.route("/api/agent/underwrite", methods=["POST"])
def underwrite_only():
    data = request.json
    return jsonify(agent_underwrite(data["deal"], data["qualification"]))

@app.route("/api/agent/contract", methods=["POST"])
def contract_only():
    data = request.json
    return jsonify(agent_generate_contract(data["deal"], data["underwriting"]))


# ─────────────────────────────────────────────
#  SERVE FRONTEND
# ─────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
