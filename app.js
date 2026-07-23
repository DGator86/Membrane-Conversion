var currentType = 'slab';
var slabDimMode = 'lw';
var sensitivityIdx = 1;

var SENS_DESCS = [
  'Conservative — lower multiplier, closer to raw day count',
  'Balanced — moderate multiplier for schedule savings',
  'Aggressive — higher multiplier, reflects strong South FL market'
];

function setSensitivity(idx) {
  sensitivityIdx = idx;
  document.querySelectorAll('.sens-btn').forEach(function(b) {
    b.classList.toggle('active', parseInt(b.dataset.idx) === idx);
  });
  var descEl = document.getElementById('sensitivity-desc');
  if (descEl) descEl.textContent = SENS_DESCS[idx] || SENS_DESCS[1];
  compute();
}

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
function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

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
  var sensitivityName = SENSITIVITY_LABELS[sensitivityIdx] || 'Balanced';
  var schedDaysSaved = memSched - pSched;
  var accelFactor = schedDaysSaved > 0 ? calcAccelFactor(schedDaysSaved, sensitivityIdx) : 1;
  var projectAccelValue = (schedDaysSaved > 0 && hasCPD) ? Math.round(schedDaysSaved * cpd * accelFactor) : 0;

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
    recNarrative = 'Enter cost and schedule data in Penetron, Membrane, and Schedule &amp; Risk to generate a complete recommendation.';
  }

  // ────────────────────────────────────────
  // UPDATE EXECUTIVE PANEL (always runs)
  // ────────────────────────────────────────
  var projectValueCreated = teiTotal;

  // Hero
  setText('exec-project-value', projectValueCreated > 0 ? fmt$(projectValueCreated) : '—');
  setText('exec-total-value',   projectValueCreated > 0 ? fmt$(projectValueCreated) : '—');

  // Critical Path card
  var cpText = (!hasPenetron && !hasMembrane) ? '—'
    : schedDiff > 0 ? schedDiff.toFixed(0) + ' Days Faster'
    : schedDiff < 0 ? Math.abs(schedDiff).toFixed(0) + ' Days Slower'
    : 'No Change';
  setText('exec-days-faster', cpText);
  setText('exec-schedule-value',
    hasCPD && schedDiff > 0 ? 'Acceleration value: ' + fmt$(projectAccelValue)
    : hasCPD && schedDiff < 0 ? 'Schedule cost: ' + fmt$(Math.abs(schedDiff * cpd))
    : 'Enter cost/day to quantify');

  // Risk card
  var riskEl = document.getElementById('exec-risk-display');
  if (riskEl) {
    if (!hasPenetron && !hasMembrane) {
      riskEl.innerHTML = '—';
    } else if (riskClass !== 'low') {
      riskEl.innerHTML = '<span class="risk-chip risk-' + riskClass + '">' + riskCategory + '</span>'
        + ' <span class="risk-arrow">&rarr;</span> '
        + '<span class="risk-chip risk-low">Low Risk</span>';
    } else {
      riskEl.innerHTML = '<span class="risk-chip risk-low">Low Risk</span>';
    }
  }
  setText('exec-risk-sub', hasCPD && teiRiskReduction > 0
    ? 'Exposure avoided: ' + fmt$(teiRiskReduction)
    : 'Rework exposure managed');

  // Details card
  setText('exec-details', detailTotal > 0 ? String(detailTotal) : '—');
  var detSubParts = [];
  if (cxCJ > 0)       detSubParts.push(cxCJ + ' CJ detail' + (cxCJ !== 1 ? 's' : ''));
  if (d.penCount > 0) detSubParts.push(d.penCount + ' penetration' + (d.penCount !== 1 ? 's' : ''));
  if (d.piles > 0)    detSubParts.push(d.piles + ' pile' + (d.piles !== 1 ? 's' : ''));
  setText('exec-details-sub', detSubParts.length > 0 ? detSubParts.join(' · ') : 'Enter quantities in Scope');

  // Trade Coordination card
  var memInterfaces = 3 + (d.cjLF > 0 ? 1 : 0) + (d.penCount > 0 ? 1 : 0) + (d.piles > 0 ? 1 : 0);
  var penInterfaces = 1 + (d.cjLF > 0 ? 1 : 0);
  var tradeReduction = Math.round((1 - penInterfaces / memInterfaces) * 100);
  setText('exec-coordination', (hasPenetron || hasMembrane) ? tradeReduction + '%' : '—');
  setText('exec-coordination-sub', (hasPenetron || hasMembrane)
    ? penInterfaces + ' vs ' + memInterfaces + ' trade interfaces'
    : 'Fewer trade interfaces');

  // Breakdown rows
  setText('exec-net-cost', (hasPenetron && hasMembrane)
    ? (directDiff >= 0 ? '+' : '') + fmt$(directDiff)
    : '—');
  setText('exec-accel-value', projectAccelValue > 0
    ? '+' + fmt$(projectAccelValue)
    : (hasCPD ? '—' : 'Enter $/day'));
  setText('exec-accel-note', schedDiff > 0 ? '(' + sensitivityName + ')' : '');
  setText('exec-risk-value', teiRiskReduction > 0 ? '+' + fmt$(teiRiskReduction) : '—');

  // Recommendation
  setHTML('exec-recommendation', recNarrative);

  // ────────────────────────────────────────
  // ADVANCED DETAIL (results-body)
  // ────────────────────────────────────────
  if (!hasPenetron && !hasMembrane) {
    document.getElementById('results-body').innerHTML =
      '<div class="placeholder-msg">Complete Penetron and Membrane inputs to see detailed analysis.</div>';
    return;
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
  var kpiSchedSub = hasCPD && schedDiff > 0
    ? 'Acceleration value (' + sensitivityName + '):<br><strong>' + fmt$(projectAccelValue) + '</strong>'
    : (hasCPD && schedDiff < 0
      ? 'Schedule cost: <strong>' + fmt$(Math.abs(schedDiff) * cpd) + '</strong>'
      : 'Enter cost/day above to quantify');
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
  // Full Economic Picture Card
  // ────────────────────────────────────────
  var valueCase = '';
  if (hasPenetron && hasMembrane) {
    var memAllIn = memTotalCost + mSchedCost + teiRiskReduction;
    var pAllIn   = pAdmixTotal; // pSched=0, pRisk=0
    var netAdvantage = memAllIn - pAllIn;
    var rawSchedSavings = mSchedCost; // pSchedCost = 0 always
    var accelPremium = (schedDiff > 0 && accelFactor > 1) ? Math.round(projectAccelValue - rawSchedSavings) : 0;

    function vcAdv(n) {
      if (!hasCPD) return '<span style="color:var(--text-muted)">—</span>';
      return n > 0 ? '<span class="vc-adv positive">Saves ' + fmt$(n) + '</span>'
           : n < 0 ? '<span class="vc-adv negative">Costs ' + fmt$(Math.abs(n)) + '</span>'
           : '<span style="color:var(--text-muted)">Equal</span>';
    }

    var vcRows = '<div class="vc-row">'
      + '<div class="vc-col-label">Direct &amp; Detailing Cost</div>'
      + '<div class="vc-col vc-p">' + fmt$(pAdmixTotal) + '</div>'
      + '<div class="vc-col vc-m">' + fmt$(memTotalCost) + '</div>'
      + '<div class="vc-col vc-a">' + vcAdv(directDiff) + '</div>'
      + '</div>';

    if (hasCPD) {
      vcRows += '<div class="vc-row">'
        + '<div class="vc-col-label">Schedule Impact <span class="vc-note">' + memSched.toFixed(1) + ' days \xD7 ' + fmt$(cpd) + '/day</span></div>'
        + '<div class="vc-col vc-p vc-zero">$0</div>'
        + '<div class="vc-col vc-m">' + fmt$(mSchedCost) + '</div>'
        + '<div class="vc-col vc-a">' + (rawSchedSavings > 0 ? '<span class="vc-adv positive">Saves ' + fmt$(rawSchedSavings) + '</span>' : '<span style="color:var(--text-muted)">—</span>') + '</div>'
        + '</div>';

      vcRows += '<div class="vc-row">'
        + '<div class="vc-col-label">Rework Exposure <span class="vc-note">' + riskCategory + ' · ' + riskDelayDays + ' day est.</span></div>'
        + '<div class="vc-col vc-p vc-zero">$0</div>'
        + '<div class="vc-col vc-m">' + fmt$(teiRiskReduction) + '</div>'
        + '<div class="vc-col vc-a">' + (teiRiskReduction > 0 ? '<span class="vc-adv positive">Saves ' + fmt$(teiRiskReduction) + '</span>' : '<span style="color:var(--text-muted)">—</span>') + '</div>'
        + '</div>';
    }

    vcRows += '<div class="vc-row vc-total-row">'
      + '<div class="vc-col-label">All-In Estimated Cost</div>'
      + '<div class="vc-col vc-p vc-p-total">' + fmt$(pAllIn) + '</div>'
      + '<div class="vc-col vc-m vc-m-total">' + fmt$(memAllIn) + '</div>'
      + '<div class="vc-col vc-a"></div>'
      + '</div>';

    var footerHtml = '<div class="vc-footer">';
    if (hasCPD) {
      footerHtml += '<div class="vc-foot-row vc-net">'
        + '<span>Net Cost Advantage</span>'
        + '<span>' + (netAdvantage > 0 ? fmt$(netAdvantage) : '—') + '</span>'
        + '</div>';
      if (accelPremium > 0) {
        footerHtml += '<div class="vc-foot-row vc-accel">'
          + '<span>Schedule Acceleration Premium <em>(' + sensitivityName + ', ' + accelFactor.toFixed(2) + '\xD7 multiplier)</em></span>'
          + '<span>+ ' + fmt$(accelPremium) + '</span>'
          + '</div>';
      }
    }
    footerHtml += '<div class="vc-foot-row vc-total">'
      + '<span>Estimated Economic Benefit</span>'
      + '<span>' + (teiTotal > 0 ? fmt$(teiTotal) : (hasCPD ? '—' : 'Enter cost/day to quantify')) + '</span>'
      + '</div>'
      + '</div>';

    valueCase = '<div class="value-case-card">'
      + '<div class="vc-title">Full Economic Picture</div>'
      + '<div class="vc-sub">How Penetron compares all-in — direct costs + schedule + rework exposure</div>'
      + '<div class="vc-table">'
      + '<div class="vc-row vc-header">'
      + '<div class="vc-col-label"></div>'
      + '<div class="vc-col" style="color:var(--p-orange);font-weight:700">Penetron</div>'
      + '<div class="vc-col" style="color:var(--p-navy);font-weight:700">Membrane</div>'
      + '<div class="vc-col" style="font-weight:700">Advantage</div>'
      + '</div>'
      + vcRows
      + '</div>'
      + footerHtml
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
    + '<div class="section-divider">Supporting Financial Analysis</div>'
    + compGrid
    + schedComp
    + valueCase;
}

/* ══════════════════════════════════════════════════════════════
   PROJECT INFO · SAVED WORK · LEAD CAPTURE · PRINT ONE-PAGER
   ══════════════════════════════════════════════════════════════ */

// ── CONFIG ────────────────────────────────────────────────────
// To route captured leads to your CRM / inbox, set this to a URL that
// accepts a JSON POST (Formspree, Zapier/Make webhook, Google Apps
// Script, a Supabase Edge Function, etc.). While empty, leads are still
// captured in the browser (localStorage key "penetron_leads") so nothing
// is lost — they simply are not transmitted yet.
var LEAD_ENDPOINT = '';

var REP_KEY      = 'penetron_rep';
var STATE_KEY    = 'penetron_current_state';
var PROJECTS_KEY = 'penetron_saved_projects';
var LEADS_KEY    = 'penetron_leads';

// ── storage + small helpers ──────────────────────────────────
function getJSON(k) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function setJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function val(id) { var el = document.getElementById(id); return el ? (el.value || '') : ''; }
function txt(id) { var el = document.getElementById(id); return el ? (el.textContent || '').trim() : ''; }
function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function toast(msg) {
  var t = document.getElementById('__toast');
  if (!t) { t = document.createElement('div'); t.id = '__toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t.__timer);
  t.__timer = setTimeout(function () { t.classList.remove('show'); }, 2800);
}

// ── state serialize / restore ─────────────────────────────────
function collectState() {
  var fields = {};
  document.querySelectorAll('.input-panel input, .input-panel select').forEach(function (el) {
    if (!el.id) return;
    fields[el.id] = (el.type === 'checkbox') ? el.checked : el.value;
  });
  return { fields: fields, currentType: currentType, slabDimMode: slabDimMode, sensitivityIdx: sensitivityIdx, ts: Date.now() };
}

function applyState(st) {
  if (!st || !st.fields) { compute(); return; }
  Object.keys(st.fields).forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!st.fields[id];
    else el.value = st.fields[id];
  });
  if (st.currentType) selectType(st.currentType);
  if (st.slabDimMode) setSlabDimMode(st.slabDimMode);
  if (typeof st.sensitivityIdx === 'number') setSensitivity(st.sensitivityIdx);
  toggleMode();      // syncs Line/Packaged UI from the restored checkbox
  compute();
}

