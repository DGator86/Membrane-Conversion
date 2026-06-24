# Penetron Warranty Portal — New Chat Starter Prompt

Paste everything below this line into your new Claude Code chat.

---

Build a **Penetron warranty portal** — a web app where customers (GCs and their teams) can register a project, upload documents, and track their progress through the warranty process step by step with minimal intervention from Penetron staff.

---

## BUSINESS CONTEXT

Penetron is a crystalline concrete waterproofing company. Their admixture product is added to concrete at the batch plant. After construction, GCs can apply for a Penetron warranty. There are two tracks:

- **5-Year Standard** — no fee, 7-step process
- **Extended (10/15/20-Year)** — paid warranty, 8-step process, more documentation required

**Warranty pricing:**
- 5-Year: Free
- 10-Year: $10/CY, minimum $5,000
- 15-Year: $20/CY, minimum $10,000
- 20-Year: $30/CY, minimum $15,000

---

## 5-YEAR WARRANTY PROCESS (7 steps)

1. **Initiate** — Submit warranty request, confirm 5-Year Standard type, provide estimated treated CY, submit GC contact info and project stakeholders
2. **Preconstruction** — Submit project drawings, submit mix design for review, confirm dosage and waterproofing details, review construction joints, pre-construction meeting if required
3. **Prior to First Pour** — Confirm warranty request is active before placement, confirm approved mix design with batch plant, confirm treated placement areas with concrete sub
4. **Concrete Placement** — Verify Penetron Admix added and dosage confirmed, verify placement areas per drawings, collect batch tickets for every treated pour (required), log pour dates and locations
5. **Curing & Protection** — Maintain moisture curing 5 days minimum, protect surface from rapid drying and freezing
6. **Repairs / Remediation** *(if required — optional step)* — Document repair location and issue, collect before/during/after photos, document repair products and procedure
7. **Closeout & Warranty Issuance** — Submit final warranty request, submit all batch tickets, confirm final treated CY. No invoice — 5-Year Standard has no warranty fee. Warranty issued by Penetron.

---

## EXTENDED WARRANTY PROCESS (8 steps — applies to 10, 15, and 20-Year)

1. **Initiate** — Submit warranty request, confirm Extended type and duration, provide estimated treated CY, submit GC contact info and all project stakeholders
2. **Preconstruction** — Submit project drawings (Penetron system locations must be identified on drawings — required), submit mix design for review (required), confirm dosage and waterproofing details, review construction joints, pre-construction meeting (required), review Penebar locations
3. **Prior to First Pour** — Confirm warranty request is active, confirm approved mix design with batch plant, confirm treated placement areas with concrete sub, pre-pour meeting (required)
4. **Concrete Placement** — Verify Penetron Admix added and dosage confirmed, verify placement areas per drawings, collect batch tickets for every treated pour (required), log pour dates and locations, site photos (required), document Penebar/joint installation
5. **Curing & Protection** — Maintain moisture curing 5 days minimum, protect from rapid drying and freezing, document cure method (required)
6. **Repairs / Remediation** *(if required — optional step)* — Document repair location and issue, collect before/during/after photos, document repair products and procedure. Penetron products must be used for all repairs — third-party repair products void the warranty.
7. **Inspections & Testing** — Complete site inspections as required, complete leak testing if applicable, submit inspection/leak test reports (required), correct deficiencies and complete final review
8. **Closeout & Warranty Issuance** — Submit final warranty request, submit all batch tickets, confirm final treated CY, submit inspection/leak test documentation, submit repair/remediation documentation if applicable, pay warranty invoice (required for Extended). Warranty issued by Penetron.

---

## REQUIREMENTS

- Customers register with email and project info (project name, address, GC company, contact name)
- Each project tracks which warranty tier they selected (5/10/15/20-Year)
- The portal shows the correct step list for their tier and lets them check off completed steps
- Each step that requires documents lets them upload files (PDFs, photos)
- Penetron staff can log in to a separate admin view to see all projects and their status
- Email notifications when a customer completes a step or uploads a document
- Customers can only see their own projects
- Mobile-friendly — GCs will use this on a job site

## BRANDING

- Orange: `#F5901E`
- Navy: `#1A4B8C`
- Dark Navy: `#0D2F5E`
- I have a white logo PNG I can upload once the project is started

## PREFERRED STACK

Supabase (auth + storage + database) + Next.js + Vercel deployment
