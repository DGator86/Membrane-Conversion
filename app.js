let currentType = 'slab';

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

function fmt$(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function fmtN(n, dec) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
}

function calcDerived() {
  var cy = 0, bottomSF = 0, wallSF = 0, cjLF = 0, piles = 0, penCount = 0;

  if (currentType === 'slab') {
    var l = v('slab_l'), w = v('slab_w'), t = v('slab_t') / 12;
    var wh = v('slab_wall_h');
    var wt = (v('slab_wall_t') || v('slab_t')) / 12;
    var perimeter = 2 * (l + w);
    cy = (l * w * t) / 27;
    if (wh > 0 && wt > 0) cy += (perimeter * wh * wt) / 27;
    bottomSF = l * w;
    wallSF = wh > 0 ? perimeter * wh : 0;
    cjLF = v('slab_cj_lf');
    penCount = v('slab_pen_count');
    var note = document.getElementById('slab-perimeter-note');
    if (l > 0 && w > 0) {
      note.style.display = 'block';
      document.getElementById('slab-perimeter-val').textContent = fmtN(perimeter);
    } else {
      note.style.display = 'none';
    }

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
    penCount = piles;

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
  document.getElementById('p_cj_display').textContent     = cjText;
  document.getElementById('m_sf_display').textContent     = sfText;
  document.getElementById('m_sf_display_pkg').textContent = sfText;
  document.getElementById('m_cj_display').textContent     = cjText;
  document.getElementById('m_pen_display').textContent    = penText;
  document.getElementById('m_pile_display').textContent   = pileText;

  // Penetron costs
  var pCostCY      = v('p_cost_per_cy');
  var pSched       = v('p_schedule');
  var penebarPerLF = v('p_penebar_per_lf');
  var pAdmixCost   = d.cy * pCostCY;
  var pPenebarCost = d.cjLF * penebarPerLF;
  var pAdmixTotal  = pAdmixCost + pPenebarCost;

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

  var effectiveDiff = hasCPD ? trueDiff : directDiff;
  var costLabel = hasCPD ? 'true total cost (incl. critical path value)' : 'direct waterproofing cost';
  var saveAmt = fmt$(Math.abs(effectiveDiff));

  var verdict = '';
  if (hasPenetron && hasMembrane) {
    if (effectiveDiff > 0 && schedDiff >= 0)
      verdict = '<div class="verdict penetron-wins">&#x2705; Penetron saves ' + saveAmt + ' in ' + costLabel + ' and reduces critical path by ' + schedDiff.toFixed(1) + ' day(s).</div>';
    else if (effectiveDiff < 0 && schedDiff <= 0)
      verdict = '<div class="verdict membrane-wins">&#x26A0;&#xFE0F; Membrane is ' + saveAmt + ' cheaper in ' + costLabel + ' and ' + Math.abs(schedDiff).toFixed(1) + ' day(s) faster. Verify inputs.</div>';
    else if (effectiveDiff > 0 && schedDiff < 0)
      verdict = '<div class="verdict penetron-wins">&#x2705; Penetron saves ' + saveAmt + ' in ' + costLabel + '. Membrane is faster by ' + Math.abs(schedDiff).toFixed(1) + ' day(s) — weigh the schedule premium against savings.</div>';
    else if (effectiveDiff < 0 && schedDiff > 0)
      verdict = '<div class="verdict membrane-wins">&#x26A0;&#xFE0F; Membrane is ' + saveAmt + ' cheaper in ' + costLabel + ' but adds ' + schedDiff.toFixed(1) + ' day(s) to the critical path.</div>';
    else
      verdict = '<div class="verdict tie">Systems are equivalent at current inputs.</div>';
  }

  var sfNote = totalSF === 0
    ? '<br><small style="color:var(--text-muted);font-size:.65rem">Enter dimensions in Step 1</small>' : '';

  // Complexity breakdown sub-line
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

  var pAdmixSub = pPenebarCost > 0
    ? '<div class="metric-sub">Admix: ' + fmt$(pAdmixCost) + ' + Penebar: ' + fmt$(pPenebarCost) + '</div>'
    : '<div class="metric-sub">admixture add-cost</div>';

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

  document.getElementById('results-body').innerHTML =
    '<div class="comparison-grid">'
    + '<div class="col-header">Metric</div>'
    + '<div class="col-header" style="color:var(--p-orange)">Penetron Admixture</div>'
    + '<div class="col-header" style="color:var(--p-navy)">Membrane System</div>'

    + '<div class="metric-cell"><div class="metric-label">Direct Cost</div></div>'
    + '<div class="metric-cell"><div class="metric-value penetron">' + (hasPenetron ? fmt$(pAdmixTotal) : '—') + '</div>' + pAdmixSub + '</div>'
    + '<div class="metric-cell"><div class="metric-value membrane">' + (hasMembrane ? fmt$(memTotalCost) : '—') + '</div>' + complexSub + '</div>'

    + '<div class="metric-cell"><div class="metric-label">Direct Savings</div></div>'
    + '<div class="metric-cell" style="grid-column:2/4">'
    + '<div class="metric-value diff ' + dc(directDiff) + '">'
    + ((hasPenetron && hasMembrane) ? ((directDiff >= 0 ? 'Penetron saves ' : 'Membrane saves ') + fmt$(Math.abs(directDiff))) : '—')
    + '</div></div>'

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
    + '</div>'

    + '<div class="schedule-comparison">'
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
    + '<div class="sched-title">Schedule Difference</div>'
    + '<div class="sched-days" style="font-size:1.4rem;color:' + schedNoteColor + '">' + ((hasPenetron || hasMembrane) ? dld(schedDiff) : '—') + '</div>'
    + '<div class="sched-unit">' + (schedDiff > 0 ? 'Penetron faster' : (schedDiff < 0 ? 'Membrane faster' : 'Equal')) + '</div>'
    + schedNoteText
    + '</div>'
    + '</div>'
    + verdict;
}

compute();