var __saveTimer;
function scheduleAutosave() {
  clearTimeout(__saveTimer);
  __saveTimer = setTimeout(function () { setJSON(STATE_KEY, collectState()); }, 400);
}
function onProjectInfoInput() { scheduleAutosave(); }

// ── rep identity + lead gate ──────────────────────────────────
function getRep() { return getJSON(REP_KEY); }

function renderRepBadge() {
  var rep = getRep();
  var nameEl = document.getElementById('rep-badge-name');
  var coEl   = document.getElementById('rep-badge-co');
  if (rep) {
    if (nameEl) nameEl.textContent = rep.name;
    if (coEl)   coEl.textContent   = rep.company;
  } else {
    if (nameEl) nameEl.textContent = 'Not registered';
    if (coEl)   coEl.textContent   = 'Register to begin';
  }
}

function openLeadGate(edit) {
  var rep = getRep();
  if (rep) {
    document.getElementById('lead_name').value    = rep.name || '';
    document.getElementById('lead_company').value = rep.company || '';
    document.getElementById('lead_email').value   = rep.email || '';
    document.getElementById('lead_phone').value   = rep.phone || '';
    document.getElementById('lead_role').value    = rep.role || '';
    document.getElementById('lead_consent').checked = true;
  }
  leadError('');
  document.getElementById('lead-gate').classList.add('open');
  if (!rep) document.body.classList.add('locked');   // hard gate on first use
}

