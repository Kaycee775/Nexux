'use strict';
/* Demo data for Tri-OP. Built through the same engine functions the app uses, so ledger, plots and schedules stay consistent. */

const COLLS = ['companies', 'users', 'depts', 'employees', 'estates', 'plots', 'leads', 'clients', 'interactions', 'sales', 'payments', 'collections', 'invoices', 'commissions', 'expenses', 'budgets', 'accounts', 'journals', 'vendors', 'bills', 'bankAccts', 'bankTxns', 'assets', 'periods', 'taxes', 'realtors', 'campaigns', 'events', 'tasks', 'projects', 'issues', 'timelogs', 'timesheets', 'tickets', 'kpis', 'kpiVals', 'appraisals', 'reports', 'channels', 'messages', 'programmes', 'sessions', 'assignments', 'submissions', 'assessments', 'attempts', 'certs', 'leaves', 'attendance', 'announcements', 'acks', 'approvals', 'notifications', 'docsLog', 'inspections', 'vault', 'exitslips', 'exceptions', 'outbox', 'webhooks', 'targets', 'rules', 'templates', 'lookups', 'readings', 'savedviews', 'schedules', 'surveys', 'facilityreqs', 'msgtpl', 'audit'];

const COA = [
  ['1010', 'Bank – Main account', 'asset'], ['1020', 'Cash on hand', 'asset'], ['1100', 'Receivables – property sales', 'asset'], ['1150', 'Receivables – other income', 'asset'], ['1200', 'Prepayments and deposits', 'asset'], ['1500', 'Fixed assets – cost', 'asset'], ['1590', 'Accumulated depreciation', 'asset'],
  ['2000', 'Accounts payable', 'liability'], ['2100', 'Commissions payable', 'liability'], ['2200', 'Accrued expenses', 'liability'], ['2300', 'VAT payable', 'liability'], ['2310', 'WHT payable', 'liability'], ['2400', 'Payroll liabilities', 'liability'],
  ['3000', 'Share capital', 'equity'], ['3100', 'Retained earnings', 'equity'],
  ['4000', 'Land sales revenue', 'income'], ['4100', 'Service and facility income', 'income'], ['4200', 'Other income', 'income'],
  ['5000', 'Land development and site works', 'expense'], ['5100', 'Sales commissions', 'expense'], ['5200', 'Salaries and wages', 'expense'], ['5300', 'Marketing and advertising', 'expense'], ['5400', 'Rent and utilities', 'expense'], ['5500', 'Office and admin', 'expense'], ['5600', 'Travel and logistics', 'expense'], ['5700', 'Professional fees', 'expense'], ['5800', 'Training and development', 'expense'], ['5900', 'Depreciation', 'expense'], ['5950', 'Bank charges', 'expense']
];

