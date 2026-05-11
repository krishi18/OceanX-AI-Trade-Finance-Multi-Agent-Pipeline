/**
 * OceanX AI — Pipeline Frontend
 * Sends deal input to Flask backend, renders each agent result as it arrives.
 * The backend runs all 4 agents; here we just display the returned data.
 */

// ─── Helpers ──────────────────────────────────────────
function fmt(num) {
  return '$' + Number(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function colorClass(val, good, warn) {
  // Returns a CSS class based on a numeric threshold
  if (val >= good) return 'green';
  if (val >= warn) return 'amber';
  return 'red';
}

function setStatus(idx, state, label) {
  const el = document.getElementById('status-' + idx);
  el.className = 'agent-status ' + state;
  const icons = { running: '<span class="spinner"></span>', done: '✓', error: '✗', idle: '⏳' };
  el.innerHTML = (icons[state] || '') + ' ' + label;
}

function setPipeStep(idx, state) {
  const el = document.getElementById('pstep-' + idx);
  el.className = 'pipe-step ' + state;
}

function openAgentBody(idx) {
  const body = document.getElementById('body-' + idx);
  body.classList.add('open');
}

function setCardState(idx, state) {
  document.getElementById('card-' + idx).className = 'agent-card ' + state;
}

// Toggle agent body open/closed on header click
function toggleCard(idx) {
  const body = document.getElementById('body-' + idx);
  if (body.innerHTML.trim() === '') return; // nothing to show yet
  body.classList.toggle('open');
}

// ─── Render functions for each agent ──────────────────

function renderQualification(data) {
  const scoreColor = colorClass(data.score, 70, 45);
  const tierColor  = data.tier === 'A' ? 'green' : data.tier === 'B' ? 'amber' : 'red';
  const flags = data.flags.length
    ? data.flags.map(f => `<div class="item">${f}</div>`).join('')
    : '<div class="item">No flags raised</div>';

  document.getElementById('body-0').innerHTML = `
    <div class="thinking-log">
      ${data.reasoning.map(r => `<div class="log-line">${r}</div>`).join('')}
    </div>
    <div class="result-grid">
      <div class="result-pill">
        <div class="label">Lead score</div>
        <div class="value ${scoreColor}">${data.score}/100</div>
      </div>
      <div class="result-pill">
        <div class="label">Tier</div>
        <div class="value ${tierColor}">${data.tier}-tier</div>
      </div>
      <div class="result-pill">
        <div class="label">Qualified</div>
        <div class="value ${data.qualified ? 'green' : 'red'}">${data.qualified ? 'Yes' : 'No'}</div>
      </div>
      <div class="result-pill">
        <div class="label">Channel</div>
        <div class="value">${data.channel}</div>
      </div>
    </div>
    ${data.flags.length ? `<div class="reason-list"><strong style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.05em">Flags</strong>${flags}</div>` : ''}
  `;
  openAgentBody(0);
}

function renderUnderwriting(data) {
  const riskColor = data.risk_band === 'Low' ? 'green' : data.risk_band === 'Medium' ? 'amber' : 'red';
  const decColor  = data.decision === 'Approve' ? 'green' : data.decision === 'Conditional Approve' ? 'amber' : 'red';

  document.getElementById('body-1').innerHTML = `
    <div class="thinking-log">
      ${data.reasoning.map(r => `<div class="log-line">${r}</div>`).join('')}
    </div>
    <div class="result-grid">
      <div class="result-pill">
        <div class="label">Risk band</div>
        <div class="value ${riskColor}">${data.risk_band}</div>
      </div>
      <div class="result-pill">
        <div class="label">Credit limit</div>
        <div class="value green">${fmt(data.credit_limit)}</div>
      </div>
      <div class="result-pill">
        <div class="label">Upfront</div>
        <div class="value">${data.upfront_pct}%</div>
      </div>
      <div class="result-pill">
        <div class="label">Weekly debit</div>
        <div class="value">${fmt(data.weekly_debit)}</div>
      </div>
    </div>
    <div class="result-grid">
      <div class="result-pill" style="grid-column:1/-1">
        <div class="label">Decision</div>
        <div class="value ${decColor}">${data.decision} · ${data.payment_terms}</div>
      </div>
    </div>
  `;
  openAgentBody(1);
}

function renderContract(data) {
  document.getElementById('body-2').innerHTML = `
    <div class="result-grid">
      <div class="result-pill">
        <div class="label">Contract ref</div>
        <div class="value">${data.contract_ref}</div>
      </div>
      <div class="result-pill">
        <div class="label">Finance margin</div>
        <div class="value amber">${data.finance_margin}%</div>
      </div>
      <div class="result-pill">
        <div class="label">Total repayable</div>
        <div class="value">${fmt(data.total_repayable)}</div>
      </div>
      <div class="result-pill">
        <div class="label">DocuSign</div>
        <div class="value green">${data.docusign_ready ? 'Ready' : 'Pending'}</div>
      </div>
    </div>
    <div class="contract-box">${data.contract_preview}</div>
    <div class="reason-list">
      <strong style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:.05em">Key terms</strong>
      ${data.key_terms.map(t => `<div class="item">${t}</div>`).join('')}
    </div>
  `;
  openAgentBody(2);
}

function renderOps(data) {
  document.getElementById('body-3').innerHTML = `
    <table class="ops-table">
      <tr><td>CIN7 — product created</td>     <td class="tick">✓ ${data.cin7_product_id}</td></tr>
      <tr><td>CIN7 — purchase order</td>       <td class="tick">✓ ${data.cin7_po_number}</td></tr>
      <tr><td>Xero — invoice raised</td>        <td class="tick">✓ ${data.xero_invoice_id}</td></tr>
      <tr><td>Xero — supplier bill</td>         <td class="tick">✓ ${data.xero_bill_id}</td></tr>
      <tr><td>GoCardless — mandate initiated</td><td class="tick">✓ ${data.gocardless_mandate}</td></tr>
      <tr><td>Wise — supplier payment</td>      <td class="hold">⏸ awaiting human approval</td></tr>
    </table>
    <p style="font-size:11px;color:#999;margin-top:10px">${data.human_checkpoint}</p>
  `;
  openAgentBody(3);
}

// ─── Main pipeline runner ──────────────────────────────
async function runPipeline() {
  const btn = document.getElementById('runBtn');
  btn.disabled = true;

  // Collect form values
  const deal = {
    company:       document.getElementById('company').value,
    country:       document.getElementById('country').value,
    industry:      document.getElementById('industry').value,
    years:         document.getElementById('years').value,
    revenue:       document.getElementById('revenue').value,
    order_value:   document.getElementById('order_value').value,
    finance_type:  document.getElementById('finance_type').value,
    existing_debt: document.getElementById('existing_debt').value,
  };

  // Show results section, hide final banner
  document.getElementById('resultsSection').style.display = 'block';
  document.getElementById('finalBanner').style.display = 'none';

  // Reset all cards to idle
  for (let i = 0; i < 4; i++) {
    setStatus(i, 'idle', 'waiting');
    setCardState(i, '');
    setPipeStep(i, '');
    document.getElementById('body-' + i).innerHTML = '';
    document.getElementById('body-' + i).classList.remove('open');
  }

  // Show agent 1 as running immediately
  setPipeStep(0, 'active');
  setStatus(0, 'running', 'enriching lead...');
  setCardState(0, 'running');

  try {
    // Single API call to backend — backend handles all 4 agents sequentially
    const response = await fetch('/api/run-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deal)
    });

    const result = await response.json();

    if (result.error) {
      setStatus(0, 'error', 'error');
      alert('Pipeline error: ' + result.error);
      btn.disabled = false;
      return;
    }

    // ── Render Agent 1 ─────────────────────────────────
    setStatus(0, 'done', 'qualified');
    setCardState(0, 'done');
    setPipeStep(0, 'done');
    renderQualification(result.qualification);

    // Pipeline halted (lead didn't qualify)
    if (result.status === 'halted') {
      setPipeStep(0, 'halted');
      showFinalBanner('halted', `${deal.company} did not meet qualification criteria. Tagged in HubSpot as nurture. No further agent action required.`);
      btn.disabled = false;
      return;
    }

    // ── Render Agent 2 ─────────────────────────────────
    setPipeStep(1, 'active');
    setStatus(1, 'done', 'assessed');
    setCardState(1, 'done');
    setPipeStep(1, 'done');
    renderUnderwriting(result.underwriting);

    // Pipeline declined at underwriting
    if (result.status === 'declined') {
      showFinalBanner('halted', `${deal.company} was declined at underwriting. Decision logged in HubSpot. Contract not generated.`);
      btn.disabled = false;
      return;
    }

    // ── Render Agent 3 ─────────────────────────────────
    setPipeStep(2, 'active');
    setStatus(2, 'done', 'generated');
    setCardState(2, 'done');
    setPipeStep(2, 'done');
    renderContract(result.contract);

    // ── Render Agent 4 ─────────────────────────────────
    setPipeStep(3, 'active');
    setStatus(3, 'done', 'all systems synced');
    setCardState(3, 'done');
    setPipeStep(3, 'done');
    renderOps(result.ops);

    // ── Final summary ───────────────────────────────────
    const summary = `
      ${deal.company} · ${result.underwriting.decision} ·
      Credit limit ${fmt(result.underwriting.credit_limit)} ·
      Contract ${result.contract.contract_ref} DocuSign-ready ·
      CIN7, Xero, GoCardless all provisioned ·
      Only remaining action: human approval of supplier payment via Wise.
    `.replace(/\s+/g, ' ').trim();

    showFinalBanner('complete', summary);

  } catch (err) {
    console.error(err);
    alert('Network error. Is the Flask server running on port 5000?');
  }

  btn.disabled = false;
}

function showFinalBanner(type, message) {
  const banner = document.getElementById('finalBanner');
  banner.className = 'final-banner' + (type === 'halted' ? ' halted' : '');
  banner.style.display = 'block';
  document.getElementById('finalTitle').textContent =
    type === 'complete' ? '✓ Pipeline complete — deal ready for human checkpoint'
                        : '⚠ Pipeline halted';
  document.getElementById('finalSummary').textContent = message;
}

function resetPipeline() {
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('finalBanner').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  for (let i = 0; i < 4; i++) {
    setStatus(i, 'idle', 'waiting');
    setCardState(i, '');
    setPipeStep(i, i === 0 ? 'active' : '');
    document.getElementById('body-' + i).innerHTML = '';
    document.getElementById('body-' + i).classList.remove('open');
  }

  document.getElementById('runBtn').disabled = false;
}