function leadError(msg) { var e = document.getElementById('lead-error'); if (e) e.textContent = msg || ''; }

function submitLeadGate(e) {
  e.preventDefault();
  var name    = val('lead_name').trim();
  var company = val('lead_company').trim();
  var email   = val('lead_email').trim();
  var phone   = val('lead_phone').trim();
  if (!name || !company || !email || !phone) { leadError('Please complete all required fields.'); return false; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { leadError('Please enter a valid work email.'); return false; }
  if (!document.getElementById('lead_consent').checked) { leadError('Please confirm you agree to be contacted.'); return false; }

  var existing = getRep();
  var rep = {
    name: name, company: company, email: email, phone: phone,
    role: val('lead_role'),
    registeredAt: (existing && existing.registeredAt) ? existing.registeredAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  setJSON(REP_KEY, rep);

  document.getElementById('lead-gate').classList.remove('open');
  document.body.classList.remove('locked');
  renderRepBadge();

  var pb = document.getElementById('proj_prepared_by');
  if (pb && !pb.value) { pb.value = name; scheduleAutosave(); }

  recordLead(existing ? 'update' : 'register');
  toast('Welcome, ' + name.split(' ')[0] + ' — your work is now being saved.');
  return false;
}

// ── lead recording + transmission ─────────────────────────────
function projectInfo() {
  return {
    name: val('proj_name'), address: val('proj_address'), owner: val('proj_owner'),
    gc: val('proj_gc'), preparedBy: val('proj_prepared_by'), date: val('proj_date'), notes: val('proj_notes')
  };
}

function resultsSummary() {
  return {
    scopeType:      currentType,
    concreteCY:     txt('d-cy'),
    waterproofSF:   (function () { var b = txt('d-bottom'), w = txt('d-walls'); return b + ' / ' + w; })(),
    projectValue:   txt('exec-project-value'),
    criticalPath:   txt('exec-days-faster'),
    scheduleValue:  txt('exec-schedule-value'),
    risk:           txt('exec-risk-display'),
    details:        txt('exec-details'),
    detailsSub:     txt('exec-details-sub'),
    coordination:   txt('exec-coordination'),
    coordinationSub:txt('exec-coordination-sub'),
    netCost:        txt('exec-net-cost'),
    accelValue:     txt('exec-accel-value'),
    riskValue:      txt('exec-risk-value'),
    recommendation: txt('exec-recommendation')
  };
}

function recordLead(event) {
  var rep = getRep();
  if (!rep) return;
  var lead = { event: event, at: new Date().toISOString(), rep: rep, project: projectInfo(), results: resultsSummary() };
  var leads = getJSON(LEADS_KEY) || [];
  leads.push(lead);
  // keep the local log from growing without bound
  if (leads.length > 200) leads = leads.slice(leads.length - 200);
  setJSON(LEADS_KEY, leads);
  sendLead(lead);
}

function sendLead(lead) {
  if (!LEAD_ENDPOINT) return;
  try {
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    }).catch(function () {});
  } catch (e) {}
}

