# Screen design checklist: where each screen is built

Maps every line of the *Tri-OP Screen Design Checklist* (167 lines) to a route in the app. Routes are written as the address after `#`. P2 and P3 items are built too. "Panel" means a side panel or pop-up rather than a full page.

## Global shell and system (11)
| Screen | Where |
|---|---|
| Login | `/login` |
| Two-factor verification | Panel after sign-in for Executive, Finance, HR and Admin (demo code 123456) |
| Password reset | `/reset` (public: email, code, new password) |
| App shell | Rail, top bar with company switcher, search, quick create, notifications, profile |
| Mobile bottom navigation | Bottom bar below 860px |
| Global search results | `/search?q=…` with filters by type; dropdown shows a preview |
| Notifications centre | `/notifications` (All, Unread, Critical) |
| Notification preferences | `/profile/notifications` (type × channel matrix) |
| User profile and settings | `/profile`, `/profile/security` |
| Approvals inbox | `/approvals` |
| System states | `/system` (empty, loading, error, no permission, 404, offline); live 404 and no-access pages |

## Dashboards (17)
| Screen | Where |
|---|---|
| Super Admin | `/dashboard/sys` |
| Group Executive: MD | `/dashboard/md` |
| Group Executive: COO | `/dashboard/coo` |
| Company Executive | `/dashboard/company` |
| HOD template: Sales, Marketing, Operations, Finance, HR, Realtors Development, Customer Experience | `/dashboard/dept` (content changes per department; executives pick a department) |
| Finance Officer | `/dashboard/officer` (Finance role) |
| HR Officer | `/dashboard/officer` (HR role) |
| Staff personal | `/dashboard/me` |
| Auditor view | `/dashboard/audit` |
| Filters and export panel | Executive dashboard (`/dashboard/company`) |
| Scheduled email reports [P2] | `/dashboard/schedules` and Admin → Settings |

## Property inventory (10)
Estates list `/inventory/estates` · Estate detail with phases and blocks `/inventory/estate/<id>` · Plot list `/inventory/plots` · Plot detail with timeline panel · Colour grid on estate page · Reserve plot flow (timed hold) from the plot panel · Document preview `/inventory/letters` · Title tracker [P2] `/inventory/titles` · Inspection calendar [P2] `/inventory/inspections` · Interactive survey-plan map [P3] on the estate page.

## Sales and CRM (12)
Leads list `/crm/leads` · Pipeline Kanban `/crm/pipeline` · New lead form · CSV import · Duplicate warning with merge · Lead detail with lost-reason modal · Client 360 `/crm/client/<id>` · Interaction log · Convert to sale · Lead assignment rules `/crm/rules` · Sales targets `/crm/targets` · Daily call list `/crm/calls`.

## Finance (8)
Confirmation workspace `/finance/confirm` · Record offline payment · Collections `/finance/collections` · Commissions `/finance/commissions` · Invoices `/finance/invoices` · Expenses `/finance/expenses` · Reports `/finance/reports` · Budgets [P2] `/finance/budgets`.

## Accounting (14)
Chart of accounts `/accounting/accounts` · General ledger `/accounting/ledger` · Manual journal with approval `/accounting/journals` · Vendors and bills `/accounting/payables` · Non-property receivables `/accounting/receivables` · Bank accounts, statement import and reconciliation `/accounting/bank` · Financial statements `/accounting/statements/pnl|bs|tb|cf` · Period close `/accounting/periods` · VAT/WHT [P2] `/accounting/tax` · Payroll journal [P2] `/accounting/payroll` · Group consolidation [P3] `/accounting/consol` · Fixed assets [P3] `/accounting/assets`.

## Realtor recruitment (13)
Public Form A `/f/form-a` · Walk-in form · Pipeline board and list `/realtors/pipeline` · Realtor profile with checklist · Campaign setup `/realtors/sources` · Events calendar `/realtors/events` · Form C induction approval (queue above the pipeline) · Source correction approval (Approvals) · Stalled follow-ups (queue above the pipeline) · Network `/realtors/network` · Reports `/realtors/reports` · Bulk messaging [P2] · Consultant statement [P2].

## HR (14)
Directory `/hr/directory` · Add employee · Profile with tabs (details, documents, leave, attendance, training, appraisals) · Leave request · Leave approval (Approvals) · Team leave calendar `/hr/leave` · Org chart `/hr/org` · Onboarding and offboarding `/hr/onboarding` · Clock in/out widget (Dashboard, Attendance) · Attendance log and corrections `/hr/attendance` · Attendance reports (daily and monthly) · Announcements with read receipts `/hr/announcements` · Payroll export [P2] `/hr/payroll` · Exit access control [P3] `/hr/exit`.

## Tasks and operations (18)
Projects `/work/projects` · Project detail `/work/project/<id>` · Project templates `/work/templates` · Task detail panel · List `/work/tasks` · Kanban `/work/board` · Calendar `/work/calendar` · Gantt `/work/gantt` · My Work `/mywork` · Recurring tasks setup `/work/recurring` · Project reports `/work/reports` · Zoho Projects import (button on Projects) · Timesheets [P2] `/work/timesheets` · Workload [P2] `/work/workload` · Issues [P2] `/work/issues` · Estate development projects [P3] `/work/sitedev` · Company asset register [P3] `/work/assets` · Facility requests [P3] `/work/facility`.

## Customer experience (6)
Tickets `/cx/tickets` · Ticket detail with SLA timer · New ticket · SLA settings `/cx/sla` · CSAT/NPS [P2] `/cx/surveys` · Milestone notification templates [P2] `/cx/templates`.

## Performance (6)
KPI library `/performance/kpis` · Target setting `/performance/targets` · Individual scorecard `/performance/scorecards` · Department scorecard `/performance/departments` · Alerts `/performance/alerts` · Appraisal cycle [P3] `/performance/appraisals`.

## Departmental reporting (4)
Report forms `/reports/form/<id>` · Submission register `/reports/submissions` · Review `/reports/review` · Executive digest [P3] `/reports/digest`.

## Team chat (10)
Main view `/chat` · Thread panel · Create channel · Search · Announcements channel · Shared record card · Message to task · Chat admin `/admin/chat` · Slack import [P2] `/admin/data` · Calls with Meet link [P3] (call button in the channel header).

## Learning and development (13)
Programmes list and detail `/learning/programmes` · Training calendar with attendance `/learning/calendar` · Assignment submission and grading `/learning/assignments` · My Learning `/learning/mine` · Assessment builder, test-taking and results [P2] `/learning/assessments`, `/learning/results` · Continuous assessment [P2] and L&D reports [P2] `/learning/reports` · Reading list [P2] `/learning/reading` · CAVE import [P2] · Certificates [P3] `/learning/certs`.

## Admin console (11)
Users `/admin/users` · Roles and permissions matrix `/admin/roles` · Departments `/admin/departments` · Companies `/admin/companies` · Numbering sequences `/admin/numbering` · Document templates `/admin/templates` · Lookup lists `/admin/lookups` · Approval chain builder `/admin/rules` · Integrations `/admin/integrations` · Data admin `/admin/data` · Audit log `/admin/audit`.

## Clickable prototypes (Section 9 gate)
`/admin/flows` lists the eight P1 flows with a live walkthrough of each, a place to record the staff who tested it (five needed), and sign-off. `/admin/design` is the design system shared with Tri-Pay: colours, type, spacing, buttons, pills, meters, fields, charts and the icon set.
