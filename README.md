# Tri-OP Management System

A working front-end build of the **Tri-OP Management System** for Triconna Real Estate, built to the developer brief *TRC-OPS-SPEC-001 v0.3*. Every one of the fourteen modules in Section 5 is a live, clickable, role-aware screen with real business rules behind it. The look follows the Triconna brand colours in Section 9 and the layout language of the reference dashboard (dark icon rail, soft rounded cards, capsule meters, pill bar charts, lime accent).

## Run it

No build step and no dependencies. Either:

```bash
# open the file directly
open index.html

# or serve it (needed for the PWA install prompt and service worker)
python3 -m http.server 8080      # then visit http://localhost:8080
```

On the sign-in screen pick a demo account. Executive, Finance, HR and Admin roles ask for a two-factor code: **123456**. "Reset demo data" on the sign-in screen restores the original data.

> **Prototype boundary.** Data lives in the browser (`localStorage`) so every workflow can be exercised without a server. Tri-Pay, the SMS/email gateways and the Open API are simulated behind the same seams the brief defines (see *What is simulated*). Nothing here replaces the backend, hosting, penetration test or Helvetica Neue web licence the brief requires.

## Demo accounts

| Role | Account | What to try |
|---|---|---|
| Group Executive | Chinedu Eze (MD) | Executive dashboard, multi-company switch, group consolidation, period reopen |
| Company Executive | Ifeoma Nwosu (COO) | Final approvals, read-everything |
| Head of Department | Amina Yusuf (Operations Director) | Approves commissions, transfers, restructures, revocations |
| Head of Department | Segun Adeyemi (Sales), Kemi Balogun (Realtors Development, TARP Admin), Halima Sani (CX) | Department dashboards, report review, induction |
| Finance Officer | Ngozi Obi, Emeka Okafor | Confirm payments, second-officer rule, ledger, period close |
| HR Officer | Funke Ajayi | Staff records, vault, leave, announcements, exit control |
| Staff | Bayo Ogunleye (Sales), Ikenna Uche (CX), Dayo Salami (Operations) | Personal dashboard, clock in, tasks, leave, chat |
| Super Admin | Tunde Bakare | Users, roles, rules, integrations, data admin (no business approvals) |
| Auditor | Peter Idowu | Read-only, audit log, exports |

Public pages (no login): `#/f/form-a` (realtor Form A), `#/f/lead` (website lead form), `#/verify/<code>` (document verification from the QR code).

## The core workflow (Section 7)

Lead → site inspection → plot reserved (timed hold) → sale and plan set → plan published to Tri-Pay → client pays and uploads proof (Tri-Pay sandbox: *Finance → Tri-Pay → Simulate client payment*) → **Finance confirms** (*Finance → Confirm payments*) → receipt with QR code issued, payment posted to the ledger, plot allocated, commission calculated → fully paid → documentation tracked → documented.

Nothing counts as paid until Finance confirms it. Whoever records a payment can never confirm it. Payments at or above the configured threshold (default ₦5,000,000) need two different officers.

## Module map