// ── saved projects ────────────────────────────────────────────
function saveProject() {
  if (!getRep()) { openLeadGate(); return; }
  var pi = projectInfo();
  var defName = pi.name || ('Project ' + new Date().toLocaleDateString());
  var name = window.prompt('Save this project as:', defName);
  if (name === null) return;
  name = name.trim() || defName;

  var projects = getJSON(PROJECTS_KEY) || [];
  var snap = {
    id: 'p_' + Date.now(),
    name: name,
    savedAt: new Date().toISOString(),
    state: collectState(),
    summary: resultsSummary(),
    project: pi
  };
  projects.push(snap);
  setJSON(PROJECTS_KEY, projects);
  setJSON(STATE_KEY, snap.state);
  recordLead('save');
  toast('Saved "' + name + '"');
}

function openProjectsModal() {
  renderProjects();
  document.getElementById('projects-modal').classList.add('open');
}
function closeProjectsModal() { document.getElementById('projects-modal').classList.remove('open'); }

function renderProjects() {
  var list = document.getElementById('projects-list');
  var projects = getJSON(PROJECTS_KEY) || [];
  if (!projects.length) {
    list.innerHTML = '<div class="saved-empty">No saved projects yet. Fill in a project and press <strong>Save</strong>.</div>';
    return;
  }
  var html = '';
  for (var i = projects.length - 1; i >= 0; i--) {
    var p = projects[i];
    var when = new Date(p.savedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    var value = (p.summary && p.summary.projectValue && p.summary.projectValue !== '—') ? ' · ' + esc(p.summary.projectValue) + ' value' : '';
    html += '<div class="saved-item">'
      + '<div class="saved-item-info">'
      + '<div class="saved-item-name">' + esc(p.name) + '</div>'
      + '<div class="saved-item-meta">' + when + value + '</div>'
      + '</div>'
      + '<div class="saved-item-actions">'
      + '<button class="saved-load-btn" onclick="loadProject(\'' + p.id + '\')">Load</button>'
      + '<button class="saved-del-btn" onclick="deleteProject(\'' + p.id + '\')">Delete</button>'
      + '</div>'
      + '</div>';
  }
  list.innerHTML = html;
}

function loadProject(id) {
  var projects = getJSON(PROJECTS_KEY) || [];
  var snap = null;
  for (var i = 0; i < projects.length; i++) if (projects[i].id === id) { snap = projects[i]; break; }
  if (!snap) return;
  applyState(snap.state);
  setJSON(STATE_KEY, snap.state);
  closeProjectsModal();
  toast('Loaded "' + snap.name + '"');
}

function deleteProject(id) {
  var projects = getJSON(PROJECTS_KEY) || [];
  projects = projects.filter(function (p) { return p.id !== id; });
  setJSON(PROJECTS_KEY, projects);
  renderProjects();
}

// ── print one-pager ───────────────────────────────────────────
var PENETRON_SVG = '<svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M15 3 C15 3 6 10 6 17.5 A9 9 0 0 0 24 17.5 C24 10 15 3 15 3Z" fill="white" opacity="0.9"/>'
  + '<path d="M15 10 C15 10 10 14.5 10 17.5 A5 5 0 0 0 20 17.5 C20 14.5 15 10 15 10Z" fill="#F5901E"/></svg>';

function printOnePager() {
  if (!getRep()) { openLeadGate(); return; }
  buildPrintDoc();
  recordLead('print');
  setTimeout(function () { window.print(); }, 60);
}

function pdRow(k, v) {
  if (!v) return '';
  return '<div class="pd-proj-row"><span class="k">' + esc(k) + '</span><span class="val">' + esc(v) + '</span></div>';
}

function buildPrintDoc() {
  var pi  = projectInfo();
  var r   = resultsSummary();
  var rep = getRep() || {};

  var dateStr = pi.date
    ? new Date(pi.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // metric cards mirror the on-screen Executive View
  var riskTarget = r.risk && r.risk.indexOf('Low Risk') !== -1 ? 'Low Risk' : (r.risk || '—');
  var metrics = ''
    + '<div class="pd-metric"><div class="pd-metric-label">Critical Path</div><div class="pd-metric-value">' + esc(r.criticalPath || '—') + '</div><div class="pd-metric-sub">' + esc(r.scheduleValue || '') + '</div></div>'
    + '<div class="pd-metric"><div class="pd-metric-label">Waterproofing Risk</div><div class="pd-metric-value">' + esc(riskTarget) + '</div><div class="pd-metric-sub">' + esc(r.risk || 'Rework exposure managed') + '</div></div>'
    + '<div class="pd-metric"><div class="pd-metric-label">Details Eliminated</div><div class="pd-metric-value">' + esc(r.details || '—') + '</div><div class="pd-metric-sub">' + esc(r.detailsSub || '') + '</div></div>'
    + '<div class="pd-metric"><div class="pd-metric-label">Trade Coordination</div><div class="pd-metric-value">' + esc(r.coordination || '—') + '</div><div class="pd-metric-sub">' + esc(r.coordinationSub || '') + '</div></div>';

  // "Why switch" — dynamic lead-ins from the live analysis + evergreen advantages
  var why = '';
  if (r.projectValue && r.projectValue !== '—')
    why += '<li>Delivers an estimated <strong>' + esc(r.projectValue) + '</strong> in project value versus a hydrostatic membrane system.</li>';
  if (r.criticalPath && /Faster/i.test(r.criticalPath))
    why += '<li>Takes waterproofing off the critical path — <strong>' + esc(r.criticalPath) + '</strong> to structural completion.</li>';
  if (r.details && r.details !== '—' && r.details !== '0')
    why += '<li>Eliminates <strong>' + esc(r.details) + '</strong> high-risk details at joints, penetrations, and pile heads — the exact points where membranes fail.</li>';
  why += ''
    + '<li><strong>Integral &amp; permanent</strong> — becomes part of the concrete itself; it cannot be punctured, delaminate, or be damaged by backfill or follow-on trades.</li>'
    + '<li><strong>Self-seals</strong> hairline cracks through ongoing crystalline growth and reactivates whenever water returns — for the life of the structure.</li>'
    + '<li><strong>No dedicated waterproofing trade or inspection hold</strong> — dosed at the ready-mix plant, so the slab pours on schedule.</li>'
    + '<li><strong>Removes membrane callback exposure</strong> — no chasing a leak from the dry side or tearing out finished space to remediate.</li>'
    + '<li>Proven and warrantable against <strong>hydrostatic pressure</strong> in below-grade construction.</li>';

  var econ = ''
    + '<div class="pd-econ-row"><span>Net Cost Advantage</span><span class="amt">' + esc(r.netCost || '—') + '</span></div>'
    + '<div class="pd-econ-row"><span>Schedule Acceleration Value</span><span class="amt">' + esc(r.accelValue || '—') + '</span></div>'
    + '<div class="pd-econ-row"><span>Rework Exposure Reduction</span><span class="amt">' + esc(r.riskValue || '—') + '</span></div>'
    + '<div class="pd-econ-row total"><span>Project Value Created</span><span class="amt">' + esc(r.projectValue || '—') + '</span></div>';

  var projBlock = ''
    + pdRow('Project', pi.name)
    + pdRow('Address', pi.address)
    + pdRow('Owner', pi.owner)
    + pdRow('Contractor', pi.gc)
    + pdRow('Prepared by', pi.preparedBy || rep.name)
    + pdRow('Date', dateStr);
  if (!projBlock) projBlock = '<div class="pd-proj-row"><span class="val">Below-Grade Waterproofing Value Analysis</span></div>';

  var recBlock = (r.recommendation && r.recommendation.indexOf('Complete the inputs') === -1)
    ? '<div class="pd-rec"><div class="pd-rec-label">Recommendation</div><p>' + esc(r.recommendation) + '</p></div>'
    : '';

  var notesBlock = pi.notes
    ? '<div class="pd-notes"><strong>Project notes:</strong> ' + esc(pi.notes) + '</div>'
    : '';

  var contact = '';
  if (rep.name) {
    contact = '<div class="pd-contact">'
      + '<div class="nm">' + esc(rep.name) + '</div>'
      + (rep.company ? '<div>' + esc(rep.company) + '</div>' : '')
      + (rep.email ? '<div>' + esc(rep.email) + '</div>' : '')
      + (rep.phone ? '<div>' + esc(rep.phone) + '</div>' : '')
      + '</div>';
  }

  document.getElementById('print-doc').innerHTML =
    '<div class="pd-wrap">'
    + '<div class="pd-header">'
    + '<div class="pd-logo">' + PENETRON_SVG + '</div>'
    + '<div><div class="pd-brand-name">PENETRON</div><div class="pd-brand-tag">Total Concrete Protection</div></div>'
    + '<div class="pd-header-title"><h1>Below-Grade Waterproofing Value Analysis</h1><p>Crystalline admixture vs. hydrostatic membrane</p></div>'
    + '</div>'
    + '<div class="pd-proj">' + projBlock + '</div>'
    + '<div class="pd-hero"><div class="pd-hero-label">Project Value Created</div>'
    + '<div class="pd-hero-value">' + esc(r.projectValue || '—') + '</div>'
    + '<div class="pd-hero-sub">Compared with a hydrostatic membrane system</div></div>'
    + '<div class="pd-metrics">' + metrics + '</div>'
    + '<div class="pd-cols">'
    + '<div><div class="pd-section-title">Why Switch to Penetron</div><ul class="pd-why">' + why + '</ul></div>'
    + '<div><div class="pd-section-title">Economic Picture</div>' + econ + '</div>'
    + '</div>'
    + recBlock
    + notesBlock
    + '<div class="pd-footer">'
    + (contact || '<div class="pd-contact"><div class="nm">Penetron</div></div>')
    + '<div class="pd-disclaimer">Figures are indicative estimates generated from the inputs provided in the Below-Grade Waterproofing Conversion Tool. Verify quantities and pricing with your Penetron representative before use in a bid.</div>'
    + '</div>'
    + '</div>';
}

// ── init ──────────────────────────────────────────────────────
function initApp() {
  var dEl = document.getElementById('proj_date');
  if (dEl && !dEl.value) dEl.value = new Date().toISOString().slice(0, 10);

  var st = getJSON(STATE_KEY);
  if (st) applyState(st); else compute();

  renderRepBadge();
  var rep = getRep();
  if (rep) {
    var pb = document.getElementById('proj_prepared_by');
    if (pb && !pb.value) pb.value = rep.name;
  } else {
    openLeadGate();
  }

  var panel = document.querySelector('.input-panel');
  if (panel) {
    panel.addEventListener('input', scheduleAutosave);
    panel.addEventListener('change', scheduleAutosave);
  }

  // clicking the dim backdrop closes the gate only after registration (edit mode)
  var gate = document.getElementById('lead-gate');
  if (gate) gate.addEventListener('mousedown', function (e) { if (e.target === this && getRep()) this.classList.remove('open'); });
  var pm = document.getElementById('projects-modal');
  if (pm) pm.addEventListener('mousedown', function (e) { if (e.target === this) closeProjectsModal(); });
}

initApp();
