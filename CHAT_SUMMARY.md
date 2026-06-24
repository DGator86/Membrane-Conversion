# Penetron Membrane Conversion Tool — Full Project Summary

## What This Is

A single-page web tool for South Florida high-rise GC and precon teams to compare
Penetron crystalline admixture vs. a traditional hydrostatic membrane waterproofing
system. It calculates costs, schedule impact, and warranty options side by side.

Live at: https://membrane-conversion.vercel.app
Repo: https://github.com/dgator86/membrane-conversion

---

## Tech Stack

- Plain HTML / CSS / JavaScript — no framework, no build step
- Deployed on Vercel from the `main` branch
- No dependencies, no package.json

---

## Branding

- Orange: `#F5901E`
- Navy: `#1A4B8C`
- Dark Navy: `#0D2F5E`
- Logo: `logo_white.png` (white version), `logo_color.png` (color version)
  - Both extracted from official Penetron vector files at 4x zoom

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | All markup — inputs, results panels, warranty tab |
| `styles.css` | All styling including responsive/mobile breakpoints |
| `app.js` | All logic — calculations, rendering, warranty steps |
| `logo_white.png` | White Penetron logo for header |
| `logo_color.png` | Color Penetron logo (available for other uses) |
| `WARRANTY_PORTAL_PROMPT.md` | Starter prompt for the separate warranty portal project |
| `CHAT_SUMMARY.md` | This file |

---

## Tool Structure

### Tabs
- **Cost Analysis** — the main estimator tool
- **Penetron Warranty** — warranty tier selector, cost estimator, and process guide

### Scope Types (Cost Analysis)
Users select one of three scope types:

1. **Mat Slab** — dimension input via L×W or Area & Perimeter toggle
2. **Elevator Pit / Pile Cap** — dimension input via L×W (per cap) or Total SF toggle
3. **Elevator Pit (standalone)** — single pit with monolithic pour toggle

### Key Globals in app.js
- `currentType` — `'slab'`, `'pilecap'`, or `'elevator'`
- `slabDimMode` — `'lw'` or `'perim'`
- `capDimMode` — `'lw'` or `'sf'`
- `sensitivityIdx` — 0 (Conservative), 1 (Balanced), 2 (Aggressive)
- `selectedWarrantyTier` — null, 5, 10, 15, or 20

---

## Cost Analysis Logic

### Geometry (`calcDerived`)
Computes from inputs:
- `cy` — cubic yards of treated concrete
- `bottomSF` — waterproofed bottom area
- `wallSF` — waterproofed wall area
- `cjLF` — construction joint linear feet
- `piles` — pile penetration count
- `penCount` — pipe/conduit penetration count

### Penetron Cost
- Admixture cost = `cy × rate/CY`
- No detailing cost (CJ, penetrations, pile boots all included)
- No critical path days added (`pSched = 0` always)

### Membrane Cost
- Base cost = `bottomSF × $/SF`
- Detailing = CJ cost + penetration cost + pile boot cost + risk allowance
- Schedule days entered by user

### Schedule Acceleration Curve
```
AccelFactor = 1 + (daysSaved / pivot) ^ exponent
```
- Conservative: pivot=25, exponent=1.2
- Balanced: pivot=20, exponent=1.5
- Aggressive: pivot=15, exponent=1.8

`projectAccelValue = schedDaysSaved × cpd × accelFactor` (only when CPD is entered)

### Monolithic Pour Toggle (Elevator Pit only)
When enabled, user enters days saved from pouring pit monolithically vs. staged.
Those days are added to Penetron's schedule advantage and factored into the
acceleration curve value.

### Elevator Pit Void Deduction (Pile Cap mode)
Pit L × Pit W × cap thickness × qty is subtracted from total CY and bottomSF,
with a confirmation note shown below the inputs.

---

## Warranty Tab

### Tiers and Pricing
| Tier | Rate | Minimum |
|------|------|---------|
| 5-Year | Free | — |
| 10-Year | $10/CY | $5,000 |
| 15-Year | $20/CY | $10,000 |
| 20-Year | $30/CY | $15,000 |

CY for warranty cost is synced from the Cost Analysis tab inputs.

### Layout
- **Left panel** — tier selector cards, cost summary, requirements comparison table
- **Right panel** — sticky process guide showing steps for the selected tier

### Requirements Table Behavior
- No tier selected: table shows but no column highlighted
- 5-Year selected: 5-Year column highlighted in Penetron orange
- Any extended tier selected: Extended column highlighted in Penetron orange

### Process Steps
- `STEPS_5` — 7-step array for 5-Year Standard
- `STEPS_EXT` — 8-step array for 10/15/20-Year Extended
- Both defined in `app.js` and rendered dynamically by `renderProcessSteps(yr)`

### 5-Year Process (7 Steps)
1. Initiate
2. Preconstruction
3. Prior to First Pour
4. Concrete Placement — batch tickets required
5. Curing & Protection — 5 days minimum
6. Repairs / Remediation *(optional — if required)*
7. Closeout & Warranty Issuance — no fee

### Extended Process (8 Steps)
1. Initiate
2. Preconstruction — drawings, mix design, pre-con meeting all required
3. Prior to First Pour — pre-pour meeting required
4. Concrete Placement — batch tickets + site photos required
5. Curing & Protection — cure method documentation required
6. Repairs / Remediation *(optional)* — Penetron products required for all repairs; third-party products void warranty
7. Inspections & Testing — inspection/leak test reports required
8. Closeout & Warranty Issuance — invoice payment required

---

## Mobile / Responsive

- Below 1100px: single-column layout (inputs stacked above results)
- Below 900px: KPI row goes 2-column
- Below 600px: financial table stays 3-column but shrinks font/padding (does NOT collapse to 1 column)
- Below 1000px: warranty layout goes single column

---

## Separate Warranty Portal Project

A standalone customer-facing portal is planned as a separate project.
Starter prompt is in `WARRANTY_PORTAL_PROMPT.md`.

Key points:
- Customers register, select warranty tier, upload documents, track steps
- Penetron staff get a separate admin view
- Stack: Supabase + Next.js + Vercel
- Reuse `STEPS_5`, `STEPS_EXT`, and branding from this repo