| Brief | Where | Notes |
|---|---|---|
| 5.1 Inventory (INV-01–09) | Property inventory | Estate → block → plot, colour grid, status lifecycle with log, timed reservations that auto-expire, double-allocation guard, Tri-Pay-synced prices and plans (old sales keep their price), branded offer/allocation letters, title documentation tracker, site inspections with calendar. Survey plans can be uploaded and plots placed on them as live status markers (the Phase 3 interactive map). |
| 5.2 Sales and CRM (CRM-01–09) | Sales and CRM | Pipeline board (drag, lost-reason rule), leads (manual, web form, CSV import, realtor submission with protection window), duplicate detection, assignment rules, client 360, interaction log, lead→sale in one step, transfer/restructure/revocation via approvals, targets vs actuals, daily call list. |
| 5.3 Finance and accounting (FIN-01–11, ACC-01–08) | Finance, Accounting | Payment confirmation workspace, offline payments with second-officer approval, auto-posting to a double-entry ledger, invoices with sequential numbers, aged collections with escalation, commissions with Operations Director approval and monthly reconciliation, expense requisitions by amount, budgets, reports with PDF/Excel/CSV export, chart of accounts, manual journals with approval, payables, bank statement import and suggested matches, TB / P&L / balance sheet / cash flow, group consolidation, period close and lock, VAT/WHT, fixed assets and depreciation, payroll journal. Financial year 1 July – 30 June. |
| 5.4 Realtors (RLT-01–11) | Realtors (TARP) | Online Form A with source rules (referral code → Consultant campaign → company), locked source with approved correction, pipeline board/list, onboarding checklist, events with invitations/attendance/reminders, induction (Form C → Tri-Pay), stall follow-up tasks, bulk messaging, network view, realtor leads, source/campaign/cost-per-recruit reports, Consultant statements. |
| 5.5 HR (HR-01–10) | HR and admin | Records with restricted salary/ID/disciplinary data, document vault with expiry alerts, leave with balances and team calendar, org chart from reporting lines, onboarding/offboarding checklists as tasks, clock in/out with Office/Remote/Field and 8:30 lateness, corrections via line manager, attendance reports, biometric import, payroll export, exit access control, announcements with read receipts. |
| 5.6 Tasks and productivity (OPS-01–15) | Tasks and projects, My work, Facility requests | Projects with milestones and templates, tasks (subtasks, checklists, @mentions, attachments, history), list/board/calendar/Gantt views with dependencies, recurring tasks, reminders and escalation, timers and weekly timesheets, workload, issues, reports, tasks linked to any record, site-works budgets and photos. |
| 5.7 Customer experience (CX-01–05) | Customer experience | Tickets with category/priority/owner, SLA timers with automatic escalation, links to client 360 and plot, CSAT/NPS, milestone notifications. |
| 5.8 Performance (PRF-01–04) | Performance | KPI library with automatic sources, traffic-light individual and department scorecards, appraisal cycles, underperformance alerts to line managers. |
| 5.9 Departmental reporting (RPT-01–04) | Department reports | Weekly/monthly/annual forms, figures pre-filled from system data, submit → review → accept/return with deadline tracking, executive weekly digest. |
| 5.10 Dashboards (DSH-01–05) | Dashboard | Executive, department and personal dashboards; figures click through; exports from every table. |
| 5.11 Platform (PLT-01–08) | Approvals, Admin console | Multi-step approvals by type and amount with delegation, notifications (in-app/email/SMS; critical cannot be switched off), QR-verified document generation, global search page with filters, scheduled report emails, admin console, data administration (import/export, integrity checks, recycle bin, record merge), append-only audit log, multi-company with per-company settings. |
| 5.12 Team chat (CHAT-01–10) | Team chat | Channels (department channels created from the org chart), DMs, threads, @mentions, reactions, edit/delete, file and image sharing, search, announcements channel, presence from clock-in, do-not-disturb, share records, message→task, admin export/retention, Slack import, Google Meet link. |
| 5.13 Learning (LND-01–10) | Learning | Programmes, training calendar, assignments with grading, timed auto-marked online tests with random draws from a question bank, paper exam scores, continuous assessment with weights, my learning, reading list, reports, certificates with QR, CAVE/CIDA import. |
| 8.3 Migration | Admin → Data administration | Land Allocation and Client Payment Tracker importers apply the brief's clean-up rules (multi-plot cells split, text amounts/dates converted, `p:` phone prefix stripped, one opening payment per plan) and produce a reconciliation report. |

## Brand and UI (Section 9)

Ever Green `#001F10` rail and dark surfaces, Forest Green `#008C38` primary actions/links/success, Deep Forest `#003D20` hover, Tea Green `#CBFFB5` highlights, Honeydew `#EDFFEA` section backgrounds, Porcelain `#FCFFFC` app background, Carbon Black `#1A1E16` text, Harvest Orange `#F27718` warnings/overdue, Lawn Green `#8FEB0F` as the single chart accent. A functional red (`#C62828`) is used only for errors, pending Triconna's approval as the brief asks. No decorative gradients, Regular and Medium weights only, sentence case, numbers right-aligned in tables, plain-verb microcopy, collapsible rail with a bottom navigation bar on phones, one outline icon set, installable as a PWA.

Two deliberate calls: cards and pills use larger radii than the 8px in the brief to match the reference dashboard (change `--r-card` / `--r` in `assets/css/app.css` to tighten them), and the font stack is `"Helvetica Neue", Helvetica, Arial` because the Helvetica Neue web licence is a separate purchase.

## What is simulated

- **Tri-Pay**: payments, receipts and webhooks run through a sandbox with signed, idempotent webhook records and a daily reconciliation view. Replace `tripaySend` and `recordPayment` in `assets/js/engine.js` with the real contract once it is signed off.
- **Email, SMS, push**: written to an outbox visible in *Admin → Integrations*.
- **Open API**: the contract is documented and downloadable as OpenAPI from *Admin → Integrations*; there is no server behind it in this build.
- **Office clock-in verification**: the check is a declaration here. Production should verify the office network/IP (`officeIp` setting) or location on the server.
- **Biometric devices, WhatsApp, Google Drive**: shown as Phase 2/3 integration cards; the biometric log import works.

## Project layout

```
index.html                  entry point
assets/css/app.css          brand tokens and all styles
assets/js/core.js           utilities, data store, roles/permissions, audit, notifications
assets/js/components.js     icons, tables (search, filters, saved views, bulk, export), forms, overlays, charts, calendar
assets/js/engine.js         ledger, inventory rules, sales and schedules, payments, approvals engine, jobs, documents, KPIs
assets/js/seed.js           demo data, built through the same engine so the books balance
assets/js/app.js            shell, router, sign-in, public pages, search, notifications
assets/js/pages/*.js        one file per module
sw.js, manifest.webmanifest PWA
```

Scheduled behaviour (reservation expiry, stale-lead reassignment, realtor stall tasks, overdue escalation, collections follow-ups, SLA breaches, missed clock-outs, expiry alerts, reminders) runs on load and every minute through `Jobs.run()`.