const Seed = {
  build() {
    const rnd = (() => { let a = 20261018; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
    const pick = a => a[Math.floor(rnd() * a.length)], ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), chance = p => rnd() < p;
    DB.d = { v: 1, rev: 0 }; COLLS.forEach(c => DB.d[c] = []); DB.d.seq = {}; DB.d.settings = {}; DB.quiet = true; DB.rev = 0;
    const t0 = today(), now = Date.now(), dAgo = n => addDays(t0, -n), tsAgo = (n, h = 10) => now - n * 864e5 - (24 - h) * 36e5 * 0;
    const saved = { uid: SESS.uid, co: CO }; SESS.uid = null;

    /* companies */
    DB.d.companies = [
      { id: 'tre', name: 'Triconna Real Estate', short: 'TRE', address: 'Plot 12, Admiralty Way, Lekki Phase 1, Lagos', fyStart: '07-01', currency: 'NGN' },
      { id: 'tfm', name: 'Triconna Facilities Management', short: 'TFM', address: '4 Adeola Odeku Street, Victoria Island, Lagos', fyStart: '07-01', currency: 'NGN' }
    ];
    DB.d.roles = Object.keys(ROLES).map(k => ({ id: k, ...ROLES[k] }));

    /* users */
    const U = (id, name, role, dept, title, extra = {}) => ({ id, name, role, dept, title, email: name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.') + '@triconna.example', phone: '080' + ri(10000000, 99999999), co: ['tre'], flags: [], prefs: { email: true, sms: false, app: true }, ...extra });
    DB.d.users = [
      U('u_admin', 'Tunde Bakare', 'superadmin', 'IT', 'System Administrator', { co: ['tre', 'tfm'], manager: 'u_coo' }),
      U('u_md', 'Chinedu Eze', 'groupexec', 'Management', 'Managing Director', { co: ['tre', 'tfm'] }),
      U('u_coo', 'Ifeoma Nwosu', 'groupexec', 'Management', 'Chief Operating Officer', { manager: 'u_md', co: ['tre', 'tfm'] }),
      U('u_cexec', 'Bisola Akande', 'companyexec', 'Management', 'Company Managing Director', { manager: 'u_md' }),
      U('u_ops', 'Amina Yusuf', 'hod', 'Operations', 'Operations Director', { manager: 'u_coo', flags: ['opsdirector'] }),
      U('u_sales', 'Segun Adeyemi', 'hod', 'Sales', 'Head of Sales', { manager: 'u_coo' }),
      U('u_mkt', 'Tola Martins', 'hod', 'Marketing', 'Head of Marketing', { manager: 'u_coo' }),
      U('u_rd', 'Kemi Balogun', 'hod', 'Realtors Development', 'Realtors Development Manager', { manager: 'u_coo', flags: ['tarpadmin', 'rlt.write', 'rlt.campaign'] }),
      U('u_cxh', 'Halima Sani', 'hod', 'Customer Experience', 'Customer Experience Lead', { manager: 'u_coo' }),
      U('u_fin2', 'Emeka Okafor', 'finance', 'Finance', 'Head of Finance', { manager: 'u_coo' }),
      U('u_fin1', 'Ngozi Obi', 'finance', 'Finance', 'Finance Officer', { manager: 'u_fin2' }),
      U('u_fin3', 'Musa Garba', 'finance', 'Finance', 'Accounts Officer', { manager: 'u_fin2' }),
      U('u_hr', 'Funke Ajayi', 'hr', 'HR', 'HR Officer', { manager: 'u_coo' }),
      U('u_s1', 'Bayo Ogunleye', 'staff', 'Sales', 'Sales Officer', { manager: 'u_sales' }),
      U('u_s2', 'Zainab Lawal', 'staff', 'Sales', 'Sales Officer', { manager: 'u_sales' }),
      U('u_s3', 'Obinna Nnamdi', 'staff', 'Sales', 'Sales Officer', { manager: 'u_sales' }),
      U('u_s4', 'Rita Ekong', 'staff', 'Sales', 'Sales Officer', { manager: 'u_sales' }),
      U('u_op1', 'Dayo Salami', 'staff', 'Operations', 'Site Officer', { manager: 'u_ops' }),
      U('u_op2', 'Uche Anene', 'staff', 'Operations', 'Documentation Officer', { manager: 'u_ops' }),
      U('u_cx1', 'Ikenna Uche', 'staff', 'Customer Experience', 'Customer Experience Officer', { manager: 'u_cxh' }),
      U('u_cx2', 'Blessing Okon', 'staff', 'Customer Experience', 'Customer Experience Officer', { manager: 'u_cxh' }),
      U('u_mk1', 'Chioma Ibe', 'staff', 'Marketing', 'Marketing Executive', { manager: 'u_mkt' }),
      U('u_rd1', 'Tosin Bello', 'staff', 'Realtors Development', 'Realtors Development Officer', { manager: 'u_rd', flags: ['tarpadmin'] }),
      U('u_rd2', 'Gift Amadi', 'staff', 'Realtors Development', 'Realtors Development Officer', { manager: 'u_rd' }),
      U('u_aud', 'Peter Idowu', 'auditor', 'Audit', 'External Auditor', { manager: null }),
      U('u_f1', 'Sade Fashola', 'staff', 'Facilities', 'Facilities Coordinator', { co: ['tfm'], manager: 'u_md' })
    ];
    DB.d.users.find(u => u.id === 'u_ops').deleg = null;

    /* per-company base: depts, settings, accounts, periods, rules, templates */
    const baseCompany = seedCompanyBase;
    DB.d.companies.forEach(c => baseCompany(c.id));
    CO = 'tre';

    /* employees */
    const EMP_START = ['2019-03-11', '2020-02-03', '2021-06-14', '2021-09-01', '2022-01-17', '2022-08-22', '2023-02-06', '2023-07-10', '2024-01-15', '2024-05-20', '2025-01-13', '2025-06-02'];
    DB.d.users.forEach(u => { if (u.id === 'u_aud' || u.id === 'u_admin' && false) return; u.co.forEach(co => { CO = co; DB.add('employees', { userId: u.id, name: u.name, dept: u.dept, title: u.title, grade: u.role === 'staff' ? 'G' + ri(3, 6) : 'G' + ri(7, 9), manager: u.manager || null, start: pick(EMP_START), phone: u.phone, email: u.email, nin: '2' + ri(1000000000, 9999999999), salary: u.role === 'staff' ? ri(15, 45) * 10000 : ri(60, 180) * 10000, status: 'Active', emergency: { name: pick(['Mrs. Adaobi', 'Mr. Yinka', 'Mrs. Hadiza']) + ' ' + u.name.split(' ')[1], phone: '0803' + ri(1000000, 9999999), rel: pick(['Spouse', 'Parent', 'Sibling']) }, leaveAllow: 20, leaveTaken: ri(0, 8), disciplinary: [] }, { quiet: true }); }); });
    CO = 'tre';

    /* estates & plots */
    const ESTATES = [
      ['Achievers Estate', 'Ibeju-Lekki, Lagos', 'C of O', [[450, 6500000], [600, 8200000]], 24], ['Lisbon II', 'Epe, Lagos', "Governor's Consent", [[300, 3600000], [450, 5200000]], 28], ['Lisbon III', 'Epe, Lagos', "Governor's Consent", [[300, 3900000], [450, 5600000]], 20],
      ['Sky View', 'Ikorodu, Lagos', 'Deed of Assignment', [[300, 2800000], [450, 4100000]], 24], ['Swiss Garden', 'Sagamu, Ogun', 'Deed of Assignment', [[500, 3200000], [600, 3900000]], 20], ['Pearl Haven Phase 1', 'Ibeju-Lekki, Lagos', 'C of O', [[500, 9500000], [600, 11000000]], 20],
      ['Pearl Haven Phase 2', 'Ibeju-Lekki, Lagos', 'C of O', [[500, 10200000], [600, 11800000]], 16], ['Velcrest', 'Abeokuta, Ogun', "Governor's Consent", [[450, 2900000], [600, 3700000]], 24], ['Urban Green', 'Lekki, Lagos', 'C of O', [[300, 12500000], [450, 17800000]], 16]
    ];
    const planSet = () => [{ id: 'pl_out', name: 'Outright', months: 0, depositPct: 100, uplift: 0 }, { id: 'pl_3', name: '3 months', months: 3, depositPct: 50, uplift: 3 }, { id: 'pl_6', name: '6 months', months: 6, depositPct: 40, uplift: 6 }, { id: 'pl_12', name: '12 months', months: 12, depositPct: 30, uplift: 10 }];
    ESTATES.forEach(([name, location, titleType, sizes, n]) => {
      const e = DB.add('estates', { name, location, titleType, sizes: sizes.map(([sqm, price]) => ({ sqm, price })), plans: planSet(), blocks: ['A', 'B', 'C', 'D'].slice(0, Math.ceil(n / 8)), phase: name.includes('Phase') ? name.split(' ').pop() : '', status: 'Selling', desc: '' }, { quiet: true });
      for (let i = 1; i <= n; i++) { const sz = sizes[i % 2]; DB.add('plots', { estate: e.id, block: e.blocks[Math.floor((i - 1) / 8)], no: String(i), sqm: sz[0], price: sz[1], status: 'available', survey: 'SV/' + ri(2021, 2025) + '/' + ri(100, 999), log: [], docs: null }, { quiet: true }); }
    });

    /* campaigns & realtors */
    const CAMP = [['Realtor Recruitment Q3 – Instagram', 'Instagram', 'consultant', 'Mr. Kayode Adewale (Consultant)', 250000], ['Join TARP – Facebook Leads', 'Facebook', 'consultant', 'Mrs. Ronke Dada (Consultant)', 180000], ['Triconna Radio Spot', 'Radio', 'brand', '', 600000], ['Billboard – Lekki Toll', 'Billboard', 'brand', '', 900000]];
    CAMP.forEach(([name, platform, kind, consultant, budget], i) => DB.add('campaigns', { name, platform, kind, consultant, budget, start: dAgo(90 - i * 10), end: dAgo(-20 + i * 5), code: 'CMP' + (101 + i), spend: Math.round(budget * (0.4 + rnd() * 0.5)) }, { quiet: true }));
    const campIds = DB.q('campaigns').map(c => c.id);
    const FN = ['Adaeze', 'Chukwuemeka', 'Folake', 'Ibrahim', 'Amaka', 'Yetunde', 'Ifeanyi', 'Hauwa', 'Kolawole', 'Nkechi', 'Babatunde', 'Funmilayo', 'Aisha', 'Olumide', 'Chiamaka', 'Garba', 'Titilayo', 'Uchenna', 'Rasheed', 'Bukola', 'Obiora', 'Sade', 'Danjuma', 'Ebele', 'Femi', 'Lola', 'Ahmed', 'Nneka', 'Wale', 'Hadiza', 'Kunle', 'Ronke', 'Ikechukwu', 'Bisi', 'Musa', 'Chidi', 'Temitope', 'Abiola', 'Yusuf', 'Ngozi'];
    const SN = ['Okonkwo', 'Adeyemi', 'Bello', 'Eze', 'Ogunleye', 'Nwosu', 'Abubakar', 'Balogun', 'Okafor', 'Ibrahim', 'Adebayo', 'Chukwu', 'Lawal', 'Afolabi', 'Onyeama', 'Salami', 'Akinola', 'Obi', 'Danjuma', 'Okoro', 'Fashola', 'Ojo', 'Umeh', 'Yakubu', 'Alade'];
    const used = new Set(); const fullName = () => { let n; do { n = pick(FN) + ' ' + pick(SN); } while (used.has(n)); used.add(n); return n; };
    const phone = () => pick(['0803', '0805', '0806', '0810', '0813', '0816', '0902', '0703', '0706']) + ri(1000000, 9999999);
    const STAGES = ['Entry registered', 'Onboarding in progress', 'Ready for induction', 'Inducted (Associate)', 'Maverick', 'Inactive', 'Exited'];
    const stageList = [].concat(Array(5).fill(0), Array(6).fill(1), Array(3).fill(2), Array(9).fill(3), Array(3).fill(4), [5, 6]);
    const CK = ['formB', 'physical', 'cbt', 'tour', 'formC', 'docs'];
    stageList.forEach((si, i) => {
      const stage = STAGES[si]; const name = fullName(); const done = si === 0 ? 0 : si === 1 ? ri(1, 4) : 6; const chk = {}; CK.forEach((k, j) => chk[k] = j < done || si >= 3 ? { done: true, date: dAgo(ri(20, 120)) } : { done: false });
      const inducted = si >= 3 && si <= 5; const sources = ['Referral', 'Ads: Consultant campaign', 'Ads: Triconna brand', 'Walk-in', 'Organic']; const src = pick(sources);
      DB.add('realtors', { name, phone: phone(), email: name.toLowerCase().replace(' ', '.') + '@mail.example', stage, source: src, sourceRef: '', sourceNote: '', batch: 'B' + ri(1, 4) + '-2026', created: now - ri(10, 200) * 864e5, lastActivity: now - ri(0, si < 3 ? 25 : 5) * 864e5, checklist: chk, level: si >= 4 ? 'Maverick' : (inducted ? 'Associate' : ''), code: inducted ? 'TARP' + ri(1000, 9999) : '', upline: '', registeredBy: pick(['u_rd', 'u_rd1', 'u_rd2']), formA: true }, { quiet: true });
    });
    const rl = DB.q('realtors'); const assoc = rl.filter(r => ['Associate', 'Maverick'].includes(r.level));
    rl.forEach(r => { if (r.source === 'Referral') { const up = pick(assoc.filter(a => a.id !== r.id)); r.sourceRef = up.id; r.upline = up.id; } else if (r.source === 'Ads: Consultant campaign') r.sourceRef = campIds[ri(0, 1)]; else if (r.source === 'Ads: Triconna brand') r.sourceRef = campIds[ri(2, 3)]; else if (r.source === 'Walk-in') r.sourceRef = pick(['u_rd1', 'u_rd2']); });

    /* clients */
    for (let i = 0; i < 44; i++) { const name = fullName(); DB.add('clients', { name, phone: phone(), email: name.toLowerCase().replace(' ', '.') + '@mail.example', address: ri(1, 60) + ' ' + pick(['Allen Avenue', 'Adetokunbo Ademola Street', 'Awolowo Road', 'Herbert Macaulay Way', 'Opebi Road', 'Admiralty Way']) + ', ' + pick(['Ikeja', 'Lekki', 'Yaba', 'Surulere', 'Victoria Island', 'Abuja', 'Port Harcourt']), kyc: [{ name: 'ID card', ok: chance(.9) }, { name: 'Proof of address', ok: chance(.8) }, { name: 'Passport photo', ok: chance(.85) }], officer: pick(['u_s1', 'u_s2', 'u_s3', 'u_s4']), source: pick(['Referral', 'Walk-in', 'Website', 'Instagram', 'Radio', 'Billboard']), created: now - ri(20, 330) * 864e5, notes: '' }, { quiet: true }); }
    const clients = DB.q('clients');

    /* sales and payments */
    const officers = ['u_s1', 'u_s2', 'u_s3', 'u_s4']; const inducted = assoc.map(a => a.id);
    const sizeOrder = DB.q('estates'); let ci = 0;
    for (let i = 0; i < 46; i++) {
      const est = sizeOrder[i % sizeOrder.length]; const free = DB.q('plots').filter(p => p.estate === est.id && p.status === 'available'); if (free.length < 3) continue;
      const nPlots = chance(.15) ? 2 : 1; const plots = free.slice(ri(0, Math.max(0, free.length - 3)), undefined).slice(0, nPlots); const client = clients[ci++ % clients.length];
      const age = i < 34 ? ri(30, 300) : ri(1, 12); const plan = pick(i % 5 === 0 ? [est.plans[0]] : est.plans.slice(1)); const date = dAgo(age);
      try {
        const sale = createSale({ clientId: client.id, plotIds: plots.map(p => p.id), planId: plan.id, officer: pick(officers), realtorId: chance(.6) ? pick(inducted) : '', date, estateId: est.id });
        DB.set('sales', sale.id, { created: now - age * 864e5 }, { quiet: true });
        DB.q('journals').filter(j => j.ref === sale.id).forEach(j => DB.set('journals', j.id, { created: now - age * 864e5 }, { quiet: true }));
        const fresh = DB.get('sales', sale.id);
        fresh.schedule.forEach(row => {
          if (row.due > t0) return; const skip = row.no === 0 ? (age < 6 && chance(.4)) : chance(i % 7 === 3 ? .75 : .1); if (skip) return;
          const payDate = addDays(row.due, ri(0, 3)); if (payDate > t0) return;
          SESS.uid = null; const p = recordPayment({ saleId: sale.id, amount: row.amount, method: pick(['Bank transfer', 'Bank transfer', 'Card', 'Bank transfer']), channel: 'tripay', date: payDate, ref: 'TRF' + ri(10000000, 99999999), proofName: 'proof.jpg' });
          confirmSeed(p.id, payDate);
        });
      } catch (e) { /* skip */ }
    }
    function confirmSeed(id, payDate) {
      const p0 = DB.get('payments', id); const conf = []; SESS.uid = 'u_fin1'; try { const r = confirmPayment(id); if (r === 'first') { SESS.uid = 'u_fin2'; confirmPayment(id); } } catch (e) { console.warn(e.message); } SESS.uid = null;
      const ts = new Date(payDate + 'T09:00:00').getTime() + ri(5, 90) * 60000; DB.set('payments', id, { ts, confirmedAt: ts + ri(2, 9) * 60000 }, { quiet: true });
    }
    /* statuses: a few revoked, withheld, documented */
    const completed = DB.q('sales').filter(s => s.status === 'completed');
    completed.slice(0, 4).forEach((s, i) => s.plotIds.forEach(pid => { const p = DB.get('plots', pid); if (p.status === 'paid') { setPlotStatus(p, 'documented', 'Documents issued'); DB.set('plots', pid, { docs: { survey: { s: 'Issued', date: dAgo(40) }, deed: { s: 'Issued', date: dAgo(25) }, cofo: { s: i % 2 ? 'Issued' : 'In progress', date: dAgo(10) } } }, { quiet: true }); } }));
    DB.q('plots').filter(p => p.status === 'paid').forEach((p, i) => DB.set('plots', p.id, { docs: { survey: { s: i % 2 ? 'In progress' : 'Pending', exp: addDays(t0, 14 + i * 3) }, deed: { s: 'Pending', exp: addDays(t0, 30 + i * 3) }, cofo: { s: 'Pending', exp: addDays(t0, 60) } } }, { quiet: true }));
    const avail = () => DB.q('plots').filter(p => p.status === 'available');
    avail().slice(2, 5).forEach(p => setPlotStatus(p, 'withheld', 'Held for management review'));
    const rv = DB.q('sales').find(s => s.status === 'active' && s.paid < s.total / 3); if (rv) { try { APPR.revocation.ok({ ref: rv.id, meta: { refund: Math.round(rv.paid * .8) } }); } catch (e) { } }

    /* pending payments for the confirmation workspace */
    const act = DB.q('sales').filter(s => s.status === 'active' && saleBalance(s) > 300000);
    act.slice(0, 6).forEach((s, i) => { const amt = i === 0 ? Math.min(saleBalance(s), 5400000) : Math.min(saleBalance(s), pick([250000, 400000, 650000, 900000, 1200000])); try { const a = Math.min(Math.round(amt / 1000) * 1000 || amt, saleBalance(s)); const p = recordPayment({ saleId: s.id, amount: a, method: 'Bank transfer', channel: 'tripay', date: t0, ref: 'TRF' + ri(10000000, 99999999), proofName: 'transfer-proof-' + (i + 1) + '.jpg' }); DB.set('payments', p.id, { ts: now - ri(2, 300) * 60000 }, { quiet: true }); } catch (e) { console.warn(e.message); } });
    if (act[6]) { SESS.uid = 'u_fin3'; const p = recordPayment({ saleId: act[6].id, amount: Math.min(saleBalance(act[6]), 500000), method: 'Cash', channel: 'offline', date: t0, ref: 'CASH-' + ri(100, 999), note: 'Paid at Lekki office' }); SESS.uid = null; }
    /* a pending sale (reservation) */
    const pf = avail(); [pf[0], pf[8]].forEach((p, i) => { try { createSale({ clientId: clients[40 + i].id, plotIds: [p.id], planId: 'pl_6', officer: 'u_s1', realtorId: inducted[i], date: dAgo(i + 2), estateId: p.estate }); } catch (e) { } });

    /* leads & CRM */
    const STG = ['New', 'Contacted', 'Inspection', 'Negotiation', 'Reserved', 'Won', 'Lost']; const SRC = ['Website form', 'Instagram', 'Walk-in', 'Referral', 'Realtor (Tri-Pay)', 'Facebook', 'Radio', 'CSV import'];
    for (let i = 0; i < 34; i++) { const name = fullName(); const st = STG[i < 8 ? 0 : i < 14 ? 1 : i < 19 ? 2 : i < 24 ? 3 : i < 27 ? 4 : i < 30 ? 5 : 6]; const src = pick(SRC); DB.add('leads', { name, phone: phone(), email: name.toLowerCase().replace(' ', '.') + '@mail.example', source: src, campaign: src === 'Instagram' ? 'Q3 Instagram' : src === 'Facebook' ? 'Estate Promo' : '', stage: st, officer: pick(officers), estateId: pick(sizeOrder).id, budget: ri(3, 15) * 1000000, notes: '', created: now - ri(1, 60) * 864e5, lastTouch: now - (st === 'New' ? ri(0, 3) : ri(0, 9)) * 864e5, realtorId: src === 'Realtor (Tri-Pay)' ? pick(inducted) : '', lostReason: st === 'Lost' ? pick(['Price too high', 'Chose a competitor', 'Not reachable', 'Changed plans']) : '', nextFollow: addDays(t0, ri(-2, 5)) }, { quiet: true }); }
    DB.q('leads').slice(0, 20).forEach(l => DB.add('interactions', { leadId: l.id, type: pick(['Call', 'WhatsApp', 'Email', 'Visit']), note: pick(['Introduced estate options and prices.', 'Sent brochure and payment plans.', 'Booked a site inspection.', 'Discussed 6-month plan.', 'Client will confirm next week.']), ts: now - ri(0, 20) * 864e5, by: l.officer }, { quiet: true }));
    clients.slice(0, 30).forEach(c => { DB.add('interactions', { clientId: c.id, type: pick(['Call', 'WhatsApp', 'Email', 'Visit']), note: pick(['Payment reminder sent.', 'Client asked about documentation timeline.', 'Site visit completed.', 'Confirmed receipt of allocation letter.']), ts: now - ri(0, 60) * 864e5, by: c.officer }, { quiet: true }); });
    const mo = monthKey(t0); officers.forEach((o, i) => { for (let k = 0; k < 4; k++) { const m = monthKey(addMonths(t0, -k)); DB.add('targets', { userId: o, month: m, count: 4, value: 25000000 + i * 2500000 }, { quiet: true }); } });
    DB.add('targets', { userId: 'team', month: mo, count: 16, value: 110000000 }, { quiet: true });

    /* collections follow-up logs */
    overdueItems().slice(0, -2).forEach(o => DB.add('collections', { key: o.id, saleId: o.sale.id, ts: now - ri(1, 44) * 36e5, by: o.sale.officer, note: pick(['Client promised to pay Friday.', 'Phone not reachable; sent SMS.', 'Client requested restructure.']), outcome: pick(['Promise to pay', 'No answer', 'Dispute']) }, { quiet: true }));

    /* commissions: approve the oldest, leave others */
    DB.q('commissions').forEach((c, i) => { if (i % 4 === 0) { SESS.uid = 'u_ops'; DB.set('commissions', c.id, { status: 'approved', approvedAt: now - ri(5, 60) * 864e5 }, { quiet: true }); try { postJournal({ date: dAgo(ri(5, 60)), memo: 'Commission ' + commissionPayee(c), lines: [{ acct: '5100', dr: c.amount, dept: 'Sales' }, { acct: '2100', cr: c.amount }], source: 'commission', ref: c.id, quiet: true, force: true }); } catch (e) { } if (i % 8 === 0) { DB.set('commissions', c.id, { status: 'paid', paidAt: now - ri(1, 20) * 864e5 }, { quiet: true }); try { postJournal({ date: dAgo(ri(1, 20)), memo: 'Commission payout ' + commissionPayee(c), lines: [{ acct: '2100', dr: c.amount }, { acct: '1010', cr: c.amount }], source: 'commission-paid', ref: c.id, quiet: true, force: true }); } catch (e) { } } } });
    SESS.uid = null;

    /* opening capital & operating journals across the last months so statements have shape */
    postJournal({ date: addDays(t0, -330), memo: 'Opening capital', lines: [{ acct: '1010', dr: 150000000 }, { acct: '3000', cr: 150000000 }], source: 'manual', quiet: true, force: true });
    const OPEX = [['5200', 'Salaries and wages', 7800000, 'HR'], ['5400', 'Rent and utilities', 1650000, 'Operations'], ['5300', 'Marketing and advertising', 2400000, 'Marketing'], ['5500', 'Office and admin', 820000, 'Operations'], ['5600', 'Travel and logistics', 560000, 'Sales'], ['5000', 'Site works – Velcrest', 4200000, 'Operations']];
    for (let m = 10; m >= 0; m--) { const base = addMonths(t0, -m); const d = base.slice(0, 7) + '-26'; if (d > t0) continue; OPEX.forEach(([acct, name, amt, dept]) => { const a = Math.round(amt * (0.9 + rnd() * 0.25) / 1000) * 1000; postJournal({ date: d, memo: name + ' · ' + monthLabel(monthKey(d)), lines: [{ acct, dr: a, dept }, { acct: '1010', cr: a }], source: 'manual', quiet: true, force: true }); }); }

    /* invoices (other income) */
    const custs = ['Greenfield Properties Ltd', 'Mrs. Abimbola Cole', 'Zenith Rent Services', 'Palmgrove Residents Association', 'Mr. Tunji Adesina'];
    for (let i = 0; i < 8; i++) { const amt = ri(3, 40) * 50000, vat = Math.round(amt * .075), status = i < 4 ? 'paid' : i < 7 ? 'sent' : 'draft', d = dAgo(ri(5, 100)); const inv = DB.add('invoices', { no: 'INV-' + String(DB.seq('invoice')).padStart(4, '0'), customer: pick(custs), category: pick(['Facility management', 'Consultancy', 'Rent']), desc: pick(['Quarterly facility management fee', 'Property consultancy', 'Office rent', 'Estate service charge']), amount: amt, vat, total: amt + vat, issued: d, due: addDays(d, 14), status }, { quiet: true }); if (status !== 'draft') { postJournal({ date: d, memo: 'Invoice ' + inv.no, lines: [{ acct: '1150', dr: amt + vat }, { acct: '4100', cr: amt }, { acct: '2300', cr: vat }], source: 'invoice', ref: inv.id, quiet: true, force: true }); } if (status === 'paid') postJournal({ date: addDays(d, 9), memo: 'Receipt for ' + inv.no, lines: [{ acct: '1010', dr: amt + vat }, { acct: '1150', cr: amt + vat }], source: 'invoice-pay', ref: inv.id, quiet: true, force: true }); }

    /* vendors, bills */
    ['Eko Prints & Signs', 'SafeGuard Security', 'Lagos Survey Associates', 'Brightline Power', 'Kings Legal Chambers', 'Vertex Media'].forEach((n, i) => DB.add('vendors', { name: n, email: 'accounts@' + n.toLowerCase().replace(/[^a-z]/g, '') + '.example', phone: phone(), terms: 'Net 14', tin: ri(10000000, 99999999) + '-0001', wht: i % 2 === 0 }, { quiet: true }));
    DB.q('vendors').forEach((v, i) => { for (let k = 0; k < 2; k++) { const amt = ri(2, 30) * 50000, d = dAgo(ri(2, 70)), paid = chance(.5); const b = DB.add('bills', { vendorId: v.id, no: 'BL-' + String(DB.seq('bill')).padStart(4, '0'), desc: pick(['Signage and printing', 'Guard services', 'Survey plans', 'Electricity', 'Legal retainer', 'Media buying']), amount: amt, vat: Math.round(amt * .075), whtAmt: v.wht ? Math.round(amt * .05) : 0, date: d, due: addDays(d, 14), status: paid ? 'paid' : 'approved', cat: ['5300', '5500', '5700', '5400'][ri(0, 3)] }, { quiet: true }); postJournal({ date: d, memo: 'Bill ' + b.no + ' · ' + v.name, lines: [{ acct: b.cat, dr: amt }, { acct: '1200', dr: b.vat }, { acct: '2000', cr: amt + b.vat - b.whtAmt }, ...(b.whtAmt ? [{ acct: '2310', cr: b.whtAmt }] : [])], source: 'bill', ref: b.id, quiet: true, force: true }); if (paid) postJournal({ date: addDays(d, 10), memo: 'Payment of ' + b.no, lines: [{ acct: '2000', dr: amt + b.vat - b.whtAmt }, { acct: '1010', cr: amt + b.vat - b.whtAmt }], source: 'bill-pay', ref: b.id, quiet: true, force: true }); } });

    /* bank */
    DB.add('bankAccts', { name: 'Main operating account', bank: 'Guaranty Trust Bank', acctNo: '0123456789', gl: '1010' }, { quiet: true }); DB.add('bankAccts', { name: 'Collections account', bank: 'Zenith Bank', acctNo: '1012345678', gl: '1010' }, { quiet: true });
    const bj = DB.q('journals').filter(j => j.status === 'posted' && j.lines.some(l => l.acct === '1010') && j.date > dAgo(45)).slice(-14);
    bj.forEach((j, i) => { const l = j.lines.find(x => x.acct === '1010'); DB.add('bankTxns', { acct: DB.q('bankAccts')[0].id, date: addDays(j.date, i % 3), desc: 'NIP/' + j.memo.slice(0, 28), amount: l.dr ? l.dr : -l.cr, matched: i < 4 ? j.id : '' }, { quiet: true }); });
    [['POS COLLECTION SETTLEMENT', 184000], ['SMS CHARGES', -3250], ['ACCT MAINT FEE', -5500]].forEach(([d, a]) => DB.add('bankTxns', { acct: DB.q('bankAccts')[0].id, date: dAgo(ri(1, 12)), desc: d, amount: a, matched: '' }, { quiet: true }));

    /* expenses */
    const EXP = [['Billboard printing', 'Marketing', 'u_mk1', 'Marketing', 180000, 'approved'], ['Site visit transport', 'Travel & logistics', 'u_s1', 'Sales', 24000, 'pending'], ['Office generator diesel', 'Rent & utilities', 'u_op1', 'Operations', 95000, 'pending'], ['Survey plan production', 'Professional fees', 'u_op2', 'Operations', 650000, 'pending'], ['Training venue', 'Training', 'u_hr', 'HR', 120000, 'paid'], ['Stationery', 'Office & admin', 'u_cx1', 'Customer Experience', 18000, 'paid'], ['Radio airtime', 'Marketing', 'u_mkt', 'Marketing', 400000, 'approved'], ['Velcrest drainage works', 'Site works', 'u_ops', 'Operations', 2800000, 'pending']];
    EXP.forEach(([desc, category, userId, dept, amount, status], i) => { const e = DB.add('expenses', { no: 'EX-' + String(DB.seq('expense')).padStart(4, '0'), desc, category, userId, dept, amount, status: 'pending', date: dAgo(ri(1, 25)), by: userId }, { quiet: true }); SESS.uid = userId; const a = startApproval({ type: 'expense', ref: e.id, title: desc + ' · ' + money(amount), amount, requester: userId, meta: { link: '#/finance/expenses' } }); SESS.uid = null; if (status !== 'pending') { a.steps.forEach((s, k) => { const actors = baseActors(s, a); DB.set('approvals', a.id, { steps: DB.get('approvals', a.id).steps.map((x, j) => j === k ? { ...x, status: 'approved', by: actors[0] || 'u_coo', at: now } : x), cur: k + 1 }, { quiet: true }); }); DB.set('approvals', a.id, { status: 'approved' }, { quiet: true }); APPR.expense.ok(DB.get('approvals', a.id)); if (status === 'paid') { DB.set('expenses', e.id, { status: 'paid', paidAt: now }, { quiet: true }); postJournal({ date: t0, memo: 'Disbursed ' + e.no, lines: [{ acct: '2200', dr: amount }, { acct: '1010', cr: amount }], source: 'expense-pay', ref: e.id, quiet: true, force: true }); } } });
    DB.q('depts').forEach(d => { if (d.name === 'IT') return; ['Marketing', 'Office & admin', 'Travel & logistics', 'Training'].forEach((c, i) => DB.add('budgets', { dept: d.name, cat: c, fy: fiscalYear(t0).label, amount: ri(2, 12) * 250000 }, { quiet: true })); });
    DB.add('budgets', { dept: 'Operations', cat: 'Site works', fy: fiscalYear(t0).label, amount: 12000000 }, { quiet: true });

    /* fixed assets */
    [['Toyota Hilux (site vehicle)', 'Vehicle', 28500000, 5, 'u_op1'], ['HP LaserJet printers x3', 'Equipment', 1350000, 4, ''], ['Dell laptops x12', 'Equipment', 9600000, 3, ''], ['Lekki office furniture', 'Furniture', 4200000, 8, ''], ['Backup generator 40kVA', 'Equipment', 6800000, 6, 'u_ops'], ['Drone survey kit', 'Equipment', 3100000, 4, 'u_op2']].forEach(([name, category, cost, life, assignedTo], i) => DB.add('assets', { tag: 'AST-' + String(i + 1).padStart(3, '0'), name, category, cost, life, acquired: dAgo(ri(100, 700)), assignedTo, status: 'In use', depTo: '' }, { quiet: true }));
    [['VAT', monthKey(addMonths(t0, -1)), 1850000, 'Pending'], ['WHT', monthKey(addMonths(t0, -1)), 420000, 'Pending'], ['VAT', monthKey(addMonths(t0, -2)), 1620000, 'Remitted'], ['WHT', monthKey(addMonths(t0, -2)), 390000, 'Remitted']].forEach(([type, period, amount, status]) => DB.add('taxes', { type, period, amount, status, due: addDays(period + '-01', 51).slice(0, 8) + '21' }, { quiet: true }));

    /* attendance, leave, vault, announcements */
    const staffUsers = DB.d.users.filter(u => u.co.includes('tre') && u.id !== 'u_aud');
    for (let d = 20; d >= 0; d--) { const date = dAgo(d); const w = new Date(date + 'T00:00:00').getDay(); if (w === 0 || w === 6) continue; staffUsers.forEach(u => { if (chance(.06)) return; const hh = ri(7, 9), mm = ri(0, 59); const inT = new Date(date + 'T' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ':00').getTime(); if (d === 0 && (inT > now || chance(.3))) return; const late = hh > 8 || (hh === 8 && mm > 30); DB.add('attendance', { userId: u.id, date, in: inT, out: d === 0 ? null : inT + ri(8, 10) * 36e5, mode: chance(.75) ? 'Office' : pick(['Remote', 'Field']), late, missed: false }, { quiet: true }); }); }
    ['u_s1', 'u_s2', 'u_cx1', 'u_mk1', 'u_op1'].forEach((u, i) => DB.add('leaves', { userId: u, type: pick(['Annual', 'Annual', 'Sick', 'Casual']), from: addDays(t0, i * 3 - 6), to: addDays(t0, i * 3 - 4 + i), days: 3 + i, reason: 'Personal', status: i < 3 ? 'approved' : 'pending' }, { quiet: true }));
    DB.q('leaves').filter(l => l.status === 'pending').forEach(l => { SESS.uid = l.userId; const a = startApproval({ type: 'leave', ref: l.id, title: l.type + ' leave · ' + userName(l.userId) + ' · ' + l.days + ' days', requester: l.userId, meta: { link: '#/hr/leave' } }); SESS.uid = null; });
    DB.q('employees').forEach((e, i) => { ['Employment contract', 'National ID', 'Guarantor form'].forEach((n, k) => DB.add('vault', { empId: e.id, name: n, type: n, added: dAgo(ri(100, 700)), expiry: k === 1 && i % 5 === 0 ? addDays(t0, ri(5, 25)) : '', restricted: k === 0, file: '' }, { quiet: true })); });
    [['Q4 sales drive kicks off', 'The Q4 sales drive starts Monday. Targets are on your personal dashboard. Thank you for your continued effort.', 'u_coo'], ['Updated leave policy', 'Annual leave requests now need approval from your line manager at least 7 days in advance.', 'u_hr'], ['Office closure notice', 'The Lekki office will close at 15:00 on the last working day of the month for the stock count.', 'u_hr']].forEach(([title, body, by], i) => { const a = DB.add('announcements', { title, body, by, ts: now - (i + 1) * 864e5 * 3, ack: true }, { quiet: true }); staffUsers.slice(0, 9 - i * 3).forEach(u => DB.add('acks', { annId: a.id, userId: u.id, ts: a.ts + 36e5 }, { quiet: true })); });
    DB.add('exitslips', { empName: 'Former staff · Wale Adeniyi', dept: 'Sales', lastDay: dAgo(12), cards: 'Returned', access: 'Revoked', status: 'Completed', clearance: ['HR', 'IT', 'Finance', 'Line manager'], by: 'u_hr' }, { quiet: true });
    DB.add('exceptions', { empName: 'Contractor · Site surveyor', reason: 'Visitor card not returned', date: dAgo(6), status: 'Open' }, { quiet: true });

    /* projects & tasks */
    const PRJ = [['Velcrest site works', 'u_ops', 'Operations', 'Drainage, access roads and perimeter fencing for Velcrest.', 'Active', 'estate-dev'], ['Q4 sales drive', 'u_sales', 'Sales', 'Quarterly sales push across all selling estates.', 'Active', ''], ['Zoho Projects migration', 'u_admin', 'IT', 'Import open projects, tasks and comments from Zoho Projects.', 'Active', ''], ['TARP recruitment drive', 'u_rd', 'Realtors Development', 'Recruit and induct new realtors by campaign.', 'Active', ''], ['Month-end close', 'u_fin2', 'Finance', 'Recurring checklist for closing each period.', 'Active', '']];
    PRJ.forEach(([name, owner, dept, desc, status, kind], i) => DB.add('projects', { name, owner, dept, desc, status, kind, start: dAgo(60 - i * 8), due: addDays(t0, 30 + i * 12), team: staffUsers.filter(u => u.dept === dept).map(u => u.id), milestones: [{ n: 'Kick-off', d: dAgo(55), done: true }, { n: 'Mid-point review', d: addDays(t0, 10 + i * 4), done: false }, { n: 'Completion', d: addDays(t0, 30 + i * 12), done: false }], budget: kind ? 12000000 : 0, template: false }, { quiet: true }));
    const prj = DB.q('projects'); const TN = [['Confirm contractor schedule', 0, 'u_op1'], ['Order drainage materials', 0, 'u_op2'], ['Photograph site progress', 0, 'u_op1'], ['Call list for Q4 leads', 1, 'u_s1'], ['Prepare estate price list', 1, 'u_s2'], ['Run weekend inspection tour', 1, 'u_s3'], ['Client follow-ups: overdue instalments', 1, 'u_s4'], ['Map Zoho users to Tri-OP users', 2, 'u_admin'], ['Import open Zoho tasks', 2, 'u_admin'], ['Schedule onboarding session', 3, 'u_rd1'], ['Review Form A sign-ups', 3, 'u_rd2'], ['Reconcile bank statement', 4, 'u_fin1'], ['Post accruals', 4, 'u_fin3'], ['Lock period', 4, 'u_fin2'], ['Draft weekly report', 1, 'u_sales'], ['Update inventory statuses', 0, 'u_op2'], ['Send allocation letters', 1, 'u_s2'], ['Design Q4 flyers', 1, 'u_mk1'], ['Answer escalated tickets', 1, 'u_cx1'], ['Verify KYC documents', 1, 'u_cx2']];
    const TS = ['todo', 'doing', 'review', 'done']; TN.forEach(([title, pi2, as], i) => { const status = TS[i % 4]; const due = addDays(t0, ri(-5, 14)); DB.add('tasks', { title, desc: 'Details for: ' + title, project: prj[pi2].id, assignee: as, followers: [prj[pi2].owner], due, start: addDays(due, -ri(2, 8)), priority: pick(['Low', 'Medium', 'High', 'Urgent']), status, subtasks: [], checklist: [{ t: 'Confirm scope', done: true }, { t: 'Do the work', done: status === 'done' }, { t: 'Share update', done: false }], comments: [{ by: prj[pi2].owner, ts: now - ri(1, 10) * 864e5, text: 'Please keep this updated.' }], history: [{ ts: now - ri(2, 14) * 864e5, by: prj[pi2].owner, what: 'Created task' }], est: ri(2, 16), doneAt: status === 'done' ? now - ri(1, 8) * 864e5 : null, deps: [], created: now - ri(5, 30) * 864e5 }, { quiet: true }); });
    DB.add('tasks', { title: 'Daily site check', desc: 'Walk the selling estates and photograph progress.', project: prj[0].id, assignee: 'u_op1', followers: [], due: t0, priority: 'Medium', status: 'todo', recur: { freq: 'daily', next: addDays(t0, 1) }, checklist: [{ t: 'Gate and fencing', done: false }, { t: 'Plot beacons', done: false }, { t: 'Photos uploaded', done: false }], comments: [], history: [], created: now }, { quiet: true });
    const tl = DB.q('tasks'); tl.filter(t => t.status === 'done').slice(0, 4).forEach(t => DB.add('timelogs', { taskId: t.id, userId: t.assignee, date: dAgo(ri(1, 6)), hours: ri(1, 6), note: 'Work on ' + t.title }, { quiet: true }));
    DB.add('issues', { title: 'Access road washed out after rain', projectId: prj[0].id, severity: 'High', owner: 'u_op1', status: 'Open', resolution: '', created: now - 3 * 864e5 }, { quiet: true });
    DB.add('issues', { title: 'Duplicate plot numbers in imported sheet', projectId: prj[2].id, severity: 'Medium', owner: 'u_admin', status: 'Resolved', resolution: 'Renumbered duplicates and re-imported.', created: now - 9 * 864e5 }, { quiet: true });

    /* tickets */
    const CATS = ['Documentation', 'Payment', 'Allocation', 'Site visit', 'Complaint', 'General enquiry']; const SLA = DB.setting('slaHours');
    for (let i = 0; i < 14; i++) { const pr = pick(['Urgent', 'High', 'Medium', 'Low']); const resolved = i % 3 === 0; const created = resolved ? now - ri(0, 12) * 864e5 - ri(0, 20) * 36e5 : now - ri(0, 30) * 36e5; const cl = clients[i % clients.length]; const t = DB.add('tickets', { no: 'TK-' + String(DB.seq('ticket')).padStart(4, '0'), clientId: cl.id, plotId: '', saleId: DB.q('sales').find(s => s.clientId === cl.id)?.id || '', subject: pick(['Receipt not received', 'Request for C of O update', 'Wrong plot size on letter', 'Site inspection request', 'Payment not reflecting', 'Change of next of kin']), category: pick(CATS), priority: pr, channel: pick(['Email', 'Phone', 'Walk-in', 'Tri-Pay']), owner: pick(['u_cx1', 'u_cx2']), status: resolved ? 'Resolved' : pick(['Open', 'In progress']), created, slaDue: created + SLA[pr] * 36e5, notes: [], csat: resolved ? ri(3, 5) : null, resolvedAt: resolved ? created + ri(2, 30) * 36e5 : null, breached: false }, { quiet: true }); }

    /* KPIs */
    const K = (name, source, target, role, dir = 'high', unit = '') => DB.add('kpis', { name, source, target, role, dir, unit }, { quiet: true });
    K('Sales closed per month', 'sales.count', 3, 'Sales Officer'); K('Sales value per month', 'sales.value', 25000000, 'Sales Officer', 'high', '₦'); K('Tasks completed on time', 'tasks.ontime', 85, 'All staff', 'high', '%'); K('Punctuality', 'attendance', 90, 'All staff', 'high', '%');
    K('Tickets resolved per month', 'tickets.resolved', 8, 'Customer Experience Officer'); K('Tickets within SLA', 'tickets.sla', 90, 'Customer Experience Officer', 'high', '%'); K('Realtors registered', 'rlt.recruits', 6, 'Realtors Development Officer'); K('Payments confirmed', 'collections', 30000000, 'Finance Officer', 'high', '₦'); K('Assessment score', 'learn.score', 70, 'All staff', 'high', '%'); K('Client satisfaction (CSAT)', 'manual', 4.2, 'Customer Experience Officer', 'high', '/5');
    DB.q('kpis').filter(k => k.source === 'manual').forEach(k => ['u_cx1', 'u_cx2'].forEach(u => DB.add('kpiVals', { kpi: k.id, userId: u, month: monthKey(t0), value: 3.9 + rnd() * .8 }, { quiet: true })));
    DB.q('employees').filter(e => e.userId !== 'u_aud').slice(0, 6).forEach(e => DB.add('appraisals', { userId: e.userId, cycle: 'H1 2026', self: 'Delivered against targets and supported the team.', manager: '', rating: null, status: 'Self-review submitted' }, { quiet: true }));

    /* reports */
    ['Sales', 'Operations', 'Marketing', 'Customer Experience', 'Finance', 'HR'].forEach((dept, i) => { const head = deptHead(dept); for (let w = 3; w >= 0; w--) { const per = weekStart(addDays(t0, -7 * w)); const status = w === 0 ? (i % 3 === 0 ? 'Draft' : '') : (w === 1 && i === 2 ? 'Returned' : 'Accepted'); if (!status) continue; const deadline = rptDeadline('Weekly', per); DB.add('reports', { dept, type: 'Weekly', period: per, deadline, by: head, status, sections: { followup: 'Open follow-ups from last week were closed or escalated.', figures: (RPT_FIGS[dept] ? RPT_FIGS[dept](per, addDays(per, 6)).map(([l, v]) => ({ l, v, auto: true })) : []), declaration: true }, submittedAt: status === 'Draft' ? null : new Date(deadline + 'T10:00:00').getTime() - ri(0, 2) * 864e5 + (i === 4 ? 2 * 864e5 : 0), reviewNote: status === 'Returned' ? 'Please add the figures for the second estate.' : '', reviewedBy: status === 'Accepted' ? 'u_coo' : null }, { quiet: true }); } });

    /* chat */
    const mkCh = (name, type, members, extra = {}) => DB.add('channels', { name, type, members, ...extra }, { quiet: true });
    const allIds = staffUsers.map(u => u.id);
    const gen = mkCh('general', 'public', allIds, { desc: 'Company-wide conversation' }); const ann = mkCh('announcements', 'announce', allIds, { desc: 'Only management can post here' });
    DB.q('depts').forEach(d => { if (d.name !== 'Management') mkCh(d.name.toLowerCase().replace(/ /g, '-'), 'public', staffUsers.filter(u => u.dept === d.name || u.role.includes('exec')).map(u => u.id), { dept: d.name, desc: d.name + ' team channel (from org chart)', auto: true }); });
    const vel = mkCh('velcrest-site', 'private', ['u_ops', 'u_op1', 'u_op2', 'u_coo'], { desc: 'Velcrest site works' });
    const dm = mkCh('dm', 'dm', ['u_s1', 'u_sales']);
    const M = (ch, by, text, mins, extra = {}) => DB.add('messages', { ch, by, text, ts: now - mins * 60000, ...extra }, { quiet: true });
    M(ann.id, 'u_coo', 'Welcome to Tri-OP. Slack is being retired; please move your conversations here.', 4000); M(ann.id, 'u_md', 'Targets for Q4 are on your personal dashboards.', 2600);
    M(gen.id, 'u_hr', 'Reminder: clock in from your dashboard each morning. Resumption is 8:30.', 900); M(gen.id, 'u_s2', 'Closed two plots at Lisbon II this week 🎉', 640, { rx: { '🎉': ['u_sales', 'u_s1', 'u_coo'] } }); M(gen.id, 'u_sales', '@Zainab Lawal well done. Please send the allocation letters today.', 620);
    M(vel.id, 'u_op1', 'Access road needs regrading after the rain. Photos attached to the issue.', 300); M(vel.id, 'u_ops', 'Thanks. Raise the requisition and I will approve it today.', 280);
    M(dm.id, 'u_sales', 'Bayo, how is the Skyview lead from yesterday?', 120); M(dm.id, 'u_s1', 'Booked for inspection on Saturday.', 100);

    /* learning */
    const prg = DB.add('programmes', { name: 'Maximizing Chronos', quarter: 'Q4 2026', theme: 'Time management and execution', objectives: ['Plan the week around outcomes', 'Reduce interruptions and context switching', 'Close the day with a written review'], materials: [{ t: 'Deep Work (summary)', k: 'link', u: '#' }, { t: 'Weekly planner template', k: 'doc', u: '#' }], targets: { depts: [], all: true }, lead: 'u_hr', start: dAgo(10), end: addDays(t0, 70), weights: { attendance: 20, assignments: 30, tests: 50 } }, { quiet: true });
    DB.add('programmes', { name: 'Customer Excellence', quarter: 'Q3 2026', theme: 'Service and communication', objectives: ['Handle complaints with a clear process'], materials: [], targets: { depts: ['Customer Experience', 'Sales'], all: false }, lead: 'u_hr', start: dAgo(100), end: dAgo(12), weights: { attendance: 20, assignments: 30, tests: 50 } }, { quiet: true });
    const sdates = [-8, -1, 2, 6, 13, 20]; sdates.forEach((d, i) => DB.add('sessions', { programmeId: prg.id, title: ['Kick-off: Maximizing Chronos', 'Planning your week', 'Deep work workshop', 'Managing meetings', 'Daily review habits', 'Quarter close'][i], date: addDays(t0, d), time: '10:00', venue: i % 2 ? 'Google Meet' : 'Lekki office, Training room', invitees: allIds, attendance: d < 0 ? Object.fromEntries(allIds.map(u => [u, chance(.85)])) : {}, type: 'Training' }, { quiet: true }));
    const asg = DB.add('assignments', { programmeId: prg.id, title: 'Read: Deep Work, chapters 1–3', kind: 'Book reading', instructions: 'Write a 200-word summary of the key idea you will apply.', due: addDays(t0, 9), max: 20, assignees: allIds }, { quiet: true });
    DB.add('assignments', { programmeId: prg.id, title: 'Project: Plan your Q4 week', kind: 'Project', instructions: 'Submit your weekly plan as a link or text.', due: addDays(t0, 16), max: 30, assignees: allIds }, { quiet: true });
    ['u_s1', 'u_s2', 'u_cx1', 'u_op1'].forEach(u => DB.add('submissions', { asgId: asg.id, userId: u, text: 'The key idea is to protect two hours of deep work every morning.', link: '', ts: now - ri(1, 3) * 864e5, grade: u === 'u_s1' ? 17 : null, feedback: u === 'u_s1' ? 'Clear and practical.' : '' }, { quiet: true }));
    const QS = [['What time is resumption at Triconna?', ['7:30', '8:30', '9:00', '9:30'], 1], ['Who can approve a payment you recorded?', ['You', 'Another officer', 'Nobody', 'Any client'], 1], ['How long is a plot reservation held without a deposit?', ['It never expires', 'A set number of days', '24 hours only', 'One year'], 1], ['Where do clients make payments?', ['Tri-OP', 'Tri-Pay', 'Slack', 'Zoho'], 1], ['Which colour is used for warnings and overdue items?', ['Harvest Orange', 'Lawn Green', 'Tea Green', 'Honeydew'], 0], ['Who sees salary and disciplinary records?', ['All staff', 'HR and executives', 'Line managers', 'Clients'], 1], ['Clock-in work modes are Office, Field and…', ['Remote', 'Leave', 'Weekend', 'Hybrid'], 0], ['A source of a realtor, once saved, is…', ['Editable by anyone', 'Locked', 'Deleted weekly', 'Random'], 1]];
    DB.add('assessments', { programmeId: prg.id, title: 'Q4 CAVE exam', minutes: 10, pass: 60, count: 6, bank: QS.map(([q, o, a]) => ({ q, o, a })), kind: 'Online', created: now }, { quiet: true });
    DB.q('assessments').forEach(a => ['u_s1', 'u_s2', 'u_s3', 'u_cx1', 'u_op1', 'u_mk1'].forEach(u => DB.add('attempts', { assessmentId: a.id, userId: u, score: ri(55, 95), submitted: now - ri(1, 20) * 864e5, answers: [], passed: true }, { quiet: true })));
    DB.add('readings', { userId: 'u_s1', book: 'Deep Work', target: addDays(t0, 30), progress: 40, summary: '' }, { quiet: true });

    /* events (realtor onboarding) */
    [['Onboarding session — Batch B3', 'Onboarding', 3], ['Online CBT — Batch B3', 'CBT', 5], ['Site tour — Achievers Estate', 'Site tour', 8], ['Onboarding session — Batch B4', 'Onboarding', 17], ['Site tour — Velcrest', 'Site tour', 22]].forEach(([title, type, d]) => DB.add('events', { title, type, date: addDays(t0, d - 3), time: '10:00', venue: type === 'CBT' ? 'Online' : 'Lekki office', invitees: DB.q('realtors').filter(r => r.stage !== 'Exited').slice(0, 10).map(r => r.id), attendance: {} }, { quiet: true }));
    DB.add('inspections', { leadId: DB.q('leads')[14]?.id, clientName: DB.q('leads')[14]?.name, estateId: sizeOrder[0].id, date: addDays(t0, 2), time: '11:00', officer: 'u_s1', outcome: '', status: 'Scheduled' }, { quiet: true });
    DB.add('inspections', { leadId: DB.q('leads')[15]?.id, clientName: DB.q('leads')[15]?.name, estateId: sizeOrder[3].id, date: addDays(t0, -3), time: '10:00', officer: 'u_s2', outcome: 'Interested in 450 sqm plot; will reserve next week.', status: 'Completed' }, { quiet: true });

    /* second company light data */
    CO = 'tre'; [['Palmgrove Court, Block B', 'Plumbing', 'High', 'Burst pipe in the common bathroom.', 'Assigned', 'u_op1'], ['Lekki Gardens Phase 2', 'Security', 'Medium', 'Replace the perimeter floodlights.', 'In progress', 'u_op2'], ['Palmgrove Court, Block A', 'Cleaning', 'Low', 'Quarterly deep clean of stairwells.', 'New', '']].forEach(([property, type, priority, desc, status, assignee], i) => DB.add('facilityreqs', { no: 'FM-' + String(DB.seq('facility')).padStart(4, '0'), property, type, priority, desc, status, assignee, clientId: clients[i].id, notes: [] }, { quiet: true }));
    [['alloc', 'Allocation', 'Triconna: congratulations {{name}}. Plot(s) {{plots}} in {{estate}} are now allocated to you (sale {{sale}}).'], ['paid', 'Full payment', 'Triconna: {{name}}, your payment for {{sale}} is complete. Documentation will start now.'], ['docs', 'Document ready', 'Triconna: {{name}}, your title documents for {{sale}} are ready for collection.']].forEach(([key, name, text]) => DB.add('msgtpl', { key, name, text, channel: 'SMS' }, { quiet: true }));
    DB.add('schedules', { name: 'Daily collections summary', type: 'collections', time: '18:00', recipients: ['u_md', 'u_coo', 'u_cexec'], active: true, lastRun: '' }, { quiet: true });
    CO = 'tfm'; DB.add('clients', { name: 'Palmgrove Residents Association', phone: '08031234567', email: 'office@palmgrove.example', address: 'Lekki, Lagos', kyc: [], officer: 'u_f1', source: 'Referral', created: now - 60 * 864e5 }, { quiet: true }); DB.add('tasks', { title: 'Quarterly generator service · Palmgrove', assignee: 'u_f1', due: addDays(t0, 6), priority: 'Medium', status: 'todo', checklist: [], comments: [], history: [], created: now }, { quiet: true });
    postJournal({ date: addDays(t0, -60), memo: 'Opening capital', lines: [{ acct: '1010', dr: 20000000 }, { acct: '3000', cr: 20000000 }], source: 'manual', quiet: true, force: true }); DB.add('channels', { name: 'general', type: 'public', members: ['u_md', 'u_f1'] }, { quiet: true }); CO = 'tre';

    /* close older periods */
    for (let m = 11; m >= 3; m--) { const k = monthKey(addMonths(t0, -m)); DB.add('periods', { id: k, status: 'closed', closedBy: 'u_fin2', closedAt: now - m * 30 * 864e5, checklist: {} }, { quiet: true }); }
    [2, 1, 0].forEach(m => DB.add('periods', { id: monthKey(addMonths(t0, -m)), status: 'open', checklist: {} }, { quiet: true }));
    CO = 'tfm'; DB.add('periods', { id: monthKey(t0), status: 'open', checklist: {} }, { quiet: true }); CO = 'tre';

    /* a few audit entries to start */
    DB.quiet = false; SESS.uid = 'u_admin'; audit('seed', 'system', 'init', 'Demo data loaded'); audit('config', 'settings', 'approval-rules', 'Approval rules created'); SESS.uid = saved.uid; CO = saved.co || 'tre';
    DB.d.rev = 0; return DB.d;
  }
};

function seedCompanyBase(co) {
      CO = co;
      const depts = co === 'tre' ? [['Management', 'u_md'], ['Sales', 'u_sales'], ['Marketing', 'u_mkt'], ['Operations', 'u_ops'], ['Finance', 'u_fin2'], ['HR', 'u_hr'], ['Realtors Development', 'u_rd'], ['Customer Experience', 'u_cxh'], ['IT', 'u_admin']] : [['Management', 'u_md'], ['Facilities', 'u_f1']];
      depts.forEach(([name, head]) => DB.add('depts', { name, head }));
      DB.d.settings[co] = {};
      COA.forEach(([code, name, type]) => DB.add('accounts', { code, name, type }, { quiet: true }));
      DB.add('rules', { type: 'expense', tiers: [{ max: 50000, steps: ['manager'] }, { max: 500000, steps: ['manager', 'finance'] }, { max: null, steps: ['manager', 'finance', 'exec'] }] });
      DB.add('rules', { type: 'journal', tiers: [{ max: 5000000, steps: ['finance'] }, { max: null, steps: ['finance', 'exec'] }] });
      DB.add('rules', { type: 'commission', tiers: [{ max: 2000000, steps: ['opsdir'] }, { max: null, steps: ['opsdir', 'exec'] }] });
      DB.add('rules', { type: 'leave', tiers: [{ max: null, steps: ['manager'] }] });
      DB.add('rules', { type: 'transfer', tiers: [{ max: null, steps: ['opsdir'] }] });
      DB.add('rules', { type: 'restructure', tiers: [{ max: null, steps: ['opsdir'] }] });
      DB.add('rules', { type: 'revocation', tiers: [{ max: null, steps: ['opsdir', 'exec'] }] });
      DB.add('rules', { type: 'reopen', tiers: [{ max: null, steps: ['exec'] }] });
      const tp = (type, name, body) => DB.add('templates', { type, name, body });
      tp('offer', 'Offer letter', '<p>{{date}}</p><p><b>{{client.name}}</b><br>{{client.address}}</p><p>Dear {{client.name}},</p><p>We are pleased to offer you plot(s) <b>{{plotsText}}</b> at <b>{{estate.name}}</b>, {{estate.location}}, under the <b>{{sale.planName}}</b> payment plan.</p><table><tr><th>Total price</th><td>{{sale.totalF}}</td></tr><tr><th>Initial deposit</th><td>{{sale.depositF}}</td></tr><tr><th>Sale reference</th><td>{{sale.no}}</td></tr></table><p>Your reservation is held until the deposit is confirmed. Please pay through Tri-Pay and keep your receipt.</p><p>Yours faithfully,<br>{{officer}}<br>{{company.name}}</p>');
      tp('allocation', 'Allocation letter', '<p>{{date}}</p><p><b>{{client.name}}</b></p><p>This letter confirms the allocation of plot(s) <b>{{plotsText}}</b> in <b>{{estate.name}}</b> ({{estate.location}}) to you, under sale reference <b>{{sale.no}}</b>.</p><p>Amount paid to date: {{sale.paidF}}. Balance: {{sale.balanceF}}.</p><p>This allocation is subject to the terms of your sales agreement and the payment plan.</p><p>{{company.name}}</p>');
      tp('receipt', 'Payment receipt', '<table><tr><th>Receipt no.</th><td>{{payment.receiptNo}}</td></tr><tr><th>Received from</th><td>{{client.name}}</td></tr><tr><th>Amount</th><td>{{payment.amountF}}</td></tr><tr><th>Payment date</th><td>{{payment.dateF}}</td></tr><tr><th>Method</th><td>{{payment.method}}</td></tr><tr><th>Sale</th><td>{{sale.no}} · {{plotsText}}</td></tr><tr><th>Balance after payment</th><td>{{sale.balanceF}}</td></tr></table><p>Thank you for your payment.</p>');
      tp('ack', 'Payment acknowledgement', '<p>{{date}}</p><p>Dear {{client.name}},</p><p>We acknowledge receipt of {{payment.amountF}} on {{payment.dateF}} towards sale {{sale.no}}. Your outstanding balance is {{sale.balanceF}}.</p><p>{{company.name}}</p>');
      tp('revocation', 'Revocation notice', '<p>{{date}}</p><p>Dear {{client.name}},</p><p>Following review, your allocation under sale {{sale.no}} has been revoked. A refund of {{refund}} has been approved.</p><p>{{company.name}}</p>');
    }
