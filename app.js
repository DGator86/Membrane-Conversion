var currentType = 'slab';
var slabDimMode = 'lw';

function setSlabDimMode(mode) {
  slabDimMode = mode;
  document.querySelectorAll('.dim-mode-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  document.getElementById('dim-lw-fields').style.display = mode === 'lw' ? '' : 'none';
  document.getElementById('dim-perim-fields').style.display = mode === 'perim' ? '' : 'none';
  var perimNote = document.getElementById('slab-perimeter-note');
  if (perimNote) perimNote.style.display = mode === 'perim' ? 'none' : '';
  compute();
}

function selectType(type) {
  currentType = type;
  document.querySelectorAll('.type-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.type === type);
  });
  document.querySelectorAll('.dim-section').forEach(function(s) {
    s.classList.remove('visible');
  });
  document.getElementById('dim-' + type).classList.add('visible');
  var pileField = document.getElementById('pile-boot-field');
  if (pileField) pileField.style.display = type === 'pilecap' ? 'block' : 'none';
  var penField = document.getElementById('pen-detail-field');
  if (penField) penField.style.display = type === 'pilecap' ? 'none' : 'block';
  compute();
}

function toggleMode() {
  var pkg = document.getElementById('mem_toggle').checked;
  document.getElementById('section-line').style.display = pkg ? 'none' : 'block';
  document.getElementById('section-pkg').style.display  = pkg ? 'block' : 'none';
  document.getElementById('lbl-line').classList.toggle('active', !pkg);
  document.getElementById('lbl-pkg').classList.toggle('active',  pkg);
  compute();
}

function v(id) { return parseFloat(document.getElementById(id).value) || 0; }
function chk(id) { var el = document.getElementById(id); return el ? el.checked : false; }
function sel(id) { var el = document.getElementById(id); return el ? el.value : ''; }

function fmt$(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtN(n, dec) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
}

function calcDerived() {
  var cy = 0, bottomSF = 0, wallSF = 0, cjLF = 0, piles = 0, penCount = 0;

  if (currentType === 'slab') {
    var t = v('slab_t') / 12;
    var wh = v('slab_wall_h');
    var wt = (v('slab_wall_t') || v('slab_t')) / 12;
    var perimeter, area;
    if (slabDimMode === 'perim') {
      area = v('slab_area');
      perimeter = v('slab_perimeter');
    } else {
      var l = v('slab_l'), w = v('slab_w');
      area = l * w;
      perimeter = 2 * (l + w);
      var note = document.getElementById('slab-perimeter-note');
      if (note) {
        if (l > 0 && w > 0) {
          note.style.display = 'block';
          document.getElementById('slab-perimeter-val').textContent = fmtN(perimeter);
        } else {
          note.style.display = 'none';
        }
      }
    }
    cy = (area * t) / 27;
    if (wh > 0 && wt > 0) cy += (perimeter * wh * wt) / 27;
    bottomSF = area;
    wallSF = wh > 0 ? perimeter * wh : 0;
    cjLF = v('slab_cj_lf');
    penCount = v('slab_pen_count');

  } else if (currentType === 'pilecap') {
    var cl = v('cap_l'), cw = v('cap_w'), cd = v('cap_d'), qty = v('cap_qty') || 1;
    var pilesPerCap = v('cap_piles_per');
    var pitWallH = v('cap_pit_wall_h');
    var perim = 2 * (cl + cw);
    cy = (cl * cw * cd / 27) * qty;
    if (pitWallH > 0) cy += (perim * pitWallH * (10 / 12) / 27) * qty;
    bottomSF = cl * cw * qty;
    var capSidesSF = chk('cap_sides') ? perim * cd * qty : 0;
    var pitWallSF = pitWallH > 0 ? perim * pitWallH * qty : 0;
    wallSF = capSidesSF + pitWallSF;
    cjLF = v('cap_cj_lf');
    piles = pilesPerCap * qty;
    penCount = 0; // pile boot/flashing covers all pile penetrations — no separate pen count

  } else if (currentType === 'elevator') {
    var pl = v('pit_l'), pw = v('pit_w'), depth = v('pit_depth');
    var pitQty = v('pit_qty') || 1;
    var pwtInches = v('pit_wall_t'), pstInches = v('pit_slab_t');
    var pwt = pwtInches / 12, pst = pstInches / 12;
    var sumpFactor = chk('pit_sump') ? 1.25 : 1.0;
    cy = ((2 * (pl + pw) * depth * pwt + pl * pw * pst) / 27) * pitQty;
    bottomSF = pl * pw * pitQty;
    wallSF = 2 * (pl + pw) * depth * sumpFactor * pitQty;
    cjLF = v('pit_cj_lf');
    penCount = v('pit_pen_count');
  }

  return {
    cy: Math.round(cy * 10) / 10,
    bottomSF: Math.round(bottomSF),
    wallSF: Math.round(wallSF),
    cjLF: Math.round(cjLF),
    piles: Math.round(piles),
    penCount: Math.round(penCount)
  };
}

