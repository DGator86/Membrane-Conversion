# Below-Grade Waterproofing Conversion Tool

A preconstruction estimator for general contractors comparing **Penetron integral crystalline admixture** against **hydrostatic membrane waterproofing** — cost, schedule, and high-risk detailing side by side.

Built for South Florida high-rise conditions where membrane complexity (pile penetrations, congested reinforcing, corner transitions, construction joints) drives significant hidden cost and schedule risk.

---

## Project Types

| Type | Description |
|------|-------------|
| **Hydrostatic Slab** | Below-grade mat or foundation slab with perimeter walls. Supports thick mats (>36 in) typical of high-rise towers. |
| **Elevator Pit / Pile Cap** | Pile cap below grade with elevator pit walls above. Captures pile penetration boot/flashing cost — the highest-risk membrane condition in South Florida. |
| **Elevator Pit** | Standalone below-grade pit with slab and walls. Supports multiple pits and sump allowance. |

---

## What the Calculator Models

### Penetron (Step 2)
- Admixture cost: `volume (CY) × $/CY`
- Construction joint treatment: `CJ linear footage × Penebar $/LF`
- No penetration or pile detailing cost — crystalline handles these conditions integrally

### Membrane (Step 3)
- **Base cost**: `waterproofed SF × (material + labor $/SF) + inspection`
- **High-risk detailing adders** (the hidden cost membrane estimates miss):
  - Construction joint waterproofing: `CJ LF × $/LF` (typically 3–5× more expensive than Penebar)
  - Penetration detailing: `count × $/each`
  - Pile boot / flashing: `pile count × $/pile` (Elevator Pit / Pile Cap type only)
  - Remediation risk allowance: fixed $

### Schedule & True Total Cost
- `Critical path days × $/day` monetizes schedule difference
- True Total = direct cost + schedule cost
- Penetron typically adds 0 critical path days (admixture goes in the ready-mix truck)

---

## Formulas

**Hydrostatic Slab**
```
Concrete CY  = (L × W × T_slab/12)/27  +  (2(L+W) × H_wall × T_wall/12)/27
Waterproofed SF = L×W  +  2(L+W) × H_wall
```

**Elevator Pit / Pile Cap**
```
Concrete CY  = (capL × capW × capT / 27 × qty)
             + (perimeter × pitWallH × 10in/12 / 27 × qty)
Waterproofed SF = capL × capW × qty
               + (cap sides × capT × qty  if selected)
               + perimeter × pitWallH × qty
Pile count   = pilesPerCap × qty  →  drives pile boot/flashing cost
```

**Elevator Pit**
```
Concrete CY  = (2(L+W) × depth × T_wall/12  +  L×W × T_slab/12) / 27 × qty
Waterproofed SF = L×W × qty  +  2(L+W) × depth × sumpFactor × qty
sumpFactor   = 1.25 if sump pit included, else 1.0
```

---

## Assumptions & Limitations

- Elevator pit / pile cap pit walls assume 10-inch wall thickness for concrete volume
- All outputs are estimating-level accuracy (±20–30%) — not for bid or contract use
- Does not model underslab drainage, dewatering, or OSHA confined space premiums
- Does not model mud slab or working slab below mat
- Schedule inputs are manual — the tool does not auto-estimate installation duration
- Penetron representative should review dosage and system configuration for each project

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | HTML structure only |
| `styles.css` | All styling — Penetron brand palette (navy `#1A4B8C`, orange `#F5901E`) |
| `app.js` | All calculator logic — `calcDerived()` and `compute()` |

---

## Target Users

General contractors and preconstruction managers evaluating waterproofing system selection for below-grade concrete in hydrostatic conditions. Intended for early preconstruction conversations, not final bid preparation.

---

## Contact

Penetron: technicalsupport@penetron.com | (631) 941-9700 | www.penetron.com
