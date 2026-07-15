/* ============================================================
   PENETRON CONVERSION TOOL — LIVE SYSTEM COMPARISON RENDERER
   Realistic (illustrative) construction cross-sections, one per
   scope type, drawn with real drawing conventions: earth
   hatching, water-table symbol, lateral + uplift hydrostatic
   arrows, mud slab, rebar, membrane + protection board on the
   positive side, pile boots, kicker joints — and paired zoom
   insets: the classic membrane failure mode vs. crystalline
   self-healing. Not to scale; for discussion only.
   ============================================================ */

(function () {

  /* ── generic helpers ─────────────────────────────────── */
  function cap(n, max) { return Math.min(Math.max(n, 0), max); }
  function spread(start, end, count) {
    if (count <= 0) return [];
    if (count === 1) return [(start + end) / 2];
    var out = [];
    for (var i = 0; i < count; i++) out.push(start + (end - start) * (i / (count - 1)));
    return out;
  }

  var C = {
    sky: '#f5f8fc',
    soilBg: '#e9deca', soilLine: '#cdbb96',
    waterWash: 'rgba(90,150,214,.16)', waterLine: '#4a90d9',
    conc: '#d3d7de', concDot: '#aeb6c2', edge: '#5b6c88',
    rebar: '#9fb0c6',
    mud: '#e4e7ec',
    membrane: '#16181d', board: '#6b7688',
    risk: '#e0392b', ok: '#1a8a50', penebar: '#f5901e',
    label: '#45526b', leader: '#8a97ad',
    interior: '#8fa0ba'
  };

  function defs(p) {
    return '<defs>'
      + '<pattern id="' + p + '-soil" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
      +   '<rect width="9" height="9" fill="' + C.soilBg + '"/><line x1="0" y1="0" x2="0" y2="9" stroke="' + C.soilLine + '" stroke-width="1.6"/>'
      + '</pattern>'
      + '<pattern id="' + p + '-conc" width="16" height="16" patternUnits="userSpaceOnUse">'
      +   '<rect width="16" height="16" fill="' + C.conc + '"/>'
      +   '<path d="M3 5l2-2 1.6 2z" fill="' + C.concDot + '"/><circle cx="11" cy="4" r="1" fill="' + C.concDot + '"/>'
      +   '<path d="M10 12l2-1.8 1.4 2z" fill="' + C.concDot + '"/><circle cx="5" cy="12.5" r="1" fill="' + C.concDot + '"/>'
      + '</pattern>'
      + '<pattern id="' + p + '-crys" width="16" height="16" patternUnits="userSpaceOnUse">'
      +   '<rect width="16" height="16" fill="' + C.conc + '"/>'
      +   '<path d="M3 5l2-2 1.6 2z" fill="' + C.concDot + '"/><circle cx="5" cy="12.5" r="1" fill="' + C.concDot + '"/>'
      +   '<path d="M11 3.4l1.2 2.1-2.4 0z" fill="#f5901e" opacity=".9"/>'
      +   '<path d="M10.6 12.6l1.4-2.4 1.4 2.4-1.4 1.4z" fill="#f2a94f" opacity=".8"/>'
      +   '<circle cx="3.5" cy="9" r=".9" fill="#1a4b8c" opacity=".5"/>'
      + '</pattern>'
      + '</defs>';
  }

  /* water table: dashed line + ▽ symbol */
  function waterTable(x1, x2, y, labelX) {
    var s = '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + C.waterLine + '" stroke-width="1.4" stroke-dasharray="7,4"/>';
    var tx = labelX == null ? (x1 + 14) : labelX;
    s += '<path d="M' + tx + ' ' + (y - 9) + ' l5 8 l-10 0 z" fill="none" stroke="' + C.waterLine + '" stroke-width="1.4"/>';
    return s;
  }

  /* animated hydrostatic flow arrow. dir: 'up' | 'right' | 'left' */
  function flowArrow(x, y, len, dir, color) {
    color = color || C.waterLine;
    var x2 = x, y2 = y, head = '';
    if (dir === 'up')    { y2 = y - len; head = 'M' + (x2 - 4) + ' ' + (y2 + 7) + ' L' + x2 + ' ' + y2 + ' L' + (x2 + 4) + ' ' + (y2 + 7); }
    if (dir === 'right') { x2 = x + len; head = 'M' + (x2 - 7) + ' ' + (y2 - 4) + ' L' + x2 + ' ' + y2 + ' L' + (x2 - 7) + ' ' + (y2 + 4); }
    if (dir === 'left')  { x2 = x - len; head = 'M' + (x2 + 7) + ' ' + (y2 - 4) + ' L' + x2 + ' ' + y2 + ' L' + (x2 + 7) + ' ' + (y2 + 4); }
    return '<g>'
      + '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="2" stroke-dasharray="5,4">'
      + '<animate attributeName="stroke-dashoffset" values="9;0" dur="1.1s" repeatCount="indefinite"/>'
      + '</line>'
      + '<path d="' + head + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
      + '</g>';
  }

  function riskDot(x, y, title) {
    return '<g><circle cx="' + x + '" cy="' + y + '" r="8" fill="' + C.risk + '" opacity=".18">'
      + '<animate attributeName="r" values="8;12;8" dur="1.9s" repeatCount="indefinite"/>'
      + '<animate attributeName="opacity" values=".2;.04;.2" dur="1.9s" repeatCount="indefinite"/></circle>'
      + '<circle cx="' + x + '" cy="' + y + '" r="4.6" fill="' + C.risk + '" stroke="#fff" stroke-width="1.2"/>'
      + (title ? '<title>' + title + '</title>' : '') + '</g>';
  }

  function checkDot(x, y, title) {
    return '<g><circle cx="' + x + '" cy="' + y + '" r="6.2" fill="' + C.ok + '" stroke="#fff" stroke-width="1.2"/>'
      + '<path d="M' + (x - 2.7) + ' ' + y + 'l1.9 2 3.5-4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      + (title ? '<title>' + title + '</title>' : '') + '</g>';
  }

  /* leader-line label */
  function callout(tx, ty, px, py, text, anchor, color) {
    anchor = anchor || 'start';
    color = color || C.label;
    return '<polyline points="' + px + ',' + py + ' ' + tx + ',' + ty + '" fill="none" stroke="' + C.leader + '" stroke-width="1"/>'
      + '<circle cx="' + px + '" cy="' + py + '" r="1.6" fill="' + C.leader + '"/>'
      + txt(anchor === 'end' ? tx - 3 : tx + 3, ty + 3, text, color, anchor);
  }

  function txt(x, y, t, color, anchor, size, weight) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" class="dcap" fill="' + (color || C.label) + '"'
      + ' paint-order="stroke" stroke="' + C.sky + '" stroke-width="3.2" stroke-linejoin="round"'
      + (size ? ' font-size="' + size + '"' : '') + (weight ? ' font-weight="' + weight + '"' : '') + '>' + t + '</text>';
  }

  function rebarV(x, y1, y2) { return '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>'; }
  function rebarH(x1, x2, y) { return '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>'; }

  /* ── zoom insets: paired failure/solution stories ────── */
  function insetFrame(cx, cy, r, px, py) {
    return '<line x1="' + px + '" y1="' + py + '" x2="' + cx + '" y2="' + (cy + r) + '" stroke="' + C.leader + '" stroke-width="1.2" stroke-dasharray="3,3"/>'
      + '<circle cx="' + px + '" cy="' + py + '" r="5" fill="none" stroke="' + C.leader + '" stroke-width="1.2"/>';
  }

  function insetMembraneLap(cx, cy, r, px, py) {
    var id = 'clipLap' + Math.round(cx);
    return insetFrame(cx, cy, r, px, py)
      + '<clipPath id="' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 2) + '"/></clipPath>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="' + C.risk + '" stroke-width="2"/>'
      + '<g clip-path="url(#' + id + ')">'
      +   '<rect x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + (2 * r) + '" height="' + r + '" fill="' + C.conc + '"/>'
      +   '<rect x="' + (cx - r) + '" y="' + (cy + 12) + '" width="' + (2 * r) + '" height="' + r + '" fill="' + C.soilBg + '"/>'
      +   '<path d="M' + (cx - r) + ' ' + (cy + 2) + ' H' + (cx + 6) + ' l10 -9" fill="none" stroke="' + C.membrane + '" stroke-width="4" stroke-linecap="round"/>'
      +   '<path d="M' + (cx - 2) + ' ' + (cy + 10) + ' H' + (cx + r) + '" fill="none" stroke="' + C.membrane + '" stroke-width="4" stroke-linecap="round"/>'
      +   '<path d="M' + (cx + 22) + ' ' + (cy - 16) + ' q-12 8 -20 22" fill="none" stroke="' + C.waterLine + '" stroke-width="2" stroke-dasharray="4,3">'
      +     '<animate attributeName="stroke-dashoffset" values="7;0" dur="1s" repeatCount="indefinite"/>'
      +   '</path>'
      + '</g>'
      + txt(Math.min(cx, 400), cy + r + 12, 'One bad lap = a leak path', C.risk, 'middle', 9.5, 700);
  }

  function insetCrystals(cx, cy, r, px, py) {
    var id = 'clipCry' + Math.round(cx);
    var crystals = '';
    [[-14, -6], [-5, 4], [4, -3], [12, 7], [-10, 14], [8, 18]].forEach(function (o) {
      var x = cx + o[0], y = cy + o[1];
      crystals += '<path d="M' + x + ' ' + (y - 4) + ' l2.6 2.6 -2.6 4 -2.6 -4 z" fill="#fff" stroke="' + C.penebar + '" stroke-width="1"/>';
    });
    return insetFrame(cx, cy, r, px, py)
      + '<clipPath id="' + id + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 2) + '"/></clipPath>'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff" stroke="' + C.ok + '" stroke-width="2"/>'
      + '<g clip-path="url(#' + id + ')">'
      +   '<rect x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + (2 * r) + '" height="' + (2 * r) + '" fill="' + C.conc + '"/>'
      +   '<path d="M' + (cx - 3) + ' ' + (cy - r) + ' l4 12 -6 10 5 12 -3 12" fill="none" stroke="#8a97ad" stroke-width="2"/>'
      +   crystals
      + '</g>'
      + txt(Math.min(cx, 388), cy + r + 12, 'Crystals self-heal cracks \u2264 0.5 mm', C.ok, 'middle', 9.5, 700);
  }

  /* ════════════════════════════════════════════════════════
     SCENE 1 — HYDROSTATIC MAT SLAB  (cut at building edge)
     Exterior soil left · foundation wall · mat extending right
  ════════════════════════════════════════════════════════ */
  function sceneSlab(mode, d) {
    var mem = mode === 'mem';
    var fill = mem ? 'url(#s-conc)' : 'url(#s-crys)';
    var s = defs('s');
    var GRADE = 42, WT = 92;
    var WALL_L = 118, WALL_R = 158;          // wall x-range
    var MAT_T = 252, MAT_B = 312;            // mat y-range
    var MUD_B = 324;

    s += '<rect x="0" y="0" width="480" height="360" fill="' + C.sky + '"/>';
    // exterior soil (left of wall) + soil below mud slab
    s += '<rect x="0" y="' + GRADE + '" width="' + WALL_L + '" height="' + (360 - GRADE) + '" fill="url(#s-soil)"/>';
    s += '<rect x="' + WALL_L + '" y="' + MUD_B + '" width="' + (480 - WALL_L) + '" height="' + (360 - MUD_B) + '" fill="url(#s-soil)"/>';
    // groundwater wash
    s += '<rect x="0" y="' + WT + '" width="' + WALL_L + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
    s += '<rect x="' + WALL_L + '" y="' + MUD_B + '" width="' + (480 - WALL_L) + '" height="' + (360 - MUD_B) + '" fill="' + C.waterWash + '"/>';
    s += '<line x1="0" y1="' + GRADE + '" x2="' + WALL_L + '" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>';
    s += waterTable(6, WALL_L - 4, WT, 16);
    s += txt(60, WT - 14, 'Water table', C.waterLine, 'middle', 9.5);

    // mud slab (working slab)
    s += '<rect x="' + (WALL_L - 10) + '" y="' + MAT_B + '" width="' + (480 - WALL_L + 10) + '" height="12" fill="' + C.mud + '" stroke="#b9c0cc" stroke-width="1"/>';

    // mat slab (pour 1), wall above (pour 2) — animate in placement order
    s += '<g class="pour-1">';
    s += '<rect x="' + WALL_L + '" y="' + MAT_T + '" width="' + (480 - WALL_L) + '" height="' + (MAT_B - MAT_T) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>';
    s += rebarH(WALL_L + 12, 468, MAT_T + 14) + rebarH(WALL_L + 12, 468, MAT_B - 14);
    s += '</g>';
    s += '<g class="pour-2">';
    s += '<rect x="' + WALL_L + '" y="' + GRADE + '" width="' + (WALL_R - WALL_L) + '" height="' + (MAT_T - GRADE) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>';
    s += rebarV(WALL_L + 12, GRADE + 10, MAT_T + 40) + rebarV(WALL_R - 12, GRADE + 10, MAT_T + 40);
    s += '</g>';

    // interior label + floor line
    s += txt(258, 178, 'BASEMENT / PARKING LEVEL', C.interior, 'middle', 11, 700);
    s += '<line x1="' + WALL_R + '" y1="' + MAT_T + '" x2="480" y2="' + MAT_T + '" stroke="#8fa0ba" stroke-width="1" opacity=".5"/>';

    // hydrostatic pressure — lateral on wall, uplift under mat
    [150, 195, 235].forEach(function (y) { s += flowArrow(72, y, 34, 'right', mem ? C.risk : C.waterLine); });
    [200, 270, 340, 410].forEach(function (x) { s += flowArrow(x, 352, 22, 'up', mem ? C.risk : C.waterLine); });
    s += txt(72, 136, 'Lateral pressure', mem ? C.risk : C.waterLine, 'middle', 9);
    s += txt(300, 357, 'Hydrostatic uplift \u2014 24/7', mem ? C.risk : C.waterLine, 'middle', 9);

    // kicker joint (wall-to-mat CJ) — real location
    s += '<line x1="' + WALL_L + '" y1="' + MAT_T + '" x2="' + WALL_R + '" y2="' + MAT_T + '" stroke="' + (mem ? C.risk : C.penebar) + '" stroke-width="2" stroke-dasharray="5,3"/>';

    var cjCount = cap(Math.ceil(d.cjLF / 50) || (d.cjLF > 0 ? 1 : 0), 3);
    var penCount = cap(d.penCount, 4);
    var pipeXs = spread(215, 430, penCount);

    // pipes through the mat
    pipeXs.forEach(function (x) {
      s += '<rect x="' + (x - 5) + '" y="' + (MAT_T - 16) + '" width="10" height="' + (MAT_B - MAT_T + 28) + '" fill="#98a3b5" stroke="#6b7688" stroke-width="1" rx="2"/>';
    });

    // field detailing arrives last (pour 3 of the animation)
    s += '<g class="pour-3">';
    if (mem) {
      // under-slab membrane on mud slab + wall membrane + protection board
      s += '<line x1="' + (WALL_L - 10) + '" y1="' + (MAT_B + 1.5) + '" x2="480" y2="' + (MAT_B + 1.5) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
      s += '<path d="M' + (WALL_L - 4) + ' ' + GRADE + ' V' + (MAT_B + 1) + '" fill="none" stroke="' + C.membrane + '" stroke-width="3.5"/>';
      s += '<path d="M' + (WALL_L - 9) + ' ' + (GRADE + 2) + ' V' + (MAT_T + 30) + '" fill="none" stroke="' + C.board + '" stroke-width="2" stroke-dasharray="6,4"/>';

      s += callout(8, 98, WALL_L - 5, 112, 'Sheet membrane', 'start');
      s += callout(470, 228, 458, MAT_B, 'Under-slab membrane on mud slab', 'end');

      // risk points: wall-to-underslab transition corner, kicker CJ, mat CJs, penetration collars
      s += riskDot(WALL_L - 4, MAT_B, 'Wall-to-underslab membrane transition \u2014 classic failure corner');
      s += riskDot((WALL_L + WALL_R) / 2, MAT_T, 'Kicker construction joint \u2014 field waterstop + membrane tie-in');
      spread(250, 400, Math.max(cjCount - 1, 0)).forEach(function (x) {
        s += '<line x1="' + x + '" y1="' + MAT_T + '" x2="' + x + '" y2="' + MAT_B + '" stroke="' + C.risk + '" stroke-width="1.6" stroke-dasharray="4,3"/>';
        s += riskDot(x, MAT_B + 2, 'Mat pour joint \u2014 waterstop + membrane continuity required');
      });
      pipeXs.forEach(function (x) { s += riskDot(x, MAT_B + 2, 'Penetration through membrane \u2014 field-sealed collar'); });

      s += insetMembraneLap(398, 92, 42, 330, MAT_B + 2);

    } else {
      // Penebar at the kicker joint
      if (d.cjLF > 0) {
        s += '<rect x="' + (WALL_L + 6) + '" y="' + (MAT_T - 4) + '" width="' + (WALL_R - WALL_L - 12) + '" height="7" rx="3" fill="' + C.penebar + '"/>';
        s += callout(10, 205, WALL_L + 10, MAT_T - 2, 'Penebar\u00AE at CJ', 'start', '#a05c0a');
      }
      pipeXs.forEach(function (x) { s += checkDot(x, MAT_B + 2, 'Penetration \u2014 crystals seal the interface, no collar'); });
      s += insetCrystals(398, 92, 42, 330, MAT_T + 30);
      s += txt(258, 204, 'Treated concrete \u2014 the structure is the barrier', C.ok, 'middle', 9.5, 700);
    }
    s += '</g>';
    return s;
  }

  /* ════════════════════════════════════════════════════════
     SCENES 2 & 3 — ELEVATOR PIT sections (shared geometry)
     Staged (standard): thick pit slab at the bottom, shear
     walls on either side, cold joints where the walls land.
     Monolithic: the pit drops out of the mat — earth-formed
     sloped haunches down to a spread footing pad, one
     placement. Pile-cap mode adds piles under the slab/pad.
  ════════════════════════════════════════════════════════ */
  function sceneStagedPit(mode, d, extra, opts) {
    var mem = mode === 'mem';
    var fill = mem ? 'url(#p-conc)' : 'url(#p-crys)';
    var s = defs('p');
    var GRADE = 40, WT = 74;
    var CAP_L = 108, CAP_R = 372, CAP_T = 208, CAP_B = 268;
    var WL_L = 158, WL_R = 178, WR_L = 302, WR_R = 322; // pit wall x-ranges
    var MUD_B = 280;
    var hasPiles = !!opts.piles;
    var sump = !hasPiles && !!(extra && extra.sump);

    s += '<rect x="0" y="0" width="480" height="360" fill="' + C.sky + '"/>';
    // soil each side + below
    s += '<rect x="0" y="' + GRADE + '" width="' + WL_L + '" height="' + (360 - GRADE) + '" fill="url(#p-soil)"/>';
    s += '<rect x="' + WR_R + '" y="' + GRADE + '" width="' + (480 - WR_R) + '" height="' + (360 - GRADE) + '" fill="url(#p-soil)"/>';
    s += '<rect x="' + WL_L + '" y="' + MUD_B + '" width="' + (WR_R - WL_L) + '" height="' + (360 - MUD_B) + '" fill="url(#p-soil)"/>';
    // groundwater
    s += '<rect x="0" y="' + WT + '" width="' + WL_L + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
    s += '<rect x="' + WR_R + '" y="' + WT + '" width="' + (480 - WR_R) + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
    s += '<rect x="' + WL_L + '" y="' + MUD_B + '" width="' + (WR_R - WL_L) + '" height="' + (360 - MUD_B) + '" fill="' + C.waterWash + '"/>';
    s += '<line x1="0" y1="' + GRADE + '" x2="' + WL_L + '" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>';
    s += '<line x1="' + WR_R + '" y1="' + GRADE + '" x2="480" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>';
    s += waterTable(6, WL_L - 6, WT, 16);
    s += txt(8, 56, 'Water table —', C.waterLine, 'start', 9);
    s += txt(8, 67, 'just below grade', C.waterLine, 'start', 9);

    // mud slab under the pit slab
    s += '<rect x="' + (CAP_L - 8) + '" y="' + CAP_B + '" width="' + (CAP_R - CAP_L + 16) + '" height="12" fill="' + C.mud + '" stroke="#b9c0cc" stroke-width="1"/>';

    // piles (pile-cap mode only)
    var pileXs = [];
    if (hasPiles) {
      var pileCount = cap(d.piles, 5);
      var nPiles = Math.max(3, pileCount || 3);
      pileXs = spread(150, 330, nPiles);
      pileXs.forEach(function (x) {
        s += '<rect x="' + (x - 9) + '" y="' + (CAP_B + 12) + '" width="18" height="' + (360 - CAP_B - 12) + '" fill="#b3bcca" stroke="#7d8a9e" stroke-width="1.2"/>';
        s += rebarV(x, CAP_B + 20, 352);
      });
    }

    // staged placements: slab first (pour 1), walls after (pour 2) —
    // the .pour-* groups animate in that order when the scene changes
    s += '<g class="pour-1">';
    s += '<rect x="' + CAP_L + '" y="' + CAP_T + '" width="' + (CAP_R - CAP_L) + '" height="' + (CAP_B - CAP_T) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>';
    // slab steel: top + bottom mats with stirrup ties between
    s += rebarH(CAP_L + 12, CAP_R - 12, CAP_T + 14) + rebarH(CAP_L + 12, CAP_R - 12, CAP_B - 12);
    spread(132, 348, 7).forEach(function (x) { s += rebarV(x, CAP_T + 14, CAP_B - 12); });
    if (sump) {
      s += '<rect x="216" y="' + CAP_B + '" width="48" height="22" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>';
      s += txt(206, CAP_B + 32, 'Sump', C.interior, 'end', 8.5);
    }
    s += '</g>';
    s += '<g class="pour-2">';
    s += '<rect x="' + WL_L + '" y="' + GRADE + '" width="' + (WL_R - WL_L) + '" height="' + (CAP_T - GRADE) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>';
    s += '<rect x="' + WR_L + '" y="' + GRADE + '" width="' + (WR_R - WR_L) + '" height="' + (CAP_T - GRADE) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>';
    // wall steel: verticals both faces, hooked into the slab, with ties
    s += rebarV(WL_L + 6, GRADE + 8, CAP_T + 20) + rebarV(WL_R - 6, GRADE + 8, CAP_T + 20);
    s += rebarV(WR_L + 6, GRADE + 8, CAP_T + 20) + rebarV(WR_R - 6, GRADE + 8, CAP_T + 20);
    [88, 132, 176].forEach(function (y) {
      s += rebarH(WL_L + 4, WL_R - 4, y) + rebarH(WR_L + 4, WR_R - 4, y);
    });
    s += '</g>';

    s += txt(240, 140, 'ELEVATOR PIT', C.interior, 'middle', 11, 700);
    s += txt(240, opts.subY || 200, opts.sub, C.interior, 'middle', 8.5);

    // pressure arrows: lateral both sides + uplift under the slab
    [110, 160].forEach(function (y) {
      s += flowArrow(118, y, 30, 'right', mem ? C.risk : C.waterLine);
      s += flowArrow(362, y, 30, 'left', mem ? C.risk : C.waterLine);
    });
    [218, 262].forEach(function (x) { s += flowArrow(x, 350, 20, 'up', mem ? C.risk : C.waterLine); });
    if (sump) s += flowArrow(240, 356, 12, 'up', mem ? C.risk : C.waterLine);

    // wall penetrations (standalone pit: sump discharge / conduits)
    var penCount = hasPiles ? 0 : cap(d.penCount, 3);
    var penYs = spread(96, 168, penCount);
    penYs.forEach(function (y) {
      s += '<rect x="' + (WL_L - 24) + '" y="' + (y - 4) + '" width="' + (WL_R - WL_L + 28) + '" height="8" fill="#98a3b5" stroke="#6b7688" stroke-width="1" rx="2"/>';
    });

    var pileHeadY = CAP_B + 6;
    var membY = CAP_B + 2;

    // field detailing arrives last (pour 3 of the animation)
    s += '<g class="pour-3">';
    if (mem) {
      // under-slab membrane on mud slab (interrupted at every pile)
      if (hasPiles) {
        var segs = [CAP_L - 8].concat(pileXs.reduce(function (acc, x) { return acc.concat([x - 12, x + 12]); }, [])).concat([CAP_R + 8]);
        for (var i = 0; i < segs.length; i += 2) {
          s += '<line x1="' + segs[i] + '" y1="' + membY + '" x2="' + segs[i + 1] + '" y2="' + membY + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
        }
      } else if (sump) {
        s += '<path d="M' + (CAP_L - 8) + ' ' + membY + ' H212 V' + (CAP_B + 24) + ' H268 V' + membY + ' H' + (CAP_R + 8) + '" fill="none" stroke="' + C.membrane + '" stroke-width="3.5" stroke-linejoin="round"/>';
      } else {
        s += '<line x1="' + (CAP_L - 8) + '" y1="' + membY + '" x2="' + (CAP_R + 8) + '" y2="' + membY + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
      }
      // wall membrane on pit wall exteriors
      s += '<path d="M' + (WL_L - 4) + ' ' + (GRADE + 2) + ' V' + CAP_T + '" stroke="' + C.membrane + '" stroke-width="3.5" fill="none"/>';
      s += '<path d="M' + (WR_R + 4) + ' ' + (GRADE + 2) + ' V' + CAP_T + '" stroke="' + C.membrane + '" stroke-width="3.5" fill="none"/>';
      // the base mat is fully wrapped — sides + shoulders lap into the underslab sheet
      s += '<line x1="' + (CAP_L - 2) + '" y1="' + (CAP_T - 2) + '" x2="' + (CAP_L - 2) + '" y2="' + (CAP_B + 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
      s += '<line x1="' + (CAP_R + 2) + '" y1="' + (CAP_T - 2) + '" x2="' + (CAP_R + 2) + '" y2="' + (CAP_B + 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
      s += '<line x1="' + (CAP_L - 2) + '" y1="' + (CAP_T - 2) + '" x2="' + (WL_L - 3) + '" y2="' + (CAP_T - 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
      s += '<line x1="' + (WR_R + 3) + '" y1="' + (CAP_T - 2) + '" x2="' + (CAP_R + 2) + '" y2="' + (CAP_T - 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';

      // cold joint where the walls land on the slab
      s += '<line x1="' + WL_L + '" y1="' + CAP_T + '" x2="' + WL_R + '" y2="' + CAP_T + '" stroke="' + C.risk + '" stroke-width="2.5" stroke-dasharray="5,3"/>';
      s += '<line x1="' + WR_L + '" y1="' + CAP_T + '" x2="' + WR_R + '" y2="' + CAP_T + '" stroke="' + C.risk + '" stroke-width="2.5" stroke-dasharray="5,3"/>';
      s += riskDot(WL_R - 2, CAP_T, 'Wall-to-slab cold joint — staged pour, field waterstop');
      s += riskDot(WR_L + 2, CAP_T, 'Wall-to-slab cold joint — staged pour, field waterstop');
      s += callout(240, 232, WL_R + 4, CAP_T + 2, 'Cold joints — staged pour', 'middle', C.risk);
      // PVC waterstops cast into the construction joints
      s += '<rect x="' + (WL_L + 3) + '" y="' + (CAP_T - 3) + '" width="14" height="6" rx="2" fill="#3a4354"><title>PVC waterstop cast into the cold joint</title></rect>';
      s += '<rect x="' + (WR_L + 3) + '" y="' + (CAP_T - 3) + '" width="14" height="6" rx="2" fill="#3a4354"><title>PVC waterstop cast into the cold joint</title></rect>';

      if (hasPiles) {
        // pile boots — every pile pierces the membrane
        pileXs.forEach(function (x) {
          s += '<path d="M' + (x - 13) + ' ' + membY + ' l5 -8 h16 l5 8" fill="none" stroke="' + C.risk + '" stroke-width="2"/>';
          s += riskDot(x, pileHeadY - 12, 'Pile boot / flashing — field-sealed around every pile head');
        });
        s += callout(468, 318, pileXs[pileXs.length - 1] + 6, membY + 4, 'Boot at EVERY pile', 'end', C.risk);
      } else {
        s += riskDot(CAP_L - 8, membY, 'Membrane corner fold — 3-plane transition');
        s += riskDot(CAP_R + 8, membY, 'Membrane corner fold — 3-plane transition');
        if (sump) {
          s += riskDot(214, CAP_B + 8, 'Sump corner — 4 extra membrane folds');
          s += riskDot(266, CAP_B + 8, 'Sump corner — 4 extra membrane folds');
        }
      }
      penYs.forEach(function (y) { s += riskDot(WL_L - 6, y, 'Penetration through wall membrane — field-sealed collar'); });
      s += callout(10, 300, CAP_L + 4, membY + 2, 'Membrane on mud slab', 'start');

      s += insetMembraneLap(408, 96, 40, WR_R + 6, CAP_T);

    } else {
      // Penebar waterstop at every construction joint
      s += '<rect x="' + (WL_L + 2) + '" y="' + (CAP_T - 4) + '" width="16" height="7" rx="3" fill="' + C.penebar + '"/>';
      s += '<rect x="' + (WR_L + 2) + '" y="' + (CAP_T - 4) + '" width="16" height="7" rx="3" fill="' + C.penebar + '"/>';
      s += callout(240, 232, WL_R + 2, CAP_T, 'Penebar® at the construction joints', 'middle', '#a05c0a');
      if (hasPiles) {
        // piles cast directly into treated slab
        pileXs.forEach(function (x) { s += checkDot(x, pileHeadY - 10, 'Pile head cast into treated concrete — crystals seal the interface, no boot'); });
        s += callout(468, 318, pileXs[pileXs.length - 1] + 4, pileHeadY - 8, '0 pile boots', 'end', C.ok);
      } else {
        penYs.forEach(function (y) { s += checkDot(WL_L - 6, y, 'Penetration — crystals seal the interface'); });
        if (sump) s += checkDot(240, CAP_B + 14, 'Sump cast integrally — no membrane folds');
      }
      s += insetCrystals(408, 96, 40, WR_R + 2, CAP_T + 20);
      s += txt(240, 254, (hasPiles ? 'Cap' : 'Slab') + ' + walls become one waterproof mass', C.ok, 'middle', 9.5, 700);
    }
    s += '</g>';
    return s;
  }

  /* Monolithic spread footing — pit dropped out of the mat.
     Renders the Penetron side only (the membrane panel always
     stays on the staged standard construction). */
  function sceneMonoPit(mode, d, extra, opts) {
    var mem = mode === 'mem';
    var fill = mem ? 'url(#e-conc)' : 'url(#e-crys)';
    var s = defs('e');
    var SOG_T = 108, SOG_B = 130;             // ground-floor mat slab
    var WL_L = 138, WL_R = 158, WR_L = 322, WR_R = 342;
    var SLAB_T = 262, SLAB_B = 322;
    var WT = 170;
    var hasPiles = !!opts.piles;
    var sump = !hasPiles && !!(extra && extra.sump);
    var TOE = 46;  // footing pad projection past the wall face
    var RUN = 64;  // horizontal run of the earth-formed slope, pad edge up to mat underside
    var padL = WL_L - TOE, padR = WR_R + TOE;

    s += '<rect x="0" y="0" width="480" height="360" fill="' + C.sky + '"/>';
    // soil: below the mat on both sides, below the pad
    s += '<rect x="0" y="' + SOG_B + '" width="' + WL_L + '" height="' + (360 - SOG_B) + '" fill="url(#e-soil)"/>';
    s += '<rect x="' + WR_R + '" y="' + SOG_B + '" width="' + (480 - WR_R) + '" height="' + (360 - SOG_B) + '" fill="url(#e-soil)"/>';
    s += '<rect x="' + WL_L + '" y="' + (SLAB_B + 10) + '" width="' + (WR_R - WL_L) + '" height="' + (360 - SLAB_B - 10) + '" fill="url(#e-soil)"/>';
    // groundwater below WT
    s += '<rect x="0" y="' + WT + '" width="' + WL_L + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
    s += '<rect x="' + WR_R + '" y="' + WT + '" width="' + (480 - WR_R) + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
    s += '<rect x="' + WL_L + '" y="' + (SLAB_B + 10) + '" width="' + (WR_R - WL_L) + '" height="' + (360 - SLAB_B - 10) + '" fill="' + C.waterWash + '"/>';

    // ground-floor mat each side (merged into the pour by the mono path)
    s += '<rect x="0" y="' + SOG_T + '" width="' + (WL_R) + '" height="' + (SOG_B - SOG_T) + '" fill="url(#e-conc)" stroke="' + C.edge + '" stroke-width="1.2"/>';
    s += '<rect x="' + WR_L + '" y="' + SOG_T + '" width="' + (480 - WR_L) + '" height="' + (SOG_B - SOG_T) + '" fill="url(#e-conc)" stroke="' + C.edge + '" stroke-width="1.2"/>';
    s += txt(60, SOG_T - 8, 'Ground-floor slab', C.interior, 'middle', 9);

    s += waterTable(6, WL_L - 6, WT, 16);

    // piles under the pad (pile-cap mode)
    var pileXs = [];
    if (hasPiles) {
      var nP = Math.max(3, cap(d.piles, 5) || 3);
      pileXs = spread(150, 330, nP);
      pileXs.forEach(function (x) {
        s += '<rect x="' + (x - 9) + '" y="' + (SLAB_B + 10) + '" width="18" height="' + (360 - SLAB_B - 10) + '" fill="#b3bcca" stroke="#7d8a9e" stroke-width="1.2"/>';
        s += rebarV(x, SLAB_B + 18, 356);
      });
    }

    // mud slab spans the full pad
    s += '<rect x="' + (padL - 8) + '" y="' + SLAB_B + '" width="' + (padR - padL + 16) + '" height="10" fill="' + C.mud + '" stroke="#b9c0cc" stroke-width="1"/>';

    // ONE continuous placement: the mat underside breaks and slopes down
    // (earth-formed, no vertical formwork) to a footing pad wider than the
    // pit — mat, sloped haunches, pad, and pit walls all one pour.
    // The whole mass animates in as a single pour (.pour-mono).
    s += '<g class="pour-1 pour-mono">';
    var pMono = 'M0 ' + SOG_T
          + ' H' + WL_R
          + ' V' + SLAB_T
          + ' H' + WR_L
          + ' V' + SOG_T
          + ' H480'
          + ' V' + SOG_B
          + ' H' + (padR + RUN)
          + ' L' + padR + ' ' + SLAB_B;
    if (sump) pMono += ' H264 V' + (SLAB_B + 22) + ' H216 V' + SLAB_B;
    pMono += ' H' + padL
       + ' L' + (padL - RUN) + ' ' + SOG_B
       + ' H0'
       + ' Z';
    s += '<path d="' + pMono + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5" stroke-linejoin="round"/>';
    // one cage, one pour — wall steel bends into the pad, slope bars follow the haunches
    s += '<path d="M' + (WL_L + 10) + ' ' + (SOG_B + 8) + ' V' + (SLAB_T + 13) + ' H232" fill="none" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>';
    s += '<path d="M' + (WR_R - 10) + ' ' + (SOG_B + 8) + ' V' + (SLAB_T + 13) + ' H248" fill="none" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>';
    s += '<line x1="' + (padL - RUN + 16) + '" y1="' + (SOG_B + 14) + '" x2="' + (padL + 12) + '" y2="' + (SLAB_B - 8) + '" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>';
    s += '<line x1="' + (padR + RUN - 16) + '" y1="' + (SOG_B + 14) + '" x2="' + (padR - 12) + '" y2="' + (SLAB_B - 8) + '" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>';
    s += '</g>';
    // the haunch buries the water-table label — paint it on top of the concrete
    s += txt(4, WT - 22, 'Water table', C.waterLine, 'start', 8.6);
    s += txt(4, WT - 11, 'ABOVE pit floor', C.waterLine, 'start', 8.6);
    if (sump) s += txt(206, SLAB_B + 32, 'Sump', C.interior, 'end', 8.5);

    s += txt(240, 190, 'ELEVATOR PIT', C.interior, 'middle', 11, 700);
    s += txt(240, 206, opts.sub, C.interior, 'middle', 8.5);

    // pressure: the haunches slope outward, so lateral arrows start at the edges
    [200, 240].forEach(function (y) {
      s += flowArrow(8, y, 26, 'right', mem ? C.risk : C.waterLine);
      s += flowArrow(472, y, 26, 'left', mem ? C.risk : C.waterLine);
    });
    var upXs = hasPiles ? [222, 258] : [222, 330];
    upXs.forEach(function (x) { s += flowArrow(x, 354, 14, 'up', mem ? C.risk : C.waterLine); });
    if (sump) s += flowArrow(240, 358, 10, 'up', mem ? C.risk : C.waterLine);

    // wall penetrations (standalone pit: sump discharge / conduits)
    var penCount = hasPiles ? 0 : cap(d.penCount, 3);
    var penYs = spread(150, 195, penCount);
    penYs.forEach(function (y) {
      s += '<rect x="' + (WL_L - 24) + '" y="' + (y - 4) + '" width="' + (WL_R - WL_L + 28) + '" height="8" fill="#98a3b5" stroke="#6b7688" stroke-width="1" rx="2"/>';
    });

    if (!mem) {
      s += '<g class="pour-3">';
      s += callout(8, 348, padL + 10, SLAB_B - 12, hasPiles
        ? 'Monolithic pour — pit + cap on piles, one placement'
        : 'Monolithic spread footing — mat + pit in one pour', 'start', C.ok);
      s += callout(474, 292, padR + 24, SLAB_B - 44, 'Earth-formed slope — no forms, no joints', 'end', C.ok);
      s += txt(240, 252, 'One monolithic pour — no joints, no seams', C.ok, 'middle', 9.5, 700);
      penYs.forEach(function (y) { s += checkDot(WL_L - 6, y, 'Penetration — crystals seal the interface'); });
      if (sump) s += checkDot(240, SLAB_B + 16, 'Sump cast integrally — no membrane folds');
      s += checkDot(WL_L - 10, SLAB_T - 8, 'No cold joint — wall cast with the slab');
      s += checkDot(WR_R + 10, SLAB_T - 8, 'No cold joint — wall cast with the slab');
      if (hasPiles) {
        pileXs.forEach(function (x) { s += checkDot(x, SLAB_B + 16, 'Pile head cast into the treated pad — no boot'); });
        s += callout(470, 336, pileXs[pileXs.length - 1] + 4, SLAB_B + 16, '0 pile boots', 'end', C.ok);
      }
      s += insetCrystals(414, 74, 38, WR_R + 6, SOG_B + 40);
      s += '</g>';
    }
    return s;
  }

  function scenePilecap(mode, d, extra) {
    if (extra && extra.monoPour) return sceneMonoPit(mode, d, extra, { piles: true, sub: 'pit + cap on piles — one placement' });
    return sceneStagedPit(mode, d, extra, { piles: true, sub: 'pit slab on cap' });
  }

  function sceneElevator(mode, d, extra) {
    if (extra && extra.monoPour) return sceneMonoPit(mode, d, extra, { piles: false, sub: 'deepest point of the structure' });
    return sceneStagedPit(mode, d, extra, { piles: false, sub: 'deepest point of the structure', subY: 157 });
  }


  /* ════════════════════════════════════════════════════════
     CONSTRUCTION SEQUENCE PLAYER
     Button-driven, day-by-day build animation. Both panels run
     on one shared clock, so the schedule gap is visible: the
     membrane system crawls through every field step while the
     Penetron side (staged or monolithic) finishes early and
     holds a "WATERTIGHT" banner. Steps and day counts are
     illustrative, for discussion only.

     Smoothness: a frame is only rebuilt when its STEP changes.
     Between steps only the day counter text and the progress
     bar mutate in place, and each step's new work fades in
     (.seq-in) while excavated soil fades out (.seq-out).
  ════════════════════════════════════════════════════════ */
  function S(label, days, flag) { return { label: label, days: days, flag: flag }; }

  function stepsMembrane(hasPiles) {
    var a = [
      S('Undisturbed ground — water table just below grade', 1, 'start'),
      S('Excavate — 2× the pit footprint', 2, 'dug'),
      S('Well points + sheet piling — dewater the cut', 3, 'dewater')
    ];
    if (hasPiles) a.push(
      S('Drive piles', 4, 'piles'),
      S('Trim pile heads — tie-in dowels', 1, 'pileTrim'));
    a.push(S('Install base membrane where the mat will sit', 3, 'baseMemb'));
    if (hasPiles) a.push(S('Field-seal a boot at EVERY pile', 1, 'boots'));
    a.push(
      S('Set base mat edge forms', 1, 'matForms'),
      S('Set base mat rebar', 2, 'matRebar'),
      S('Pour base mat — wall dowels tied in', 2, 'matPour'),
      S('Chip out the keyway', 2, 'keyway'),
      S('Install PVC waterstop in the keyway', 1, 'wstop1'),
      S('Set full wall steel', 2, 'wallSteel'),
      S('Set vertical wall forms', 1, 'wallForms'),
      S('Pour walls — strip forms', 2, 'wallPour'),
      S('Wrap the base mat — membrane on all faces', 1, 'matMemb'),
      S('Membrane on the walls — tie into the base', 3, 'wallMemb'),
      S('Backfill the excavation', 1, 'backfill'),
      S('Membrane under the slab on grade', 1, 'slabMemb'),
      S('Waterstop at the slab joint', 1, 'wstop2'),
      S('Set slab forms', 1, 'slabForms'),
      S('Set slab steel', 1, 'slabSteel'),
      S('Pour the slab', 1, 'slabPour'));
    return a;
  }

  function stepsPenetron(hasPiles) {
    var a = [
      S('Undisturbed ground — water table just below grade', 1, 'start'),
      S('Excavate — 2× the pit footprint', 2, 'dug'),
      S('Well points + sheet piling — dewater the cut', 3, 'dewater')
    ];
    if (hasPiles) a.push(
      S('Drive piles', 4, 'piles'),
      S('Trim pile heads — cast into treated mat, no boots', 1, 'pileTrim'));
    a.push(
      S('Set base mat edge forms — no membrane needed', 1, 'matForms'),
      S('Set base mat rebar', 2, 'matRebar'),
      S('Pour treated base mat — wall dowels tied in', 2, 'matPour'),
      S('Penebar® waterstop — peel &amp; stick, no chipping', 1, 'wstop1'),
      S('Set full wall steel', 2, 'wallSteel'),
      S('Set vertical wall forms', 1, 'wallForms'),
      S('Pour treated walls — strip forms', 2, 'wallPour'),
      S('Backfill — no membrane to protect', 1, 'backfill'),
      S('Penebar® at the slab joint', 1, 'wstop2'),
      S('Set slab forms', 1, 'slabForms'),
      S('Set slab steel', 1, 'slabSteel'),
      S('Pour the slab', 1, 'slabPour'),
      S('Penetron activates — water triggers crystal growth', 2, 'activate'));
    return a;
  }

  function stepsMonolithic(hasPiles) {
    var a = [
      S('Undisturbed ground — water table just below grade', 1, 'start'),
      S('Dig out — earth-formed slopes, no sheet piling', 2, 'dug')
    ];
    if (hasPiles) a.push(
      S('Drive piles', 4, 'piles'),
      S('Trim pile heads — cast into the pour, no boots', 1, 'pileTrim'));
    a.push(
      S('Set bottom + wall forms', 1, 'forms'),
      S('Install steel — one cage', 2, 'cage'),
      S('Set the elevator pit form', 1, 'pitForm'),
      S('Pour monolithic — one placement', 1, 'pour'),
      S('Backfill', 1, 'backfill'),
      S('Penetron activates — water triggers crystal growth', 2, 'activate'));
    return a;
  }

  function totalDays(steps) {
    var t = 0;
    for (var i = 0; i < steps.length; i++) t += steps[i].days;
    return t;
  }

  /* flags of every started step at `day`, plus the current step */
  function seqFlagsAt(steps, day) {
    var f = {}, cum = 0, label = steps[0].label, idx = 0, flag = steps[0].flag;
    for (var i = 0; i < steps.length; i++) {
      if (day >= cum) { f[steps[i].flag] = true; label = steps[i].label; idx = i; flag = steps[i].flag; }
      cum += steps[i].days;
    }
    return { f: f, label: label, idx: idx, flag: flag };
  }

  function formBoard(x, y1, y2) {
    return '<rect x="' + x + '" y="' + y1 + '" width="6" height="' + (y2 - y1) + '" fill="#d9b57c" stroke="#9c7a45" stroke-width="1"/>';
  }

  /* Penetron activation — water migrates into the concrete, crystals grow,
     and the damp concrete dries out as the matrix seals. */
  function activationFx(washShapes, crystalPts, arrowDefs) {
    var a = '';
    // damp concrete drying out
    a += '<g>' + washShapes + '<animate attributeName="opacity" values="1;0" dur="4s" fill="freeze"/></g>';
    // water migrating in, fading away as the crystals seal it
    var ar = '';
    arrowDefs.forEach(function (d) { ar += flowArrow(d[0], d[1], d[2], d[3], C.waterLine); });
    a += '<g>' + ar + '<animate attributeName="opacity" values=".9;.9;0" dur="5s" fill="freeze"/></g>';
    // crystals growing, staggered
    crystalPts.forEach(function (p, i) {
      a += '<path d="M' + p[0] + ' ' + (p[1] - 4) + ' l3 3.2 -3 4.8 -3 -4.8 z" fill="#f5901e" stroke="#fff" stroke-width=".6" opacity="0">'
        + '<animate attributeName="opacity" values="0;1" dur=".8s" begin="' + (0.3 + i * 0.35).toFixed(2) + 's" fill="freeze"/></path>';
    });
    // callout bubble
    a += '<g class="seq-in">'
      + '<path d="M292 92 L280 116 L316 92 Z" fill="#fff" stroke="' + C.penebar + '" stroke-width="1.5"/>'
      + '<rect x="248" y="54" width="224" height="40" rx="9" fill="#fff" stroke="' + C.penebar + '" stroke-width="1.5"/>'
      + '<text x="360" y="70" text-anchor="middle" fill="#a05c0a" style="font-size:9.5px;font-weight:800">Penetron is growing —</text>'
      + '<text x="360" y="83" text-anchor="middle" fill="#a05c0a" style="font-size:9.5px;font-weight:800">sealing the concrete matrix</text>'
      + '</g>';
    return a;
  }

  var SEQ_BAR_W = 150;

  function seqHud(key, mode, day, total, label, stepNo, stepCount) {
    var done = day >= total;
    var col = done ? (mode === 'mem' ? C.risk : C.ok) : '#0D2F5E';
    var w = Math.max(2, Math.round(SEQ_BAR_W * Math.min(day, total) / total));
    var s = '<text id="seqday-' + key + '" x="12" y="30" text-anchor="start" fill="' + col + '"'
      + ' style="font-size:16px;font-weight:900" paint-order="stroke" stroke="' + C.sky + '" stroke-width="4" stroke-linejoin="round">'
      + (done ? 'WATERTIGHT — ' + total + ' DAYS' : 'DAY ' + Math.min(day + 1, total) + ' of ' + total) + '</text>';
    s += '<rect x="12" y="38" width="' + SEQ_BAR_W + '" height="4" rx="2" fill="#d5dce8"/>';
    s += '<rect id="seqbar-' + key + '" x="12" y="38" width="' + w + '" height="4" rx="2" fill="' + (done ? col : C.penebar) + '" style="transition: width .32s linear"/>';
    // stage banner — number above, step name in a pill
    var pillText = done ? 'Sequence complete — watertight' : label;
    var pw = Math.min(444, Math.max(160, Math.round(pillText.length * 5.6) + 28));
    s += '<g class="seq-in">';
    if (!done) {
      s += '<text x="240" y="330" text-anchor="middle" fill="' + C.penebar + '"'
        + ' style="font-size:8px;font-weight:800;letter-spacing:1.6px" paint-order="stroke" stroke="' + C.sky + '" stroke-width="3" stroke-linejoin="round">'
        + 'STAGE ' + stepNo + ' OF ' + stepCount + '</text>';
    }
    s += '<rect x="' + (240 - pw / 2) + '" y="336" width="' + pw + '" height="18" rx="9" fill="' + (done ? col : '#0D2F5E') + '" opacity=".93"/>';
    s += '<text x="240" y="348.5" text-anchor="middle" fill="#fff" style="font-size:9.5px;font-weight:700">' + pillText + '</text>';
    s += '</g>';
    return s;
  }


  /* in-place updates between step changes — no DOM rebuild */
  function seqTickHud(key, day, total) {
    if (day >= total) return;
    var t = document.getElementById('seqday-' + key);
    if (t) t.textContent = 'DAY ' + Math.min(day + 1, total) + ' of ' + total;
    var b = document.getElementById('seqbar-' + key);
    if (b) b.setAttribute('width', Math.max(2, Math.round(SEQ_BAR_W * day / total)));
  }

  /* one frame of the staged (standard) build — membrane or Penetron.
     nf = the flag of the step that just started; its work fades in. */
  function seqStagedFrame(mode, f, nPiles, nf) {
    var mem = mode === 'mem';
    var fill = mem ? 'url(#p-conc)' : 'url(#p-crys)';
    var s = defs('p');
    var GRADE = 40, WT = 74;
    var CAP_L = 108, CAP_R = 372, CAP_T = 208, CAP_B = 268;
    var WL_L = 158, WL_R = 178, WR_L = 302, WR_R = 322;
    var EX_L = 76, EX_R = 404, EX_B = 280;
    var open = f.dug && !f.backfill;
    var flooded = open && !f.dewater;
    function IW(flag, chunk) { return flag === nf ? '<g class="seq-in">' + chunk + '</g>' : chunk; }

    s += '<rect x="0" y="0" width="480" height="360" fill="' + C.sky + '"/>';

    if (!f.dug) {
      s += '<rect x="0" y="' + GRADE + '" width="480" height="' + (360 - GRADE) + '" fill="url(#p-soil)"/>';
      s += '<rect x="0" y="' + WT + '" width="480" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
      s += '<line x1="0" y1="' + GRADE + '" x2="480" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>';
    } else {
      s += '<rect x="0" y="' + GRADE + '" width="' + EX_L + '" height="' + (360 - GRADE) + '" fill="url(#p-soil)"/>';
      s += '<rect x="' + EX_R + '" y="' + GRADE + '" width="' + (480 - EX_R) + '" height="' + (360 - GRADE) + '" fill="url(#p-soil)"/>';
      s += '<rect x="' + EX_L + '" y="' + EX_B + '" width="' + (EX_R - EX_L) + '" height="' + (360 - EX_B) + '" fill="url(#p-soil)"/>';
      s += '<rect x="0" y="' + WT + '" width="' + EX_L + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
      s += '<rect x="' + EX_R + '" y="' + WT + '" width="' + (480 - EX_R) + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
      s += '<line x1="0" y1="' + GRADE + '" x2="' + EX_L + '" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>';
      s += '<line x1="' + EX_R + '" y1="' + GRADE + '" x2="480" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>';
      if (open) {
        s += '<polyline points="' + EX_L + ',' + GRADE + ' ' + EX_L + ',' + EX_B + ' ' + EX_R + ',' + EX_B + ' ' + EX_R + ',' + GRADE + '" fill="none" stroke="' + C.soilLine + '" stroke-width="1.6"/>';
        if (flooded) {
          s += '<rect x="' + EX_L + '" y="' + WT + '" width="' + (EX_R - EX_L) + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
          s += '<line x1="' + EX_L + '" y1="' + WT + '" x2="' + EX_R + '" y2="' + WT + '" stroke="' + C.waterLine + '" stroke-width="1.4" stroke-dasharray="7,4"/>';
          s += txt(240, WT + 26, 'Groundwater floods the cut', C.waterLine, 'middle', 9, 700);
        } else {
          s += IW('dewater', '<path d="M' + EX_L + ' ' + WT + ' Q140 ' + (EX_B + 40) + ' 240 ' + (EX_B + 42)
            + ' Q340 ' + (EX_B + 40) + ' ' + EX_R + ' ' + WT + '" fill="none" stroke="' + C.waterLine + '" stroke-width="1.4" stroke-dasharray="7,4" opacity=".8"/>');
        }
        // the spoil fades away as the dig starts
        if (nf === 'dug') {
          s += '<g class="seq-out">'
            + '<rect x="' + EX_L + '" y="' + GRADE + '" width="' + (EX_R - EX_L) + '" height="' + (EX_B - GRADE) + '" fill="url(#p-soil)"/>'
            + '<rect x="' + EX_L + '" y="' + WT + '" width="' + (EX_R - EX_L) + '" height="' + (EX_B - WT) + '" fill="' + C.waterWash + '"/>'
            + '<line x1="' + EX_L + '" y1="' + GRADE + '" x2="' + EX_R + '" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>'
            + '</g>';
        }
      } else {
        var bf = '<rect x="' + EX_L + '" y="' + GRADE + '" width="' + (WL_L - EX_L) + '" height="' + (EX_B - GRADE) + '" fill="url(#p-soil)"/>'
          + '<rect x="' + WR_R + '" y="' + GRADE + '" width="' + (EX_R - WR_R) + '" height="' + (EX_B - GRADE) + '" fill="url(#p-soil)"/>'
          + '<rect x="' + EX_L + '" y="' + WT + '" width="' + (WL_L - EX_L) + '" height="' + (EX_B - WT) + '" fill="' + C.waterWash + '"/>'
          + '<rect x="' + WR_R + '" y="' + WT + '" width="' + (EX_R - WR_R) + '" height="' + (EX_B - WT) + '" fill="' + C.waterWash + '"/>'
          + '<rect x="' + EX_L + '" y="' + EX_B + '" width="' + (EX_R - EX_L) + '" height="' + (360 - EX_B) + '" fill="' + C.waterWash + '"/>'
          + '<line x1="' + EX_L + '" y1="' + GRADE + '" x2="' + WL_L + '" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>'
          + '<line x1="' + WR_R + '" y1="' + GRADE + '" x2="' + EX_R + '" y2="' + GRADE + '" stroke="#8fa0ba" stroke-width="2"/>';
        s += IW('backfill', bf);
      }
    }
    s += waterTable(6, 68, WT, 14);
    s += txt(8, 56, 'Water table —', C.waterLine, 'start', 9);
    s += txt(8, 67, 'just below grade', C.waterLine, 'start', 9);

    // sheet piling + well points hold the cut dry
    if (f.dewater && open) {
      s += IW('dewater',
        '<rect x="' + (EX_L - 3) + '" y="' + (GRADE - 10) + '" width="5" height="' + (EX_B - GRADE + 28) + '" fill="#7d8a9e"/>'
        + '<rect x="' + (EX_R - 2) + '" y="' + (GRADE - 10) + '" width="5" height="' + (EX_B - GRADE + 28) + '" fill="#7d8a9e"/>'
        + '<rect x="' + (EX_L - 18) + '" y="' + (GRADE - 6) + '" width="4" height="' + (WT - GRADE + 56) + '" fill="#98a3b5"/>'
        + '<rect x="' + (EX_R + 14) + '" y="' + (GRADE - 6) + '" width="4" height="' + (WT - GRADE + 56) + '" fill="#98a3b5"/>'
        + txt(EX_R - 44, GRADE - 16, 'Well points + sheets', C.label, 'middle', 8));
    }

    // mud slab goes down with the base prep
    if (f.baseMemb || f.matForms) {
      s += IW(mem ? 'baseMemb' : 'matForms',
        '<rect x="' + (CAP_L - 8) + '" y="' + CAP_B + '" width="' + (CAP_R - CAP_L + 16) + '" height="12" fill="' + C.mud + '" stroke="#b9c0cc" stroke-width="1"/>');
    }

    // piles
    var pileXs = nPiles > 0 ? spread(150, 330, nPiles) : [];
    if (f.piles) {
      var pp = '';
      pileXs.forEach(function (x) {
        pp += '<rect x="' + (x - 9) + '" y="' + EX_B + '" width="18" height="' + (360 - EX_B) + '" fill="#b3bcca" stroke="#7d8a9e" stroke-width="1.2"/>';
        pp += rebarV(x, EX_B + 8, 352);
      });
      s += IW('piles', pp);
    }
    if (f.pileTrim) {
      var pt = '';
      pileXs.forEach(function (x) { pt += rebarV(x, EX_B - 18, EX_B + 6); });
      s += IW('pileTrim', pt);
    }

    var membY = CAP_B + 2;
    if (mem && f.baseMemb) {
      var bm = '';
      if (f.piles && pileXs.length) {
        var segs = [CAP_L - 8].concat(pileXs.reduce(function (acc, x) { return acc.concat([x - 12, x + 12]); }, [])).concat([CAP_R + 8]);
        for (var i = 0; i < segs.length; i += 2) {
          bm += '<line x1="' + segs[i] + '" y1="' + membY + '" x2="' + segs[i + 1] + '" y2="' + membY + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
        }
      } else {
        bm += '<line x1="' + (CAP_L - 8) + '" y1="' + membY + '" x2="' + (CAP_R + 8) + '" y2="' + membY + '" stroke="' + C.membrane + '" stroke-width="3.5"/>';
      }
      s += IW('baseMemb', bm);
    }
    if (mem && f.boots) {
      var bt = '';
      pileXs.forEach(function (x) {
        bt += '<path d="M' + (x - 13) + ' ' + membY + ' l5 -8 h16 l5 8" fill="none" stroke="' + C.risk + '" stroke-width="2"/>';
      });
      s += IW('boots', bt);
    }

    if (f.matForms && !f.matPour) s += IW('matForms', formBoard(CAP_L - 7, CAP_T, EX_B) + formBoard(CAP_R + 1, CAP_T, EX_B));
    if (f.matRebar) {
      var mr = rebarH(CAP_L + 12, CAP_R - 12, CAP_T + 14) + rebarH(CAP_L + 12, CAP_R - 12, CAP_B - 12);
      spread(132, 348, 7).forEach(function (x) { mr += rebarV(x, CAP_T + 14, CAP_B - 12); });
      s += IW('matRebar', mr);
    }

    if (f.matPour) {
      var mp = '<rect x="' + CAP_L + '" y="' + CAP_T + '" width="' + (CAP_R - CAP_L) + '" height="' + (CAP_B - CAP_T) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>';
      if (!f.wallPour) {
        [WL_L + 5, WL_R - 5, WR_L + 5, WR_R - 5].forEach(function (x) { mp += rebarV(x, CAP_T - 26, CAP_T + 18); });
      }
      s += IW('matPour', mp);
    }

    if (mem && f.keyway && !f.wallPour) {
      s += IW('keyway',
        '<rect x="' + (WL_L + 3) + '" y="' + (CAP_T - 4) + '" width="14" height="6" fill="' + C.sky + '" stroke="' + C.edge + '" stroke-width="1"/>'
        + '<rect x="' + (WR_L + 3) + '" y="' + (CAP_T - 4) + '" width="14" height="6" fill="' + C.sky + '" stroke="' + C.edge + '" stroke-width="1"/>');
    }

    if (f.wstop1) {
      if (mem) {
        if (!f.wallPour) {
          s += IW('wstop1',
            '<rect x="' + (WL_L + 3) + '" y="' + (CAP_T - 4) + '" width="14" height="6" rx="2" fill="#3a4354"/>'
            + '<rect x="' + (WR_L + 3) + '" y="' + (CAP_T - 4) + '" width="14" height="6" rx="2" fill="#3a4354"/>');
        } else {
          s += IW('wallPour',
            '<line x1="' + WL_L + '" y1="' + CAP_T + '" x2="' + WL_R + '" y2="' + CAP_T + '" stroke="' + C.risk + '" stroke-width="2.5" stroke-dasharray="5,3"/>'
            + '<line x1="' + WR_L + '" y1="' + CAP_T + '" x2="' + WR_R + '" y2="' + CAP_T + '" stroke="' + C.risk + '" stroke-width="2.5" stroke-dasharray="5,3"/>'
            + '<rect x="' + (WL_L + 3) + '" y="' + (CAP_T - 3) + '" width="14" height="6" rx="2" fill="#3a4354"/>'
            + '<rect x="' + (WR_L + 3) + '" y="' + (CAP_T - 3) + '" width="14" height="6" rx="2" fill="#3a4354"/>');
        }
      } else {
        s += IW('wstop1',
          '<rect x="' + (WL_L + 2) + '" y="' + (CAP_T - 4) + '" width="16" height="7" rx="3" fill="' + C.penebar + '"/>'
          + '<rect x="' + (WR_L + 2) + '" y="' + (CAP_T - 4) + '" width="16" height="7" rx="3" fill="' + C.penebar + '"/>');
      }
    }

    if (f.wallSteel) {
      var ws = '';
      [WL_L + 6, WL_R - 6, WR_L + 6, WR_R - 6].forEach(function (x) { ws += rebarV(x, GRADE + 6, CAP_T + 20); });
      [88, 132, 176].forEach(function (y) { ws += rebarH(WL_L + 4, WL_R - 4, y) + rebarH(WR_L + 4, WR_R - 4, y); });
      s += IW('wallSteel', ws);
    }
    if (f.wallForms && !f.wallPour) {
      s += IW('wallForms',
        formBoard(WL_L - 7, GRADE, CAP_T) + formBoard(WL_R + 1, GRADE, CAP_T)
        + formBoard(WR_L - 7, GRADE, CAP_T) + formBoard(WR_R + 1, GRADE, CAP_T));
    }
    if (f.wallPour) {
      s += IW('wallPour',
        '<rect x="' + WL_L + '" y="' + GRADE + '" width="' + (WL_R - WL_L) + '" height="' + (CAP_T - GRADE) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>'
        + '<rect x="' + WR_L + '" y="' + GRADE + '" width="' + (WR_R - WR_L) + '" height="' + (CAP_T - GRADE) + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5"/>'
        + txt(240, 140, 'ELEVATOR PIT', C.interior, 'middle', 11, 700));
    }

    if (mem && f.matMemb) {
      s += IW('matMemb',
        '<line x1="' + (CAP_L - 2) + '" y1="' + (CAP_T - 2) + '" x2="' + (CAP_L - 2) + '" y2="' + (CAP_B + 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>'
        + '<line x1="' + (CAP_R + 2) + '" y1="' + (CAP_T - 2) + '" x2="' + (CAP_R + 2) + '" y2="' + (CAP_B + 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>'
        + '<line x1="' + (CAP_L - 2) + '" y1="' + (CAP_T - 2) + '" x2="' + (WL_L - 3) + '" y2="' + (CAP_T - 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>'
        + '<line x1="' + (WR_R + 3) + '" y1="' + (CAP_T - 2) + '" x2="' + (CAP_R + 2) + '" y2="' + (CAP_T - 2) + '" stroke="' + C.membrane + '" stroke-width="3.5"/>');
    }
    if (mem && f.wallMemb) {
      s += IW('wallMemb',
        '<line x1="' + (WL_L - 4) + '" y1="' + (GRADE + 2) + '" x2="' + (WL_L - 4) + '" y2="' + CAP_T + '" stroke="' + C.membrane + '" stroke-width="3.5"/>'
        + '<line x1="' + (WR_R + 4) + '" y1="' + (GRADE + 2) + '" x2="' + (WR_R + 4) + '" y2="' + CAP_T + '" stroke="' + C.membrane + '" stroke-width="3.5"/>');
    }

    // slab on grade over the backfill
    if (mem && f.slabMemb) {
      s += IW('slabMemb',
        '<line x1="8" y1="' + (GRADE - 2) + '" x2="' + WL_R + '" y2="' + (GRADE - 2) + '" stroke="' + C.membrane + '" stroke-width="3"/>'
        + '<line x1="' + WR_L + '" y1="' + (GRADE - 2) + '" x2="472" y2="' + (GRADE - 2) + '" stroke="' + C.membrane + '" stroke-width="3"/>');
    }
    if (f.wstop2) {
      var wsFill = mem ? '#3a4354' : C.penebar;
      s += IW('wstop2',
        '<rect x="' + (WL_R - 16) + '" y="' + (GRADE - 11) + '" width="14" height="6" rx="2" fill="' + wsFill + '"/>'
        + '<rect x="' + (WR_L + 2) + '" y="' + (GRADE - 11) + '" width="14" height="6" rx="2" fill="' + wsFill + '"/>');
    }
    if (f.slabForms && !f.slabPour) {
      s += IW('slabForms',
        formBoard(2, GRADE - 14, GRADE) + formBoard(WL_R - 6, GRADE - 14, GRADE)
        + formBoard(WR_L + 1, GRADE - 14, GRADE) + formBoard(473, GRADE - 14, GRADE));
    }
    if (f.slabSteel) {
      s += IW('slabSteel', rebarH(10, WL_R - 6, GRADE - 7) + rebarH(WR_L + 6, 470, GRADE - 7));
    }
    if (f.slabPour) {
      s += IW('slabPour',
        '<rect x="0" y="' + (GRADE - 14) + '" width="' + WL_R + '" height="14" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.2"/>'
        + '<rect x="' + WR_L + '" y="' + (GRADE - 14) + '" width="' + (480 - WR_L) + '" height="14" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.2"/>');
    }

    if (!mem && f.activate) {
      var wash = '<rect x="' + CAP_L + '" y="' + CAP_T + '" width="' + (CAP_R - CAP_L) + '" height="' + (CAP_B - CAP_T) + '" fill="' + C.waterWash + '"/>'
        + '<rect x="' + WL_L + '" y="' + GRADE + '" width="' + (WL_R - WL_L) + '" height="' + (CAP_T - GRADE) + '" fill="' + C.waterWash + '"/>'
        + '<rect x="' + WR_L + '" y="' + GRADE + '" width="' + (WR_R - WR_L) + '" height="' + (CAP_T - GRADE) + '" fill="' + C.waterWash + '"/>'
        + '<rect x="0" y="' + (GRADE - 14) + '" width="' + WL_R + '" height="14" fill="' + C.waterWash + '"/>'
        + '<rect x="' + WR_L + '" y="' + (GRADE - 14) + '" width="' + (480 - WR_L) + '" height="14" fill="' + C.waterWash + '"/>';
      var crys = [[168, 120], [312, 152], [150, 240], [240, 250], [330, 232], [172, 192]];
      var arrows = [[128, 122, 22, 'right'], [352, 122, 22, 'left'], [200, 308, 18, 'up'], [280, 308, 18, 'up']];
      s += IW('activate', activationFx(wash, crys, arrows));
    }
    return s;
  }

  /* one frame of the monolithic spread-footing build (Penetron side) */
  function seqMonoFrame(f, nPiles, nf) {
    var fill = 'url(#e-crys)';
    var s = defs('e');
    var GR = 130, WT = 170;
    var SOG_T = 108;
    var WL_L = 138, WL_R = 158, WR_L = 322, WR_R = 342;
    var SLAB_T = 262, SLAB_B = 322;
    var padL = 92, padR = 388;
    var EXT_L = 10, EXT_R = 470, EXB_L = 78, EXB_R = 402, EX_B = 336;
    var open = f.dug && !f.backfill;
    function IW(flag, chunk) { return flag === nf ? '<g class="seq-in">' + chunk + '</g>' : chunk; }

    s += '<rect x="0" y="0" width="480" height="360" fill="' + C.sky + '"/>';

    if (!f.dug) {
      s += '<rect x="0" y="' + GR + '" width="480" height="' + (360 - GR) + '" fill="url(#e-soil)"/>';
      s += '<rect x="0" y="' + WT + '" width="480" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>';
      s += '<line x1="0" y1="' + GR + '" x2="480" y2="' + GR + '" stroke="#8fa0ba" stroke-width="2"/>';
    } else if (open) {
      s += '<path d="M0 ' + GR + ' H' + EXT_L + ' L' + EXB_L + ' ' + EX_B + ' H0 Z" fill="url(#e-soil)"/>';
      s += '<path d="M480 ' + GR + ' H' + EXT_R + ' L' + EXB_R + ' ' + EX_B + ' H480 Z" fill="url(#e-soil)"/>';
      s += '<rect x="0" y="' + EX_B + '" width="480" height="' + (360 - EX_B) + '" fill="url(#e-soil)"/>';
      s += '<path d="M0 ' + WT + ' H23 L' + EXB_L + ' ' + EX_B + ' H0 Z" fill="' + C.waterWash + '"/>';
      s += '<path d="M480 ' + WT + ' H457 L' + EXB_R + ' ' + EX_B + ' H480 Z" fill="' + C.waterWash + '"/>';
      s += '<rect x="0" y="' + EX_B + '" width="480" height="' + (360 - EX_B) + '" fill="' + C.waterWash + '"/>';
      s += '<line x1="0" y1="' + GR + '" x2="' + EXT_L + '" y2="' + GR + '" stroke="#8fa0ba" stroke-width="2"/>';
      s += '<line x1="' + EXT_R + '" y1="' + GR + '" x2="480" y2="' + GR + '" stroke="#8fa0ba" stroke-width="2"/>';
      s += '<polyline points="' + EXT_L + ',' + GR + ' ' + EXB_L + ',' + EX_B + ' ' + EXB_R + ',' + EX_B + ' ' + EXT_R + ',' + GR + '" fill="none" stroke="' + C.soilLine + '" stroke-width="1.6"/>';
      s += '<path d="M23 ' + WT + ' Q240 ' + (EX_B + 16) + ' 457 ' + WT + '" fill="none" stroke="' + C.waterLine + '" stroke-width="1.4" stroke-dasharray="7,4" opacity=".8"/>';
      if (nf === 'dug') {
        s += '<g class="seq-out">'
          + '<path d="M' + EXT_L + ' ' + GR + ' H' + EXT_R + ' L' + EXB_R + ' ' + EX_B + ' H' + EXB_L + ' Z" fill="url(#e-soil)"/>'
          + '<path d="M23 ' + WT + ' H457 L' + EXB_R + ' ' + EX_B + ' H' + EXB_L + ' Z" fill="' + C.waterWash + '"/>'
          + '<line x1="' + EXT_L + '" y1="' + GR + '" x2="' + EXT_R + '" y2="' + GR + '" stroke="#8fa0ba" stroke-width="2"/>'
          + '</g>';
      }
    } else {
      // backfilled — same soil layout as the finished monolithic scene
      var bf = '<rect x="0" y="' + GR + '" width="' + WL_L + '" height="' + (360 - GR) + '" fill="url(#e-soil)"/>'
        + '<rect x="' + WR_R + '" y="' + GR + '" width="' + (480 - WR_R) + '" height="' + (360 - GR) + '" fill="url(#e-soil)"/>'
        + '<rect x="' + WL_L + '" y="' + (SLAB_B + 10) + '" width="' + (WR_R - WL_L) + '" height="' + (360 - SLAB_B - 10) + '" fill="url(#e-soil)"/>'
        + '<rect x="0" y="' + WT + '" width="' + WL_L + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>'
        + '<rect x="' + WR_R + '" y="' + WT + '" width="' + (480 - WR_R) + '" height="' + (360 - WT) + '" fill="' + C.waterWash + '"/>'
        + '<rect x="' + WL_L + '" y="' + (SLAB_B + 10) + '" width="' + (WR_R - WL_L) + '" height="' + (360 - SLAB_B - 10) + '" fill="' + C.waterWash + '"/>';
      s += IW('backfill', bf);
    }

    // piles under the pad
    var pileXs = nPiles > 0 ? spread(150, 330, nPiles) : [];
    if (f.piles) {
      var pp = '';
      pileXs.forEach(function (x) {
        pp += '<rect x="' + (x - 9) + '" y="' + (SLAB_B + 10) + '" width="18" height="' + (360 - SLAB_B - 10) + '" fill="#b3bcca" stroke="#7d8a9e" stroke-width="1.2"/>';
        pp += rebarV(x, SLAB_B + 16, 356);
      });
      s += IW('piles', pp);
    }
    if (f.pileTrim) {
      var pt = '';
      pileXs.forEach(function (x) { pt += rebarV(x, SLAB_B - 8, SLAB_B + 14); });
      s += IW('pileTrim', pt);
    }

    // mud slab with the forms
    if (f.forms) {
      s += IW('forms',
        '<rect x="' + (padL - 8) + '" y="' + SLAB_B + '" width="' + (padR - padL + 16) + '" height="10" fill="' + C.mud + '" stroke="#b9c0cc" stroke-width="1"/>');
    }
    if (f.forms && !f.pour) {
      s += IW('forms',
        formBoard(padL - 7, SLAB_T, SLAB_B) + formBoard(padR + 1, SLAB_T, SLAB_B)
        + formBoard(21, SOG_T, GR) + formBoard(453, SOG_T, GR));
    }
    if (f.cage) {
      var cg = '<path d="M' + (WL_L + 10) + ' ' + (GR + 8) + ' V' + (SLAB_T + 13) + ' H232" fill="none" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>'
        + '<path d="M' + (WR_R - 10) + ' ' + (GR + 8) + ' V' + (SLAB_T + 13) + ' H248" fill="none" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>'
        + '<line x1="44" y1="' + (GR + 14) + '" x2="' + (padL + 12) + '" y2="' + (SLAB_B - 8) + '" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>'
        + '<line x1="436" y1="' + (GR + 14) + '" x2="' + (padR - 12) + '" y2="' + (SLAB_B - 8) + '" stroke="' + C.rebar + '" stroke-width="1.1" stroke-dasharray="7,5" opacity=".8"/>'
        + rebarH(padL + 10, padR - 10, SLAB_B - 12);
      s += IW('cage', cg);
    }
    if (f.pitForm && !f.backfill) {
      s += IW('pitForm',
        '<rect x="' + WL_R + '" y="' + SOG_T + '" width="' + (WR_L - WL_R) + '" height="' + (SLAB_T - SOG_T) + '" fill="rgba(217,181,124,.2)" stroke="#9c7a45" stroke-width="1.5" stroke-dasharray="6,4"/>'
        + '<line x1="' + WL_R + '" y1="' + SOG_T + '" x2="' + WR_L + '" y2="' + SLAB_T + '" stroke="#9c7a45" stroke-width="1" stroke-dasharray="6,4"/>'
        + '<line x1="' + WR_L + '" y1="' + SOG_T + '" x2="' + WL_R + '" y2="' + SLAB_T + '" stroke="#9c7a45" stroke-width="1" stroke-dasharray="6,4"/>');
    }
    var pMono = 'M0 ' + SOG_T
      + ' H' + WL_R + ' V' + SLAB_T + ' H' + WR_L + ' V' + SOG_T + ' H480'
      + ' V' + GR + ' H452 L' + padR + ' ' + SLAB_B + ' H' + padL + ' L28 ' + GR + ' H0 Z';
    if (f.pour) {
      s += IW('pour',
        '<path d="' + pMono + '" fill="' + fill + '" stroke="' + C.edge + '" stroke-width="1.5" stroke-linejoin="round"/>'
        + txt(240, 200, 'ELEVATOR PIT', C.interior, 'middle', 11, 700));
    }

    if (f.activate) {
      var wash = '<path d="' + pMono + '" fill="' + C.waterWash + '"/>';
      var crys = [[70, 120], [410, 120], [120, 210], [360, 210], [240, 295], [148, 235]];
      var arrows = [[8, 210, 22, 'right'], [472, 210, 22, 'left'], [220, 352, 16, 'up'], [300, 352, 16, 'up']];
      s += IW('activate', activationFx(wash, crys, arrows));
    }

    s += waterTable(6, 60, WT, 14);
    s += txt(4, WT - 22, 'Water table', C.waterLine, 'start', 8.6);
    s += txt(4, WT - 11, 'ABOVE pit floor', C.waterLine, 'start', 8.6);
    return s;
  }

  /* ── playback engine ─────────────────────────────────── */
  var seqTimer = null, seqPlaying = false;
  var lastRender = null;

  function stopSequence() {
    if (seqTimer) { clearInterval(seqTimer); seqTimer = null; }
    seqPlaying = false;
    var btn = document.getElementById('seq-btn');
    if (btn) btn.innerHTML = '&#9658;&nbsp; Watch it built — day by day';
  }

  window.playBuildSequence = function () {
    var memHost = document.getElementById('diagram-membrane');
    var penHost = document.getElementById('diagram-penetron');
    if (!lastRender || !memHost || !penHost) return;
    var type = lastRender.type;
    if (type !== 'elevator' && type !== 'pilecap') return;

    if (seqPlaying) {
      stopSequence();
      renderComparisonDiagram(lastRender.d, lastRender.type, lastRender.extra);
      return;
    }

    var hasPiles = type === 'pilecap';
    var nPiles = hasPiles ? Math.max(3, cap(lastRender.d.piles, 5) || 3) : 0;
    var penMono = !!lastRender.monoOn;
    var memSteps = stepsMembrane(hasPiles);
    var penSteps = penMono ? stepsMonolithic(hasPiles) : stepsPenetron(hasPiles);
    var memTotal = totalDays(memSteps), penTotal = totalDays(penSteps);
    var maxTotal = Math.max(memTotal, penTotal);

    memHost.classList.remove('anim');
    penHost.classList.remove('anim');
    var stageMem = document.getElementById('compare-stage-membrane');
    var stagePen = document.getElementById('compare-stage-penetron');
    if (stageMem) stageMem.textContent = 'Build sequence — ' + memTotal + ' days in the ground';
    if (stagePen) stagePen.textContent = 'Build sequence — ' + penTotal + ' days' + (penMono ? ' — monolithic' : '');

    seqPlaying = true;
    var btn = document.getElementById('seq-btn');
    if (btn) btn.innerHTML = '&#9632;&nbsp; Stop — back to the risk view';

    var day = 0, memKey = -1, penKey = -1;

    // a panel's SVG is only rebuilt when its step (or completion) changes;
    // between steps only the day counter and progress bar mutate in place
    function renderPanels() {
      var mDay = Math.min(day, memTotal);
      var m = seqFlagsAt(memSteps, mDay);
      var mk = m.idx * 2 + (mDay >= memTotal ? 1 : 0);
      if (mk !== memKey) {
        memKey = mk;
        var mnf = mDay >= memTotal ? null : m.flag;
        memHost.innerHTML = seqStagedFrame('mem', m.f, nPiles, mnf) + seqHud('mem', 'mem', mDay, memTotal, m.label, m.idx + 1, memSteps.length);
      } else {
        seqTickHud('mem', mDay, memTotal);
      }
      var pDay = Math.min(day, penTotal);
      var p = seqFlagsAt(penSteps, pDay);
      var pk = p.idx * 2 + (pDay >= penTotal ? 1 : 0);
      if (pk !== penKey) {
        penKey = pk;
        var pnf = pDay >= penTotal ? null : p.flag;
        penHost.innerHTML = (penMono ? seqMonoFrame(p.f, nPiles, pnf) : seqStagedFrame('pen', p.f, nPiles, pnf))
          + seqHud('pen', 'pen', pDay, penTotal, p.label, p.idx + 1, penSteps.length);
      } else {
        seqTickHud('pen', pDay, penTotal);
      }
    }
    renderPanels();
    seqTimer = setInterval(function () {
      day++;
      renderPanels();
      if (day >= maxTotal) {
        clearInterval(seqTimer); seqTimer = null; seqPlaying = false;
        if (btn) btn.innerHTML = '&#8635;&nbsp; Replay the build';
      }
    }, 500);
  };

  /* ── summary + orchestration (unchanged interface) ───── */
  function buildScene(type, mode, d, extra) {
    if (type === 'pilecap') return scenePilecap(mode, d, extra);
    if (type === 'elevator') return sceneElevator(mode, d, extra);
    return sceneSlab(mode, d);
  }

  /* Always describes the membrane system's STAGED construction — the
     monolithic-pour toggle only changes how Penetron builds it, so the
     membrane side (and its risk count) stays the standard detail. */
  function riskSummary(type, d, extra) {
    if (type === 'pilecap') {
      var pile = d.piles || 0;
      var parts = [];
      if (pile > 0) parts.push(pile + ' pile boot' + (pile !== 1 ? 's' : ''));
      var joints = 0;
      if (d.cjLF > 0) { joints = 2; parts.push('2 cap-to-wall cold joints'); }
      return { count: pile + joints, parts: parts };
    }
    if (type === 'elevator') {
      var cjE = Math.ceil(d.cjLF / 30) || 0;
      var corners = 2 + ((extra && extra.sump) ? 2 : 0);
      var parts1 = [];
      if (cjE > 0) parts1.push(cjE + ' cold joint' + (cjE !== 1 ? 's' : ''));
      parts1.push(corners + ' membrane corner folds');
      if (d.penCount > 0) parts1.push(d.penCount + ' penetration' + (d.penCount !== 1 ? 's' : ''));
      return { count: cjE + corners + d.penCount, parts: parts1 };
    }
    var cjS = Math.ceil(d.cjLF / 50) || 0;
    var parts2 = [];
    if (cjS > 0) parts2.push(cjS + ' construction joint' + (cjS !== 1 ? 's' : ''));
    if (d.penCount > 0) parts2.push(d.penCount + ' penetration' + (d.penCount !== 1 ? 's' : ''));
    if (cjS + d.penCount > 0) parts2.push('the wall-to-underslab transition');
    return { count: cjS + d.penCount + (cjS + d.penCount > 0 ? 1 : 0), parts: parts2 };
  }

  var STAGE_NOTES = {
    slab: { mem: 'Membrane installed before + after the pour \u2014 then never inspectable again', pen: 'Admixture goes in the ready-mix truck' },
    pilecap: { mem: 'Two-stage pour \u2014 cap, then pit walls', pen: 'One treated mass \u2014 cap, walls, pile heads' },
    elevator: { mem: 'Two-stage pour \u2014 slab, then walls', pen: null }
  };

  var lastAnimKey = null;

  function renderComparisonDiagram(d, type, extra) {
    var memHost = document.getElementById('diagram-membrane');
    var penHost = document.getElementById('diagram-penetron');
    if (!memHost || !penHost) return;

    // Any normal re-render cancels an in-flight build sequence.
    stopSequence();

    // The membrane side always shows the standard staged construction \u2014
    // pouring monolithically is what Penetron enables, so only the
    // Penetron scene switches when the toggle is on.
    var monoOn = !!(extra && extra.monoPour) && (type === 'elevator' || type === 'pilecap');
    var memExtra = { monoPour: false, sump: !!(extra && extra.sump) };
    lastRender = { d: d, type: type, extra: extra, monoOn: monoOn };

    // Replay the pour-sequence animation only when the scene itself changes
    // (scope switch, mono toggle, sump) \u2014 not on every keystroke.
    var animKey = type + '|' + (monoOn ? 1 : 0) + '|' + (memExtra.sump ? 1 : 0);
    var replay = animKey !== lastAnimKey;
    lastAnimKey = animKey;
    memHost.classList.toggle('anim', replay);
    penHost.classList.toggle('anim', replay);

    memHost.innerHTML = buildScene(type, 'mem', d, memExtra);
    penHost.innerHTML = buildScene(type, 'pen', d, extra);

    var stageMem = document.getElementById('compare-stage-membrane');
    var stagePen = document.getElementById('compare-stage-penetron');
    var notes = STAGE_NOTES[type] || STAGE_NOTES.slab;
    if (stageMem) {
      stageMem.textContent = monoOn
        ? (notes.mem || '') + ' \u2014 staging is required to tie the membrane in'
        : (notes.mem || '');
    }
    if (stagePen) {
      stagePen.textContent = monoOn
        ? (type === 'pilecap' ? 'Monolithic pour \u2014 cap + pit walls in one placement' : 'Monolithic pour \u2014 pit dropped out of the mat, one placement')
        : (notes.pen || 'Admixture goes in the ready-mix truck');
    }

    var summary = riskSummary(type, d, extra);
    var memStats = document.getElementById('compare-stats-membrane');
    var penStats = document.getElementById('compare-stats-penetron');

    if (memStats) {
      memStats.innerHTML = summary.parts.length
        ? '<span class="compare-risk-chip">' + summary.parts.join(' \u00B7 ') + '</span>'
        : '<span class="compare-risk-chip compare-risk-chip-muted">Enter Scope quantities to see risk points</span>';
    }
    if (penStats) {
      penStats.innerHTML = '<span class="compare-risk-chip compare-risk-chip-good">'
        + (monoOn ? '0 field details \u00B7 0 cold joints \u2014 monolithic pour' : '0 field-applied details \u2014 waterproofing is in the mix')
        + '</span>';
    }

    var takeaway = document.getElementById('compare-takeaway');
    if (takeaway) {
      if (summary.count > 0) {
        takeaway.innerHTML = 'On this scope, a membrane system relies on <strong>' + summary.count + ' field-installed detail' + (summary.count !== 1 ? 's' : '') + '</strong>'
          + (summary.parts.length ? ' (' + summary.parts.join(', ') + ')' : '')
          + ' \u2014 each one buried and uninspectable after backfill. Penetron requires <strong>zero</strong>: the waterproofing is the concrete itself, and it self-heals.';
      } else {
        takeaway.innerHTML = 'Enter your project\u2019s Scope quantities above to see exactly how many buried, uninspectable membrane details this scope would rely on \u2014 and how many Penetron eliminates.';
      }
    }
  }

  window.renderComparisonDiagram = renderComparisonDiagram;
})();