// Schedule acceleration curve configs: [pivot, exponent]
// Acceleration Factor = 1 + (daysSaved / pivot) ^ exponent
var ACCEL_CONFIGS = [
  [25, 1.2],  // 0 = Conservative
  [20, 1.5],  // 1 = Balanced
  [15, 1.8]   // 2 = Aggressive
];
var SENSITIVITY_LABELS = ['Conservative', 'Balanced', 'Aggressive'];

function calcAccelFactor(days, sensitivityIdx) {
  var cfg = ACCEL_CONFIGS[sensitivityIdx] || ACCEL_CONFIGS[1];
  if (days <= 0) return 1;
  return 1 + Math.pow(days / cfg[0], cfg[1]);
}

function compute() {
  var d = calcDerived();
  var totalSF = d.bottomSF + d.wallSF;

  // Derived display
  document.getElementById('d-cy').textContent     = d.cy > 0       ? fmtN(d.cy, 1)    : '—';
  document.getElementById('d-bottom').textContent = d.bottomSF > 0 ? fmtN(d.bottomSF) : '—';
  document.getElementById('d-walls').textContent  = d.wallSF > 0   ? fmtN(d.wallSF)   : (d.bottomSF > 0 ? '0' : '—');
  document.getElementById('d-cj').textContent     = d.cjLF > 0     ? fmtN(d.cjLF)     : '—';

  // Auto-filled label text
  var cyText   = d.cy > 0        ? fmtN(d.cy, 1)    + ' CY'    : '— (enter dimensions above)';
  var sfText   = totalSF > 0     ? fmtN(totalSF)     + ' SF'    : '— (enter dimensions above)';
  var cjText   = d.cjLF > 0     ? fmtN(d.cjLF)      + ' LF'    : '— (enter CJ length above)';
  var penText  = d.penCount > 0  ? fmtN(d.penCount)  + ' ea'    : '— (enter count above)';
  var pileText = d.piles > 0     ? fmtN(d.piles)     + ' piles' : '— (enter pile count above)';

  document.getElementById('p_volume_display').textContent = cyText;
  document.getElementById('m_sf_display').textContent     = sfText;
  document.getElementById('m_sf_display_pkg').textContent = sfText;
  document.getElementById('m_cj_display').textContent     = cjText;
  document.getElementById('m_pen_display').textContent    = penText;
  document.getElementById('m_pile_display').textContent   = pileText;

  // Penetron: admixture only, zero critical path days (added in ready-mix truck)
  var pCostCY     = v('p_cost_per_cy');
  var pSched      = 0;
  var pAdmixTotal = d.cy * pCostCY;

  // Membrane base costs
  var isPkg = document.getElementById('mem_toggle').checked;
  var cpd   = v('cost_per_day');
  var memBaseCost = 0, memSched = 0;
  if (!isPkg) {
    memBaseCost = totalSF * v('m_membrane_cost_sf') + totalSF * v('m_install_cost_sf') + v('m_inspect');
    memSched    = v('m_sched_underform') + v('m_sched_walls');
  } else {
    memBaseCost = v('m_pkg_total');
    memSched    = v('m_pkg_sched');
  }

  // Membrane complexity adders
  var memCJCost   = d.cjLF * v('m_cj_per_lf');
  var memPenCost  = d.penCount * v('m_pen_per_ea');
  var memPileCost = currentType === 'pilecap' ? d.piles * v('m_pile_boot_per_ea') : 0;
  var memRisk     = v('m_risk_allowance');
  var memComplexity = memCJCost + memPenCost + memPileCost + memRisk;
  var memTotalCost  = memBaseCost + memComplexity;

  var hasPenetron = pAdmixTotal > 0;
  var hasMembrane = memTotalCost > 0;
  var hasCPD      = cpd > 0;

  // ── Step 4: Complexity Scoring ──
  var cxCJ   = Math.floor(d.cjLF / 50);
  var cxPen  = d.penCount;
  var cxPile = d.piles * 2;
  var cxTotal = cxCJ + cxPen + cxPile;

  var riskCategory, riskDelayDays, riskClass;
  if (cxTotal <= 20) {
    riskCategory  = 'Low Risk';
    riskDelayDays = 0.5;
    riskClass     = 'low';
  } else if (cxTotal <= 50) {
    riskCategory  = 'Medium Risk';
    riskDelayDays = 2;
    riskClass     = 'medium';
  } else {
    riskCategory  = 'High Risk';
    riskDelayDays = 5;
    riskClass     = 'high';
  }

  document.getElementById('cx-cj').textContent    = cxCJ;
  document.getElementById('cx-pen').textContent   = cxPen;
  document.getElementById('cx-pile').textContent  = cxPile;
  document.getElementById('cx-total').textContent = cxTotal;
  document.getElementById('cx-risk-label').textContent = riskCategory;

  var riskInfoEl = document.getElementById('risk-info-line');
  var riskCost = riskDelayDays * cpd;
  if (cxTotal > 0) {
    riskInfoEl.style.display = 'block';
    riskInfoEl.className = 'risk-info ' + riskClass;
    var riskMsg = 'Estimated Rework Exposure: ' + riskDelayDays + ' day' + (riskDelayDays !== 1 ? 's' : '');
    if (cpd > 0) riskMsg += '  ·  Risk Cost: ' + fmt$(riskCost);
    riskInfoEl.textContent = riskMsg;
  } else {
    riskInfoEl.style.display = 'none';
  }

  // ── Schedule Acceleration Curve ──
  var sensitivityIdx = parseInt(sel('schedule_sensitivity')) || 1;
  var sensitivityName = SENSITIVITY_LABELS[sensitivityIdx] || 'Balanced';
  var schedDaysSaved = memSched - pSched;
  var accelFactor = schedDaysSaved > 0 ? calcAccelFactor(schedDaysSaved, sensitivityIdx) : 1;
  var projectAccelValue = (schedDaysSaved > 0 && hasCPD) ? Math.round(schedDaysSaved * cpd * accelFactor) : 0;

  document.getElementById('sensitivity-label').textContent = sensitivityName;

  var accelDaysEl  = document.getElementById('accel-days');
  var accelFactEl  = document.getElementById('accel-factor');
  var accelValEl   = document.getElementById('accel-value');
  var accelSubEl   = document.getElementById('accel-value-sub');

  if (schedDaysSaved > 0) {
    accelDaysEl.textContent = schedDaysSaved.toFixed(0);
    accelFactEl.textContent = accelFactor.toFixed(2) + '×';
    if (hasCPD) {
      accelValEl.textContent = fmt$(projectAccelValue);
      accelSubEl.textContent = schedDaysSaved.toFixed(0) + ' days × ' + fmt$(cpd) + '/day × ' + accelFactor.toFixed(2);
    } else {
      accelValEl.textContent = '—';
      accelSubEl.textContent = 'Enter cost/day above';
    }
  } else {
    accelDaysEl.textContent = '—';
    accelFactEl.textContent = '—';
    accelValEl.textContent  = '—';
    accelSubEl.textContent  = 'Enter membrane schedule days above';
  }

  if (!hasPenetron && !hasMembrane) {
    document.getElementById('results-body').innerHTML =
      '<div class="placeholder-msg">Complete Steps 1–3 above to see the comparison.</div>';
    return;
  }

  var pSchedCost = pSched * cpd;
  var mSchedCost = memSched * cpd;
  var pTrueTotal = pAdmixTotal + pSchedCost;
  var mTrueTotal = memTotalCost + mSchedCost;
  var pCostPerCY = d.cy > 0    ? pAdmixTotal  / d.cy    : 0;
  var mCostPerCY = d.cy > 0    ? memTotalCost / d.cy    : 0;
  var pCostPerSF = totalSF > 0 ? pAdmixTotal  / totalSF : 0;
  var mCostPerSF = totalSF > 0 ? memTotalCost / totalSF : 0;
  var directDiff = memTotalCost - pAdmixTotal;
  var schedDiff  = memSched - pSched;
  var trueDiff   = mTrueTotal - pTrueTotal;
  var perCYdiff  = mCostPerCY - pCostPerCY;
  var perSFdiff  = mCostPerSF - pCostPerSF;

  function dc(n) { return n > 0 ? 'savings' : (n < 0 ? 'cost' : ''); }
  function dl(n) {
    if (!hasPenetron || !hasMembrane) return '—';
    return (n >= 0 ? '+' : '') + fmt$(n);
  }
  function dld(n) {
    if (!hasPenetron || !hasMembrane) return '—';
    return (n >= 0 ? '+' : '') + n.toFixed(1) + ' days';
  }

  var sfNote = totalSF === 0
    ? '<br><small style="color:var(--text-muted);font-size:.65rem">Enter dimensions in Step 1</small>' : '';

  // Complexity breakdown sub-line (for supporting analysis)
  var complexSub = '';
  if (memComplexity > 0) {
    var parts = [];
    if (memCJCost   > 0) parts.push('CJ: '    + fmt$(memCJCost));
    if (memPenCost  > 0) parts.push('Pen: '   + fmt$(memPenCost));
    if (memPileCost > 0) parts.push('Piles: ' + fmt$(memPileCost));
    if (memRisk     > 0) parts.push('Risk: '  + fmt$(memRisk));
    complexSub = '<div class="metric-sub" style="font-size:.65rem;margin-top:4px">'
      + 'Base: ' + fmt$(memBaseCost) + ' + Detailing: ' + fmt$(memComplexity)
      + '<br>' + parts.join(' · ')
      + '</div>';
  } else {
    complexSub = '<div class="metric-sub">total membrane cost</div>';
  }

  var pAdmixSub = '<div class="metric-sub">admixture add-cost only</div>';
  var detailingMemVal = memComplexity > 0 ? fmt$(memComplexity) : '—';

  var trueTotalRows = '';
  if (hasCPD) {
    trueTotalRows =
      '<div class="metric-cell" style="background:#f0f7ff"><div class="metric-label">Schedule Cost</div></div>'
      + '<div class="metric-cell" style="background:#f0f7ff">'
      + '<div class="metric-value penetron">' + fmt$(pSchedCost) + '</div>'
      + '<div class="metric-sub">' + pSched.toFixed(1) + ' days \xD7 ' + fmt$(cpd) + '/day</div>'
      + '</div>'
      + '<div class="metric-cell" style="background:#f0f7ff">'
      + '<div class="metric-value membrane">' + fmt$(mSchedCost) + '</div>'
      + '<div class="metric-sub">' + memSched.toFixed(1) + ' days \xD7 ' + fmt$(cpd) + '/day</div>'
      + '</div>'
      + '<div class="metric-cell last-row" style="background:#fff7ee"><div class="metric-label" style="font-size:.8rem;color:var(--p-orange)">True Total Cost</div></div>'
      + '<div class="metric-cell last-row" style="background:#fff7ee">'
      + '<div class="metric-value penetron" style="font-size:1.4rem">' + fmt$(pTrueTotal) + '</div>'
      + '<div class="metric-sub">direct + schedule</div>'
      + '</div>'
      + '<div class="metric-cell last-row" style="background:#fff7ee">'
      + '<div class="metric-value membrane" style="font-size:1.4rem">' + fmt$(mTrueTotal) + '</div>'
      + '<div class="metric-sub">direct + schedule</div>'
      + '</div>'
      + '<div class="metric-cell last-row"><div class="metric-label">True Total Savings</div></div>'
      + '<div class="metric-cell last-row" style="grid-column:2/4">'
      + '<div class="metric-value diff ' + dc(trueDiff) + '" style="font-size:1.35rem">'
      + ((hasPenetron && hasMembrane) ? ((trueDiff >= 0 ? 'Penetron saves ' : 'Membrane saves ') + fmt$(Math.abs(trueDiff))) : '—')
      + '</div></div>';
  }

  var schedNoteColor = schedDiff > 0 ? 'var(--green)' : (schedDiff < 0 ? '#c0392b' : 'var(--text-muted)');
  var schedNoteText = (hasCPD && schedDiff !== 0)
    ? '<div class="sched-note" style="color:' + schedNoteColor + '">'
      + (schedDiff > 0 ? 'Saves ' : 'Costs ') + fmt$(Math.abs(schedDiff * cpd))
      + '</div>'
    : '';

  var lastRowClass = hasCPD ? '' : 'last-row';

  // ── Economic Benefit Calculation ──
  var teiDirectSavings = directDiff > 0 ? directDiff : 0;
  var teiRiskReduction = (hasCPD && cxTotal > 0) ? riskDelayDays * cpd : 0;
  var teiTotal = teiDirectSavings + projectAccelValue + teiRiskReduction;

  // ────────────────────────────────────────
  // LAYER 1: Executive Recommendation
  // ────────────────────────────────────────
  var detailTotal = cxCJ + d.penCount + d.piles;

  var elimParts = [];
  if (d.piles > 0) elimParts.push(fmtN(d.piles) + ' pile penetration' + (d.piles !== 1 ? 's' : ''));
  if (d.penCount > 0) elimParts.push(fmtN(d.penCount) + ' penetration flashing' + (d.penCount !== 1 ? 's' : ''));
  if (cxCJ > 0) elimParts.push(fmtN(cxCJ) + ' construction-joint detail' + (cxCJ !== 1 ? 's' : ''));

  var recPhrases = [];
  if (elimParts.length > 0) {
    var elimJoined = elimParts.length === 1 ? elimParts[0]
      : elimParts.slice(0, -1).join(', ') + ' and ' + elimParts[elimParts.length - 1];
    recPhrases.push('eliminates ' + elimJoined);
  }
  if (riskClass !== 'low') {
    recPhrases.push('reduces waterproofing risk from <strong>' + riskCategory + '</strong> to <strong>Low Risk</strong>');
  }
  if (schedDiff > 0) {
    recPhrases.push('shortens the critical path by <strong>' + schedDiff.toFixed(1) + ' day' + (schedDiff !== 1 ? 's' : '') + '</strong>');
  }

  var recNarrative;
  if (recPhrases.length > 0 && teiTotal > 0) {
    recNarrative = 'Penetron ' + recPhrases.join(', ') + ', and generates an estimated economic benefit of <strong>' + fmt$(teiTotal) + '</strong>.';
  } else if (recPhrases.length > 0) {
    recNarrative = 'Penetron ' + recPhrases.join(', ') + '.';
  } else if (teiTotal > 0) {
    recNarrative = 'Penetron generates an estimated economic benefit of <strong>' + fmt$(teiTotal) + '</strong> compared to the membrane system.';
  } else {
    recNarrative = 'Enter cost and schedule data in Steps 2–4 to generate a complete economic recommendation.';
  }

  var execRecCard = '<div class="exec-rec-card">'
    + '<div class="exec-rec-eyebrow">Executive Recommendation</div>'
    + '<div class="exec-rec-narrative">' + recNarrative + '</div>'
    + '</div>';

  // ────────────────────────────────────────
  // LAYER 2: KPI Cards
  // ────────────────────────────────────────

  // Card 1 — Economic Benefit
  var kpi1 = '<div class="kpi-card kpi-highlight">'
    + '<div class="kpi-label">Estimated Economic Benefit</div>'
    + '<div class="kpi-value">' + (teiTotal > 0 ? fmt$(teiTotal) : '—') + '</div>'
    + '<div class="kpi-sub">vs. membrane system</div>'
    + '</div>';

  // Card 2 — Critical Path
  var kpiDaysDisplay = schedDiff > 0
    ? '<span style="color:var(--green)">' + schedDiff.toFixed(0) + ' Days Faster</span>'
    : (schedDiff < 0
      ? '<span style="color:#c0392b">' + Math.abs(schedDiff).toFixed(0) + ' Days Slower</span>'
      : '<span>No Change</span>');
  var kpiSchedSub = hasCPD && schedDiff !== 0
    ? 'Estimated time value:<br><strong>' + fmt$(Math.abs(schedDiff * cpd)) + '</strong>'
    : 'Enter cost/day above to quantify';
  var kpi2 = '<div class="kpi-card">'
    + '<div class="kpi-label">Critical Path Improvement</div>'
    + '<div class="kpi-value kpi-days">' + kpiDaysDisplay + '</div>'
    + '<div class="kpi-sub">' + kpiSchedSub + '</div>'
    + '</div>';

  // Card 3 — Details Eliminated
  var detailLines = '';
  if (d.piles > 0) detailLines += '<div class="kpi-detail-line">' + d.piles + ' pile penetration' + (d.piles !== 1 ? 's' : '') + '</div>';
  if (d.penCount > 0) detailLines += '<div class="kpi-detail-line">' + d.penCount + ' penetration' + (d.penCount !== 1 ? 's' : '') + '</div>';
  if (cxCJ > 0) detailLines += '<div class="kpi-detail-line">' + cxCJ + ' CJ detail' + (cxCJ !== 1 ? 's' : '') + '</div>';
  var kpi3 = '<div class="kpi-card">'
    + '<div class="kpi-label">High-Risk Details Eliminated</div>'
    + '<div class="kpi-value">' + detailTotal + '</div>'
    + (detailLines || '<div class="kpi-sub">Enter quantities in Step 1</div>')
    + '</div>';

  // Card 4 — Risk
  var riskFromLabel = riskClass !== 'low' ? riskCategory : 'Low Risk';
  var riskDisplay = '<span class="risk-chip risk-' + riskClass + '">' + riskFromLabel + '</span>'
    + '<span class="risk-arrow"> → </span>'
    + '<span class="risk-chip risk-low">Low Risk</span>';
  var kpi4 = '<div class="kpi-card">'
    + '<div class="kpi-label">Waterproofing Risk</div>'
    + '<div class="kpi-risk-display">' + riskDisplay + '</div>'
    + '<div class="kpi-sub">Estimated rework exposure ' + (riskClass !== 'low' ? 'reduced' : 'manageable') + '</div>'
    + '</div>';

  var kpiRow = '<div class="kpi-row">' + kpi1 + kpi2 + kpi3 + kpi4 + '</div>';

  // ────────────────────────────────────────
  // LAYER 3a: High-Risk Details + Rework Exposure
  // ────────────────────────────────────────
  var detailsCard = '<div class="detail-info-card">'
    + '<div class="detail-info-title">High-Risk Waterproofing Details</div>'
    + '<div class="detail-info-row"><span>Construction joints</span><span>' + (d.cjLF > 0 ? fmtN(d.cjLF) + ' LF' : '—') + '</span></div>'
    + '<div class="detail-info-row"><span>Penetrations</span><span>' + (d.penCount > 0 ? d.penCount + ' ea' : '—') + '</span></div>'
    + (currentType === 'pilecap' ? '<div class="detail-info-row"><span>Pile penetrations</span><span>' + (d.piles > 0 ? d.piles + ' ea' : '—') + '</span></div>' : '')
    + '<div class="detail-info-row total"><span>Total high-risk details</span><span>' + detailTotal + '</span></div>'
    + '<div class="detail-info-exposure ' + riskClass + '">'
    + '<div class="detail-info-exposure-label">Estimated Rework Exposure</div>'
    + '<div class="detail-info-exposure-level">' + (riskClass === 'high' ? 'High' : riskClass === 'medium' ? 'Medium' : 'Low') + '</div>'
    + (hasCPD && cxTotal > 0 ? '<div class="detail-info-exposure-cost">Estimated cost impact: <strong>' + fmt$(riskCost) + '</strong></div>' : '')
    + '</div>'
    + '</div>';

  // ────────────────────────────────────────
  // LAYER 3b: Trade Coordination
  // ────────────────────────────────────────
  var memInterfaces = 3 + (d.cjLF > 0 ? 1 : 0) + (d.penCount > 0 ? 1 : 0) + (d.piles > 0 ? 1 : 0);
  var penInterfaces = 1 + (d.cjLF > 0 ? 1 : 0);
  var tradeReduction = Math.round((1 - penInterfaces / memInterfaces) * 100);

  var memTradeList = '<li>Waterproofing subcontractor</li><li>Membrane inspection</li><li>Repair / remediation contingency</li>';
  if (d.cjLF > 0) memTradeList += '<li>Construction-joint waterproofing</li>';
  if (d.penCount > 0) memTradeList += '<li>Penetration detailing</li>';
  if (d.piles > 0) memTradeList += '<li>Pile boot / flashing</li>';

  var penTradeList = '<li>Ready-mix supplier</li>';
  if (d.cjLF > 0) penTradeList += '<li>Waterstop installation</li>';

  var tradeCard = '<div class="trade-card">'
    + '<div class="trade-card-title">Trade Coordination Reduction</div>'
    + '<div class="trade-systems">'
    + '<div class="trade-col"><div class="trade-col-header membrane-label">Membrane System</div><ul class="trade-list membrane-list">' + memTradeList + '</ul></div>'
    + '<div class="trade-col"><div class="trade-col-header penetron-label">Penetron</div><ul class="trade-list penetron-list">' + penTradeList + '</ul></div>'
    + '</div>'
    + '<div class="trade-metrics">'
    + '<div class="trade-metric"><span>Membrane trade interfaces</span><strong>' + memInterfaces + '</strong></div>'
    + '<div class="trade-metric"><span>Penetron trade interfaces</span><strong>' + penInterfaces + '</strong></div>'
    + '<div class="trade-metric highlight"><span>Coordination reduction</span><strong>' + tradeReduction + '%</strong></div>'
    + '</div>'
    + '</div>';

  var detailsTradeRow = '<div class="details-trade-row">' + detailsCard + tradeCard + '</div>';

  // ────────────────────────────────────────
  // TEI Breakdown Card
  // ────────────────────────────────────────
  var teiCard = '';
  if (hasPenetron && hasMembrane) {
    var accelLabel = schedDiff > 0
      ? schedDiff.toFixed(0) + ' days × ' + fmt$(cpd) + '/day × ' + accelFactor.toFixed(2) + ' (' + sensitivityName + ')'
      : 'no schedule advantage';
    teiCard = '<div class="tei-card">'
      + '<div class="tei-title">Economic Benefit Breakdown</div>'
      + '<div class="tei-row"><span class="tei-row-label">Direct Cost Savings</span><span class="tei-row-value">' + (teiDirectSavings > 0 ? fmt$(teiDirectSavings) : '—') + '</span></div>'
      + '<div class="tei-row"><span class="tei-row-label">Project Acceleration Value (' + accelLabel + ')</span><span class="tei-row-value">' + (projectAccelValue > 0 ? fmt$(projectAccelValue) : '—') + '</span></div>'
      + '<div class="tei-row"><span class="tei-row-label">Estimated Rework Exposure Reduction</span><span class="tei-row-value">' + (teiRiskReduction > 0 ? fmt$(teiRiskReduction) : '—') + '</span></div>'
      + '<div class="tei-total-row"><span class="tei-total-label">Estimated Economic Benefit</span><span class="tei-total-value">' + (teiTotal > 0 ? fmt$(teiTotal) : '—') + '</span></div>'
      + '</div>';
  }

  // ────────────────────────────────────────
  // LAYER 3 (Supporting): Financial Analysis
  // ────────────────────────────────────────
  var compGrid = '<div class="comparison-grid">'
    + '<div class="col-header">Metric</div>'
    + '<div class="col-header" style="color:var(--p-orange)">Penetron Admixture</div>'
    + '<div class="col-header" style="color:var(--p-navy)">Membrane System</div>'

    + '<div class="metric-cell"><div class="metric-label">Direct Cost</div></div>'
    + '<div class="metric-cell"><div class="metric-value penetron">' + (hasPenetron ? fmt$(pAdmixTotal) : '—') + '</div>' + pAdmixSub + '</div>'
    + '<div class="metric-cell"><div class="metric-value membrane">' + (hasMembrane ? fmt$(memTotalCost) : '—') + '</div>' + complexSub + '</div>'

    + '<div class="metric-cell"><div class="metric-label">Detailing Cost</div></div>'
    + '<div class="metric-cell"><div class="metric-value" style="color:var(--green);font-size:.95rem">$0</div><div class="metric-sub">included in admixture</div></div>'
    + '<div class="metric-cell"><div class="metric-value membrane">' + detailingMemVal + '</div><div class="metric-sub">CJ + penetrations + pile boots + allowance</div></div>'

    + '<div class="metric-cell"><div class="metric-label">Cost / CY</div></div>'
    + '<div class="metric-cell"><div class="metric-value penetron">' + ((hasPenetron && d.cy > 0) ? fmt$(pCostPerCY) : '—') + '</div><div class="metric-sub">admixture / CY</div></div>'
    + '<div class="metric-cell"><div class="metric-value membrane">' + ((hasMembrane && d.cy > 0) ? fmt$(mCostPerCY) : '—') + '</div><div class="metric-sub">membrane / CY</div></div>'

    + '<div class="metric-cell"><div class="metric-label">Δ per CY</div></div>'
    + '<div class="metric-cell" style="grid-column:2/4"><div class="metric-value diff ' + dc(perCYdiff) + '">' + ((hasPenetron && hasMembrane && d.cy > 0) ? dl(perCYdiff) : '—') + '</div></div>'

    + '<div class="metric-cell"><div class="metric-label">Cost / SF' + sfNote + '</div></div>'
    + '<div class="metric-cell"><div class="metric-value penetron">' + ((hasPenetron && totalSF > 0) ? fmt$(pCostPerSF) : '—') + '</div><div class="metric-sub">admixture / SF</div></div>'
    + '<div class="metric-cell"><div class="metric-value membrane">' + ((hasMembrane && totalSF > 0) ? fmt$(mCostPerSF) : '—') + '</div><div class="metric-sub">membrane / SF</div></div>'

    + '<div class="metric-cell ' + lastRowClass + '"><div class="metric-label">Δ per SF</div></div>'
    + '<div class="metric-cell ' + lastRowClass + '" style="grid-column:2/4"><div class="metric-value diff ' + dc(perSFdiff) + '">' + ((hasPenetron && hasMembrane && totalSF > 0) ? dl(perSFdiff) : '—') + '</div></div>'

    + trueTotalRows
    + '</div>';

  var schedComp = '<div class="schedule-comparison">'
    + '<div class="sched-card penetron">'
    + '<div class="sched-title">Penetron Schedule Impact</div>'
    + '<div class="sched-days">' + pSched.toFixed(1) + '</div>'
    + '<div class="sched-unit">critical path days added</div>'
    + (hasCPD ? '<div class="sched-note" style="color:var(--p-orange)">' + fmt$(pSchedCost) + ' schedule cost</div>' : '')
    + '</div>'
    + '<div class="sched-card membrane">'
    + '<div class="sched-title">Membrane Schedule Impact</div>'
    + '<div class="sched-days">' + memSched.toFixed(1) + '</div>'
    + '<div class="sched-unit">critical path days added</div>'
    + (hasCPD ? '<div class="sched-note" style="color:var(--p-navy)">' + fmt$(mSchedCost) + ' schedule cost</div>' : '')
    + '</div>'
    + '<div class="sched-card diff-card">'
    + '<div class="sched-title">Schedule Advantage</div>'
    + '<div class="sched-days" style="font-size:1.4rem;color:' + schedNoteColor + '">' + ((hasPenetron || hasMembrane) ? dld(schedDiff) : '—') + '</div>'
    + '<div class="sched-unit">' + (schedDiff > 0 ? 'Penetron faster' : (schedDiff < 0 ? 'Membrane faster' : 'Equal')) + '</div>'
    + schedNoteText
    + '</div>'
    + '</div>';

  document.getElementById('results-body').innerHTML =
    execRecCard
    + kpiRow
    + detailsTradeRow
    + teiCard
    + '<div class="section-divider">Supporting Financial Analysis</div>'
    + compGrid
    + schedComp;
}

compute();
