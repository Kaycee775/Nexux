'use strict';
/* Tri-OP business engine: ledger, sales & payments, approvals, scheduled jobs, documents, KPIs */

/* ---------- org helpers ---------- */
const empOf = uid => DB.q('employees').find(e => e.userId === uid) || null;
const deptHead = dept => { const d = DB.q('depts').find(x => x.name === dept); return d ? d.head : null; };
const usersIn = dept => DB.d.users.filter(u => u.co.includes(CO) && u.dept === dept && !u.off);
const usersWithRole = role => DB.d.users.filter(u => u.co.includes(CO) && u.role === role && !u.off);
const coUsers = () => DB.d.users.filter(u => u.co.includes(CO) && !u.off);
const salesOfficers = () => coUsers().filter(u => u.dept === 'Sales');
const managerOf = uid => { const u = userById(uid); return u && u.manager ? u.manager : deptHead(u?.dept); };

/* ---------- ledger ---------- */
const ACCT_TYPES = { asset: 'Asset', liability: 'Liability', equity: 'Equity', income: 'Income', expense: 'Expense' };
const acctByCode = c => DB.q('accounts').find(a => a.code === c);
const acctLabel = c => { const a = acctByCode(c); return a ? c + ' · ' + a.name : c; };
function periodClosed(date) { const p = DB.q('periods').find(x => x.id === monthKey(date)); return !!p && p.status === 'closed'; }
function postJournal(j) {
  const lines = j.lines.map(l => ({ acct: l.acct, dr: Math.round((+l.dr || 0) * 100) / 100, cr: Math.round((+l.cr || 0) * 100) / 100, dept: l.dept || '', memo: l.memo || '' })).filter(l => l.dr || l.cr);
  const dr = sum(lines, l => l.dr), cr = sum(lines, l => l.cr);
  if (Math.abs(dr - cr) > 0.01 || dr <= 0) throw new Error('Journal does not balance: debits ' + money(dr) + ' and credits ' + money(cr) + ' must be equal.');
  for (const l of lines) if (!acctByCode(l.acct)) throw new Error('Account ' + l.acct + ' does not exist in the chart of accounts.');
  const status = j.status || 'posted';
  if (status === 'posted' && !j.force && periodClosed(j.date)) throw new Error(monthLabel(monthKey(j.date)) + ' is closed. Ask an executive to reopen the period, or post in an open period.');
  const no = j.no || ('JV-' + j.date.slice(0, 4) + '-' + String(DB.seq('journal')).padStart(4, '0'));
  return DB.add('journals', { no, date: j.date, memo: j.memo, lines, source: j.source || 'manual', ref: j.ref || '', status, by: j.by || SESS.uid, total: dr }, { quiet: j.quiet });
}
function trialBalance(from, to) {
  const m = {}; DB.q('accounts').forEach(a => m[a.code] = { code: a.code, name: a.name, type: a.type, dr: 0, cr: 0 });
  DB.q('journals').filter(j => j.status === 'posted' && (!from || j.date >= from) && (!to || j.date <= to)).forEach(j => j.lines.forEach(l => { if (m[l.acct]) { m[l.acct].dr += l.dr; m[l.acct].cr += l.cr; } }));
  return Object.values(m).sort(by(x => x.code)).map(x => ({ ...x, bal: (x.type === 'asset' || x.type === 'expense') ? x.dr - x.cr : x.cr - x.dr }));
}
const acctBal = (code, from, to) => (trialBalance(from, to).find(a => a.code === code) || { bal: 0 }).bal;
function pnl(from, to) { const tb = trialBalance(from, to); const inc = tb.filter(a => a.type === 'income' && a.bal), exp = tb.filter(a => a.type === 'expense' && a.bal); return { inc, exp, income: sum(inc, a => a.bal), expense: sum(exp, a => a.bal), net: sum(inc, a => a.bal) - sum(exp, a => a.bal) }; }
function balanceSheet(asAt) {
  const tb = trialBalance(null, asAt); const p = pnl(null, asAt);
  const assets = tb.filter(a => a.type === 'asset' && a.bal), liab = tb.filter(a => a.type === 'liability' && a.bal), eq = tb.filter(a => a.type === 'equity' && a.bal);
  return { assets, liab, eq, earnings: p.net, tAssets: sum(assets, a => a.bal), tLiab: sum(liab, a => a.bal), tEq: sum(eq, a => a.bal) + p.net };
}

/* ---------- inventory ---------- */
const PLOT_FLOW = { available: ['reserved', 'withheld'], reserved: ['available', 'allocated', 'withheld'], allocated: ['paid', 'revoked', 'withheld'], paid: ['documented', 'revoked'], documented: ['revoked'], withheld: ['available'], revoked: ['available'] };
const PLOT_STATUSES = ['available', 'reserved', 'allocated', 'paid', 'documented', 'withheld', 'revoked'];
const PLOT_LABEL = { available: 'Available', reserved: 'Reserved', allocated: 'Allocated', paid: 'Fully paid', documented: 'Documented', withheld: 'Withheld', revoked: 'Revoked' };
function setPlotStatus(plot, to, note = '', patch = {}) {
  if (plot.status !== to && !(PLOT_FLOW[plot.status] || []).includes(to)) throw new Error(`A ${PLOT_LABEL[plot.status].toLowerCase()} plot cannot move to ${PLOT_LABEL[to].toLowerCase()}.`);
  const log = (plot.log || []).concat([{ ts: Date.now(), from: plot.status, to, by: SESS.uid || 'system', note }]);
  DB.set('plots', plot.id, { status: to, log, ...patch }, { action: 'plot-status' });
}
const estateOf = id => DB.get('estates', id);
const plotLabel = p => { const e = p && estateOf(p.estate); return p ? `${e ? e.name : '—'} · ${p.block ? p.block + ' ' : ''}Plot ${p.no}` : '—'; };
function plotPrice(p) { return p.price; }
function activeSaleOfPlot(plotId) { return DB.q('sales').find(s => s.plotIds.includes(plotId) && ['active', 'pending', 'completed'].includes(s.status)); }

/* ---------- sales & schedules ---------- */
function buildSchedule(total, plan, start) {
  if (!plan.months) return [{ no: 0, label: 'Outright payment', due: start, amount: total, paid: 0 }];
  const dep = Math.round(total * plan.depositPct / 100), rest = total - dep, each = Math.floor(rest / plan.months / 100) * 100;
  const rows = [{ no: 0, label: 'Initial deposit', due: start, amount: dep, paid: 0 }];
  for (let i = 1; i <= plan.months; i++) rows.push({ no: i, label: 'Instalment ' + i + ' of ' + plan.months, due: addMonths(start, i), amount: i === plan.months ? rest - each * (plan.months - 1) : each, paid: 0 });
  return rows;
}
function createSale({ clientId, plotIds, planId, officer, realtorId, date, leadId, estateId }) {
  const plots = plotIds.map(id => DB.get('plots', id)); const estate = estateOf(estateId || plots[0].estate);
  for (const p of plots) { if (!['available', 'reserved'].includes(p.status)) throw new Error(`${plotLabel(p)} is ${PLOT_LABEL[p.status].toLowerCase()}. A plot can belong to only one active sale.`); if (p.status === 'reserved' && p.reservedFor && p.reservedFor !== (leadId || clientId) && p.reservedFor !== clientId) throw new Error(`${plotLabel(p)} is reserved for someone else.`); const act = activeSaleOfPlot(p.id); if (act) throw new Error(`${plotLabel(p)} already belongs to sale ${act.no}.`); }
  const plan = estate.plans.find(x => x.id === planId); if (!plan) throw new Error('Choose a payment plan.');
  const base = sum(plots, p => p.price), total = Math.round(base * (1 + (plan.uplift || 0) / 100)), d = date || today();
  const schedule = buildSchedule(total, plan, d);
  const no = 'SL-' + d.slice(0, 4) + '-' + String(DB.seq('sale')).padStart(4, '0');
  const sale = DB.add('sales', { no, clientId, estateId: estate.id, plotIds, planId, planName: plan.name, months: plan.months, base, total, deposit: schedule[0].amount, schedule, paid: 0, officer: officer || SESS.uid, realtorId: realtorId || '', date: d, status: 'pending', leadId: leadId || '' });
  const hold = DB.setting('reservationDays');
  plots.forEach(p => { if (p.status === 'available') setPlotStatus(p, 'reserved', 'Sale ' + no, { reservedUntil: addDays(d, hold), reservedFor: clientId, saleId: sale.id, clientId }); else DB.set('plots', p.id, { reservedUntil: addDays(d, hold), saleId: sale.id, clientId, reservedFor: clientId }); });
  postJournal({ date: d, memo: 'Sale booked ' + no, lines: [{ acct: '1100', dr: total }, { acct: '4000', cr: total }], source: 'sale', ref: sale.id, quiet: true, force: true });
  tripaySend('plan.published', { sale: no, client: clientId, total, schedule: schedule.length });
  return sale;
}
function refreshSale(s) {
  let left = sum(DB.q('payments').filter(p => p.saleId === s.id && p.status === 'confirmed'), p => p.amount); const paid = left;
  const sch = s.schedule.map(r => { const a = Math.min(r.amount, left); left -= a; return { ...r, paid: a }; });
  const complete = paid >= s.total - 0.5;
  DB.set('sales', s.id, { schedule: sch, paid, status: complete ? 'completed' : (s.status === 'pending' && paid >= s.deposit - 0.5 ? 'active' : s.status) }, { quiet: true });
  return DB.get('sales', s.id);
}
const saleBalance = s => Math.max(0, s.total - s.paid);
function overdueItems() {
  const t = today(); const out = [];
  DB.q('sales').filter(s => ['active', 'pending'].includes(s.status)).forEach(s => s.schedule.forEach(r => { if (r.due < t && r.paid < r.amount - 0.5 && !(s.status === 'pending' && r.no === 0)) out.push({ id: s.id + ':' + r.no, sale: s, row: r, days: daysBetween(r.due, t), out: r.amount - r.paid }); }));
  return out;
}
function recordPayment({ saleId, amount, method, channel = 'offline', date, ref, proof, proofName, note }) {
  const s = DB.get('sales', saleId); if (!s) throw new Error('Choose a sale.'); if (!(amount > 0)) throw new Error('Enter an amount above zero.');
  if (amount > saleBalance(s) + 1) throw new Error('This amount is more than the outstanding balance of ' + money(saleBalance(s)) + '.');
  const p = DB.add('payments', { saleId, clientId: s.clientId, amount, method, channel, date: date || today(), ref: ref || '', proof: proof || '', proofName: proofName || '', note: note || '', status: 'pending', recordedBy: channel === 'tripay' ? 'tripay' : SESS.uid, confirmations: [], ts: Date.now() });
  if (channel === 'tripay') tripaySend('payment.proof', { payment: p.id, sale: s.no, amount }, 'in'); else tripaySend('payment.recorded', { payment: p.id, sale: s.no, amount, method });
  return p;
}
const needConfirms = p => (p.amount >= DB.setting('secondApprovalAmount') ? 2 : 1);
function confirmPayment(id) {
  const p = DB.get('payments', id); const u = me();
  if (!can('fin.confirm') && !can('fin.confirm2')) throw new Error('Only Finance officers can confirm payments.');
  if (p.recordedBy === u.id) throw new Error('You recorded this payment, so someone else must confirm it.');
  if ((p.confirmations || []).some(c => c.by === u.id)) throw new Error('You have already confirmed this payment. A second officer must confirm it.');
  const conf = (p.confirmations || []).concat([{ by: u.id, at: Date.now() }]);
  const need = needConfirms(p);
  if (conf.length < need) { DB.set('payments', id, { confirmations: conf, status: 'awaiting second' }, { action: 'confirm-1' }); usersWithRole('finance').concat(usersWithRole('companyexec')).filter(x => x.id !== u.id).forEach(x => notify(x.id, 'Second confirmation needed', money(p.amount) + ' · ' + (DB.get('sales', p.saleId)?.no || ''), '#/finance/confirm')); return 'first'; }
  DB.set('payments', id, { confirmations: conf, status: 'confirmed', confirmedAt: Date.now(), receiptNo: 'RC-' + today().slice(0, 4) + '-' + String(DB.seq('receipt')).padStart(5, '0') }, { action: 'confirm' });
  const pay = DB.get('payments', id); const sale = refreshSale(DB.get('sales', pay.saleId));
  postJournal({ date: pay.date > today() ? today() : pay.date, memo: 'Payment ' + pay.receiptNo + ' · ' + sale.no, lines: [{ acct: pay.method === 'Cash' ? '1020' : '1010', dr: pay.amount }, { acct: '1100', cr: pay.amount }], source: 'payment', ref: pay.id, quiet: true });
  afterPayment(sale, pay);
  const doc = issueDoc('receipt', { payment: pay, sale, client: DB.get('clients', sale.clientId) }); DB.set('payments', id, { docCode: doc.code }, { quiet: true });
  tripaySend('payment.confirmed', { payment: id, receipt: pay.receiptNo }); tripaySend('receipt.released', { receipt: pay.receiptNo, verify: doc.code });
  const cl = DB.get('clients', sale.clientId); if (cl) { sendExternal('sms', cl.phone, `Triconna: payment of ${money(pay.amount)} confirmed. Receipt ${pay.receiptNo}.`); sendExternal('email', cl.email, `Receipt ${pay.receiptNo} for ${money(pay.amount)}`); }
  return 'done';
}
function rejectPayment(id, reason) {
  const p = DB.get('payments', id); DB.set('payments', id, { status: 'rejected', rejectReason: reason, rejectedBy: SESS.uid, rejectedAt: Date.now() }, { action: 'reject' });
  tripaySend('payment.rejected', { payment: id, reason }); const cl = DB.get('clients', p.clientId); if (cl) sendExternal('sms', cl.phone, 'Triconna: we could not confirm your payment. Reason: ' + reason);
}
function afterPayment(sale, pay) {
  const plots = sale.plotIds.map(i => DB.get('plots', i));
  if (sale.status === 'active' || sale.status === 'completed') {
    plots.forEach(p => { if (p.status === 'reserved') { setPlotStatus(p, 'allocated', 'Deposit confirmed (' + pay.receiptNo + ')', { reservedUntil: '' }); } });
    if (!DB.q('commissions').some(c => c.saleId === sale.id)) createCommissions(sale);
    if (sale.leadId) { const ld = DB.get('leads', sale.leadId); if (ld && ld.stage !== 'Won') DB.set('leads', ld.id, { stage: 'Won', lastTouch: Date.now() }, { quiet: true }); }
    if (!(sale.notified || {}).alloc) { notifyClientMilestone(sale, 'allocation'); DB.set('sales', sale.id, { notified: { ...(sale.notified || {}), alloc: true } }, { quiet: true }); }
  }
  if (sale.status === 'completed') {
    plots.forEach(p => { const q = DB.get('plots', p.id); if (q.status === 'allocated') setPlotStatus(q, 'paid', 'Fully paid', { docs: q.docs || { survey: { s: 'Pending' }, deed: { s: 'Pending' }, cofo: { s: 'Pending' } } }); });
    notifyClientMilestone(sale, 'full payment'); DB.q('tickets');
    const t = DB.add('tasks', { title: 'Start title documentation · ' + sale.no, desc: 'Sale fully paid. Prepare survey, deed of assignment and C of O.', assignee: deptHead('Operations') || sale.officer, due: addDays(today(), 14), priority: 'High', status: 'todo', link: { type: 'sale', id: sale.id }, history: [], comments: [], auto: 'docs', project: '' }, { quiet: true });
  }
}
function notifyClientMilestone(sale, what) { const cl = DB.get('clients', sale.clientId); if (cl) { sendExternal('sms', cl.phone, `Triconna: your ${what} milestone for ${sale.no} is recorded.`); DB.add('interactions', { clientId: cl.id, type: 'System', note: 'Milestone notification sent: ' + what, ts: Date.now(), by: 'system' }, { quiet: true }); } }
function createCommissions(sale) {
  const rl = DB.get('realtors', sale.realtorId); if (!rl) return; const r = DB.setting('commissionRates');
  const rate = rl.level === 'Maverick' ? r.Maverick : r.Associate;
  DB.add('commissions', { saleId: sale.id, realtorId: rl.id, type: 'Sales commission', base: sale.total, rate, amount: Math.round(sale.total * rate / 100), status: 'calculated' }, { quiet: true });
  if (rl.source === 'Referral' && rl.sourceRef) { const up = DB.get('realtors', rl.sourceRef); if (up) DB.add('commissions', { saleId: sale.id, realtorId: up.id, type: 'Referral (3%)', base: sale.total, rate: r.Referral, amount: Math.round(sale.total * r.Referral / 100), status: 'calculated' }, { quiet: true }); }
  if (rl.source === 'Ads: Consultant campaign' && rl.sourceRef) { const cm = DB.get('campaigns', rl.sourceRef); if (cm) DB.add('commissions', { saleId: sale.id, realtorId: 'consultant:' + cm.id, type: 'Consultant (3%)', base: sale.total, rate: r.Referral, amount: Math.round(sale.total * r.Referral / 100), status: 'calculated' }, { quiet: true }); }
}
function commissionPayee(c) { if (String(c.realtorId).startsWith('consultant:')) { const cm = DB.get('campaigns', c.realtorId.split(':')[1]); return 'Consultant · ' + (cm ? cm.consultant : ''); } const r = DB.get('realtors', c.realtorId); return r ? r.name : '—'; }

/* ---------- Tri-Pay integration (sandbox) ---------- */
function tripaySend(event, payload, dir = 'out') {
  const key = event + ':' + rid(); const sig = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return DB.add('webhooks', { event, dir, key, sig, payload, status: 'delivered', attempts: 1, ts: Date.now() }, { quiet: true });
}

/* ---------- approvals engine ---------- */
const APPROVAL_LABEL = { sourcefix: 'Realtor source correction', expense: 'Expense requisition', journal: 'Manual journal', commission: 'Commission payout', leave: 'Leave request', transfer: 'Plot transfer', restructure: 'Plan restructure', revocation: 'Plot revocation', reopen: 'Period reopen', refund: 'Refund' };
const STEP_LABEL = { manager: 'Line manager', hod: 'Head of department', finance: 'Finance officer', exec: 'Executive', opsdir: 'Operations Director', hr: 'HR officer' };
function chainFor(type, amount) { const rule = DB.q('rules').find(r => r.type === type); if (!rule) return ['opsdir']; const tier = rule.tiers.find(t => t.max == null || amount <= t.max) || rule.tiers[rule.tiers.length - 1]; return tier.steps.slice(); }
function startApproval({ type, ref, title, amount = 0, requester, meta = {}, chain }) {
  const steps = (chain || chainFor(type, amount)).map(k => ({ key: k, status: 'pending' }));
  const a = DB.add('approvals', { type, ref, title, amount, requester: requester || SESS.uid, steps, cur: 0, status: steps.length ? 'pending' : 'approved', meta, ts: Date.now() });
  if (!steps.length) finishApproval(a, true); else notifyStep(a);
  return a;
}
function baseActors(step, a) {
  const req = a.requester, u = userById(req); let ids = [];
  switch (step.key) {
    case 'manager': ids = [managerOf(req)]; break;
    case 'hod': ids = [deptHead(u?.dept)]; break;
    case 'finance': ids = usersWithRole('finance').map(x => x.id); break;
    case 'hr': ids = usersWithRole('hr').map(x => x.id); break;
    case 'exec': ids = usersWithRole('companyexec').concat(usersWithRole('groupexec')).map(x => x.id); break;
    case 'opsdir': ids = DB.d.users.filter(x => x.co.includes(CO) && (x.flags || []).includes('opsdirector')).map(x => x.id).concat(usersWithRole('companyexec').map(x => x.id)); break;
  }
  return uniq(ids.filter(Boolean));
}
function stepActors(a, step = a.steps[a.cur]) {
  if (!step) return []; const base = baseActors(step, a); const t = today(); const ids = new Set(base);
  base.forEach(id => { const x = userById(id); if (x?.deleg && x.deleg.to && x.deleg.until >= t) ids.add(x.deleg.to); if (onLeaveToday(id)) { const d = x?.deleg?.to || x?.deputy; if (d) ids.add(d); } });
  DB.d.users.forEach(x => { if (x.role === 'groupexec' && step.key !== 'manager' && x.co.includes(CO)) ids.add(x.id); });
  ids.delete(a.requester); (a.steps.filter(s => s.status === 'approved').map(s => s.by)).forEach(b => ids.delete(b));
  return [...ids];
}
const onLeaveToday = uid => DB.q('leaves').some(l => l.userId === uid && l.status === 'approved' && l.from <= today() && l.to >= today());
function notifyStep(a) { stepActors(a).forEach(id => notify(id, 'Approval needed: ' + a.title, (APPROVAL_LABEL[a.type] || a.type) + (a.amount ? ' · ' + money(a.amount) : '') + ' · from ' + userName(a.requester), '#/approvals')); }
const canDecide = a => a.status === 'pending' && stepActors(a).includes(SESS.uid);
function decide(id, verdict, note = '') {
  const a = DB.get('approvals', id); if (!canDecide(a)) throw new Error('You cannot decide this request. You may be the requester, or it is waiting on someone else.');
  const steps = a.steps.map((s, i) => i === a.cur ? { ...s, status: verdict, by: SESS.uid, at: Date.now(), note } : s);
  if (verdict === 'rejected') { DB.set('approvals', id, { steps, status: 'rejected' }, { action: 'reject' }); finishApproval(DB.get('approvals', id), false, note); return; }
  const next = a.cur + 1;
  if (next >= steps.length) { DB.set('approvals', id, { steps, status: 'approved', cur: next }, { action: 'approve' }); finishApproval(DB.get('approvals', id), true); }
  else { DB.set('approvals', id, { steps, cur: next }, { action: 'approve-step' }); notifyStep(DB.get('approvals', id)); }
}
function finishApproval(a, ok, note) {
  const h = APPR[a.type]; if (h) { if (ok && h.ok) h.ok(a); if (!ok && h.no) h.no(a, note); }
  notify(a.requester, (ok ? 'Approved: ' : 'Rejected: ') + a.title, note || '', a.meta?.link || '#/approvals');
}
const APPR = {
  expense: {
    ok(a) { const e = DB.get('expenses', a.ref); if (!e) return; DB.set('expenses', e.id, { status: 'approved' }, { quiet: true }); try { const ex = EXP_ACCT[e.category] || '5500'; postJournal({ date: today(), memo: 'Expense ' + e.no + ' · ' + e.desc, lines: [{ acct: ex, dr: e.amount, dept: e.dept }, { acct: '2200', cr: e.amount }], source: 'expense', ref: e.id, quiet: true }); } catch (x) { DB.set('expenses', e.id, { postError: x.message }, { quiet: true }); } },
    no(a, n) { DB.set('expenses', a.ref, { status: 'rejected', rejectReason: n }, { quiet: true }); }
  },
  journal: {
    ok(a) { const j = DB.get('journals', a.ref); if (!j) return; if (periodClosed(j.date)) { DB.set('journals', j.id, { status: 'rejected', note: 'Period closed' }); return; } DB.set('journals', j.id, { status: 'posted', approvedBy: a.steps.map(s => s.by).filter(Boolean) }, { quiet: true }); },
    no(a, n) { DB.set('journals', a.ref, { status: 'rejected', note: n }, { quiet: true }); }
  },
  commission: {
    ok(a) { const c = DB.get('commissions', a.ref); if (!c) return; DB.set('commissions', c.id, { status: 'approved', approvedAt: Date.now() }, { quiet: true }); try { postJournal({ date: today(), memo: 'Commission ' + commissionPayee(c) + ' · ' + (DB.get('sales', c.saleId)?.no || ''), lines: [{ acct: '5100', dr: c.amount, dept: 'Sales' }, { acct: '2100', cr: c.amount }], source: 'commission', ref: c.id, quiet: true }); } catch (x) { } },
    no(a, n) { DB.set('commissions', a.ref, { status: 'calculated', note: 'Returned: ' + n }, { quiet: true }); }
  },
  leave: {
    ok(a) { DB.set('leaves', a.ref, { status: 'approved' }, { quiet: true }); const l = DB.get('leaves', a.ref); const e = empOf(l.userId); if (e && l.type === 'Annual') { DB.set('employees', e.id, { leaveTaken: (e.leaveTaken || 0) + l.days }, { quiet: true }); } },
    no(a, n) { DB.set('leaves', a.ref, { status: 'rejected', note: n }, { quiet: true }); }
  },
  transfer: {
    ok(a) { const m = a.meta; const s = DB.get('sales', a.ref); if (!s) return; DB.set('sales', s.id, { clientId: m.toClient, history: (s.history || []).concat([{ ts: Date.now(), what: 'Transferred from ' + (DB.get('clients', s.clientId)?.name || '') + ' to ' + (DB.get('clients', m.toClient)?.name || '') }]) }); s.plotIds.forEach(p => DB.set('plots', p, { clientId: m.toClient })); tripaySend('plan.updated', { sale: s.no, transfer: m.toClient }); issueDoc('allocation', { sale: DB.get('sales', s.id), client: DB.get('clients', m.toClient), plots: s.plotIds.map(i => DB.get('plots', i)) }); },
    no() { }
  },
  restructure: {
    ok(a) { const m = a.meta; const s = DB.get('sales', a.ref); if (!s) return; const plan = estateOf(s.estateId).plans.find(p => p.id === m.planId); if (!plan) return; const remaining = s.total - s.paid; const sch = [{ no: 0, label: 'Paid to date', due: s.date, amount: s.paid, paid: s.paid }]; const each = Math.floor(remaining / plan.months / 100) * 100; for (let i = 1; i <= plan.months; i++) sch.push({ no: i, label: 'Instalment ' + i + ' of ' + plan.months, due: addMonths(today(), i), amount: i === plan.months ? remaining - each * (plan.months - 1) : each, paid: 0 }); DB.set('sales', s.id, { schedule: sch, planName: plan.name + ' (restructured)', months: plan.months, history: (s.history || []).concat([{ ts: Date.now(), what: 'Restructured to ' + plan.name }]) }); tripaySend('plan.updated', { sale: s.no, plan: plan.name }); },
    no() { }
  },
  revocation: {
    ok(a) {
      const s = DB.get('sales', a.ref); if (!s) return; const refund = a.meta.refund || 0; const out = s.total - s.paid;
      try { if (out > 0) postJournal({ date: today(), memo: 'Revocation ' + s.no + ': reverse outstanding', lines: [{ acct: '4000', dr: out }, { acct: '1100', cr: out }], source: 'revocation', ref: s.id, quiet: true }); if (refund > 0) postJournal({ date: today(), memo: 'Refund ' + s.no, lines: [{ acct: '4000', dr: refund }, { acct: '1010', cr: refund }], source: 'refund', ref: s.id, quiet: true }); } catch (x) { }
      DB.set('sales', s.id, { status: 'revoked', history: (s.history || []).concat([{ ts: Date.now(), what: 'Revoked. Refund ' + money(refund) }]) });
      s.plotIds.forEach(pid => { const p = DB.get('plots', pid); if (['allocated', 'paid', 'documented'].includes(p.status)) setPlotStatus(p, 'revoked', 'Sale ' + s.no + ' revoked'); const q = DB.get('plots', pid); if (q.status === 'reserved') setPlotStatus(q, 'available', 'Sale revoked'); DB.set('plots', pid, { clientId: '', saleId: '' }); });
      DB.q('commissions').filter(c => c.saleId === s.id && c.status === 'calculated').forEach(c => DB.set('commissions', c.id, { status: 'cancelled' }, { quiet: true })); tripaySend('plan.cancelled', { sale: s.no }); issueDoc('revocation', { sale: DB.get('sales', s.id), client: DB.get('clients', s.clientId), refund });
    }, no() { }
  },
  reopen: { ok(a) { DB.set('periods', a.ref, { status: 'open', reopened: (DB.get('periods', a.ref).reopened || []).concat([{ ts: Date.now(), by: a.steps.map(s => s.by).filter(Boolean).join(','), reason: a.meta.reason }]) }, { action: 'reopen' }); }, no() { } }
};
const EXP_ACCT = { 'Marketing': '5300', 'Rent & utilities': '5400', 'Office & admin': '5500', 'Travel & logistics': '5600', 'Professional fees': '5700', 'Training': '5800', 'Site works': '5000', 'Salaries': '5200', 'Other': '5500' };
const EXP_CATS = Object.keys(EXP_ACCT);
function requestLeave(v) {
  const l = DB.add('leaves', { userId: SESS.uid, type: v.type, from: v.from, to: v.to, days: leaveDays(v.from, v.to), reason: v.reason || '', status: 'pending' });
  startApproval({ type: 'leave', ref: l.id, title: v.type + ' leave · ' + userName(SESS.uid) + ' · ' + l.days + ' day' + (l.days > 1 ? 's' : ''), meta: { link: '#/hr/leave' } }); return l;
}
function leaveDays(from, to) { let n = 0; for (let d = from; d <= to; d = addDays(d, 1)) { const w = new Date(d + 'T00:00:00').getDay(); if (w !== 0 && w !== 6) n++; } return Math.max(n, 1); }

/* ---------- documents (PLT-03) ---------- */
function qrSvg(text, cell = 3) {
  try { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell, margin: 0, scalable: true }); } catch (e) { return ''; }
}
const verifyUrl = code => location.href.split('#')[0] + '#/verify/' + code;
function fillTpl(body, ctx) { return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, p) => { const v = p.split('.').reduce((o, k) => o == null ? o : o[k], ctx); return v == null ? '' : esc(v); }); }
function docContext(type, o) {
  const c = company(); const sale = o.sale, client = o.client || (sale && DB.get('clients', sale.clientId)); const plots = o.plots || (sale ? sale.plotIds.map(i => DB.get('plots', i)) : []); const estate = sale ? estateOf(sale.estateId) : (plots[0] && estateOf(plots[0].estate));
  return { company: c, date: fmtDate(today()), client: client || {}, sale: sale ? { ...sale, totalF: money(sale.total), paidF: money(sale.paid), balanceF: money(saleBalance(sale)), depositF: money(sale.deposit), dateF: fmtDate(sale.date) } : {}, estate: estate || {}, plotsText: plots.map(p => p.no + (p.sqm ? ' (' + p.sqm + ' sqm)' : '')).join(', '), payment: o.payment ? { ...o.payment, amountF: money(o.payment.amount), dateF: fmtDate(o.payment.date) } : {}, refund: money(o.refund || 0), officer: sale ? userName(sale.officer) : '', balanceF: sale ? money(saleBalance(sale)) : '' };
}
function issueDoc(type, o) {
  const tpl = DB.q('templates').find(t => t.type === type); const ctx = docContext(type, o); const code = 'TRC-' + (Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4)).toUpperCase();
  const html = tpl ? fillTpl(tpl.body, ctx) : '<p>No template configured for ' + esc(type) + '.</p>';
  return DB.add('docsLog', { code, type, title: tpl ? tpl.name : type, ref: (o.payment?.id) || (o.sale?.id) || '', html, ts: Date.now(), issuedBy: SESS.uid || 'system', client: ctx.client.name || '', saleNo: ctx.sale.no || '' }, { quiet: true });
}
function docSheet(d) {
  const c = company();
  return `<div class="doc"><div class="lh"><div class="row" style="gap:12px"><span style="width:42px;display:block">${logoSvg('#008C38').replace('#001F10', '#fff')}</span><b>${esc(c.name)}</b></div><span class="small">${esc(c.address || '')}</span></div><div class="qr">${qrSvg(verifyUrl(d.code))}<div class="small" style="text-align:center;margin-top:2px">${esc(d.code)}</div></div><h2 style="font-size:19px;margin-bottom:12px">${esc(d.title)}</h2>${d.html}<div class="foot">Verify this document: scan the QR code or visit ${esc(verifyUrl(d.code))} · Issued ${fmtDT(d.ts)}</div></div>`;
}
function openDoc(code) {
  const d = DB.d.docsLog.find(x => x.code === code); if (!d) return toast('Document not found.', 'bad');
  openModal({ title: esc(d.title), xl: true, body: docSheet(d), foot: `<button class="btn" data-act="ov.close">Close</button><button class="btn primary" data-act="doc.print" data-code="${code}">${icon('download', 'sm')} Print or save PDF</button>`, live: false });
}
ACT['doc.print'] = el => { const d = DB.d.docsLog.find(x => x.code === el.dataset.code); printHtml(docSheet(d)); };
ACT['doc.open'] = el => openDoc(el.dataset.code);

/* ---------- performance / KPI sources ---------- */
const KPI_SOURCES = {
  'sales.count': { l: 'Sales closed (count)', f: (u, m) => DB.q('sales').filter(s => s.officer === u && monthKey(s.date) === m && s.status !== 'revoked').length },
  'sales.value': { l: 'Sales value (₦)', f: (u, m) => sum(DB.q('sales').filter(s => s.officer === u && monthKey(s.date) === m && s.status !== 'revoked'), s => s.total), money: true },
  'collections': { l: 'Payments confirmed (₦)', f: (u, m) => sum(DB.q('payments').filter(p => p.status === 'confirmed' && monthKey(p.date) === m && (p.confirmations || []).some(c => c.by === u)), p => p.amount), money: true },
  'tasks.ontime': { l: 'Tasks on time (%)', f: (u, m) => { const t = DB.q('tasks').filter(x => x.assignee === u && x.status === 'done' && x.doneAt && monthKey(isoDate(x.doneAt)) === m); return t.length ? pct(t.filter(x => !x.due || isoDate(x.doneAt) <= x.due).length, t.length) : null; } },
  'tasks.done': { l: 'Tasks completed', f: (u, m) => DB.q('tasks').filter(x => x.assignee === u && x.status === 'done' && x.doneAt && monthKey(isoDate(x.doneAt)) === m).length },
  'attendance': { l: 'Punctuality (%)', f: (u, m) => { const a = DB.q('attendance').filter(x => x.userId === u && monthKey(x.date) === m); return a.length ? pct(a.filter(x => !x.late).length, a.length) : null; } },
  'tickets.resolved': { l: 'Tickets resolved', f: (u, m) => DB.q('tickets').filter(t => t.owner === u && t.resolvedAt && monthKey(isoDate(t.resolvedAt)) === m).length },
  'tickets.sla': { l: 'Tickets within SLA (%)', f: (u, m) => { const t = DB.q('tickets').filter(x => x.owner === u && x.resolvedAt && monthKey(isoDate(x.resolvedAt)) === m); return t.length ? pct(t.filter(x => x.resolvedAt <= x.slaDue).length, t.length) : null; } },
  'learn.score': { l: 'Assessment score (%)', f: (u, m) => { const a = DB.q('attempts').filter(x => x.userId === u && x.submitted && monthKey(isoDate(x.submitted)) === m); return a.length ? Math.round(sum(a, x => x.score) / a.length) : null; } },
  'reports.ontime': { l: 'Reports on time (%)', f: (u, m) => { const r = DB.q('reports').filter(x => x.by === u && x.submittedAt && x.period.slice(0, 7) <= m); return r.length ? pct(r.filter(x => isoDate(x.submittedAt) <= x.deadline).length, r.length) : null; } },
  'rlt.recruits': { l: 'Realtors registered', f: (u, m) => DB.q('realtors').filter(r => r.registeredBy === u && monthKey(r.created ? isoDate(r.created) : '') === m).length },
  'manual': { l: 'Manual entry', f: null }
};
function kpiActual(k, userId, month) { if (k.source === 'manual') { const v = DB.q('kpiVals').find(x => x.kpi === k.id && x.userId === userId && x.month === month); return v ? v.value : null; } return KPI_SOURCES[k.source].f(userId, month); }
function kpiStatus(k, actual) { if (actual == null) return { s: 'mute', l: 'No data', r: null }; const r = k.dir === 'low' ? (actual === 0 ? 2 : k.target / actual) : actual / (k.target || 1); return r >= 1 ? { s: 'g', l: 'On track', r } : r >= .7 ? { s: 'a', l: 'At risk', r } : { s: 'r', l: 'Off track', r }; }

/* ---------- scheduled jobs ---------- */
const Jobs = {
  run() {
    if (!SESS.uid) return; const co0 = CO; let n = 0;
    try { DB.d.companies.forEach(c => { CO = c.id; n += Jobs.company(); }); } finally { CO = co0; }
    if (n) { DB.dirty(); if (typeof renderBadge === 'function') renderBadge(); }
  },
  company() {
    let n = 0; const t = today(), now = Date.now(), st = k => DB.setting(k);
    /* INV-03 reservation expiry */
    DB.q('plots').filter(p => p.status === 'reserved' && p.reservedUntil && p.reservedUntil < t).forEach(p => {
      const s = p.saleId && DB.get('sales', p.saleId); if (s && s.status === 'pending' && s.plotIds.includes(p.id)) { DB.set('sales', s.id, { status: 'expired' }, { quiet: true }); s.plotIds.forEach(id => { const q = DB.get('plots', id); if (q.status === 'reserved') setPlotStatus(q, 'available', 'Reservation expired without deposit', { reservedUntil: '', reservedFor: '', saleId: '', clientId: '' }); }); DB.q('journals').filter(j => j.ref === s.id && j.source === 'sale').forEach(j => DB.set('journals', j.id, { status: 'reversed' }, { quiet: true })); notify(s.officer, 'Reservation expired: ' + plotLabel(p), 'No deposit confirmed within ' + st('reservationDays') + ' days. The plot is available again.', '#/inventory/plots'); n++; }
      else if (!s) { setPlotStatus(p, 'available', 'Reservation expired', { reservedUntil: '', reservedFor: '' }); n++; }
    });
    /* CRM-06 stale leads */
    const officers = salesOfficers(); DB.q('leads').filter(l => l.stage === 'New' && now - (l.lastTouch || l.created) > st('staleLeadHours') * 3600e3 && officers.length > 1 && !l.reassignedAt).forEach(l => { const idx = officers.findIndex(o => o.id === l.officer); const nx = officers[(idx + 1) % officers.length]; DB.set('leads', l.id, { officer: nx.id, reassignedAt: now, lastTouch: now, reassignCount: (l.reassignCount || 0) + 1 }, { action: 'auto-reassign' }); notify(nx.id, 'Lead reassigned to you: ' + l.name, 'Untouched for ' + st('staleLeadHours') + '+ hours', '#/crm/leads'); n++; });
    /* RLT-06 realtor stalls */
    DB.q('realtors').filter(r => !['Inducted (Associate)', 'Maverick', 'Inactive', 'Exited'].includes(r.stage) && t > addDays(isoDate(r.lastActivity || r.created), st('realtorStallDays')) && !DB.q('tasks').some(x => x.auto === 'rlt-stall' && x.link?.id === r.id && x.status !== 'done')).forEach(r => { const head = deptHead('Realtors Development'); DB.add('tasks', { title: 'Follow up stalled realtor · ' + r.name, desc: 'No activity for ' + st('realtorStallDays') + '+ days at stage "' + r.stage + '".', assignee: head, due: addDays(t, 2), priority: 'Medium', status: 'todo', link: { type: 'realtor', id: r.id }, auto: 'rlt-stall', comments: [], history: [] }, { quiet: true }); n++; });
    /* OPS-06 reminders & escalation */
    DB.q('tasks').filter(x => x.status !== 'done' && x.due).forEach(x => {
      const late = daysBetween(x.due, t);
      if (late === -1 && !x.rem) { notify(x.assignee, 'Due tomorrow: ' + x.title, '', '#/work/tasks'); DB.set('tasks', x.id, { rem: 1 }, { quiet: true }); n++; }
      if (late >= 1 && (x.esc || 0) < 1) { notify(x.assignee, 'Overdue: ' + x.title, 'Due ' + fmtDate(x.due), '#/work/tasks'); DB.set('tasks', x.id, { esc: 1 }, { quiet: true }); n++; }
      if (late >= 3 && (x.esc || 0) < 2) { const m = managerOf(x.assignee); notify(m, 'Escalated: ' + x.title, userName(x.assignee) + ' · ' + late + ' days overdue', '#/work/tasks'); DB.set('tasks', x.id, { esc: 2 }, { quiet: true }); n++; }
      if (late >= 7 && (x.esc || 0) < 3) { const h = deptHead(userById(x.assignee)?.dept); notify(h, 'Escalated to HOD: ' + x.title, userName(x.assignee) + ' · ' + late + ' days overdue', '#/work/tasks'); DB.set('tasks', x.id, { esc: 3 }, { quiet: true }); n++; }
    });
    /* OPS-05 recurring tasks */
    DB.q('tasks').filter(x => x.recur && x.recur.next && x.recur.next <= t).forEach(x => { const f = x.recur.freq; const nxt = f === 'daily' ? addDays(x.recur.next, 1) : f === 'weekly' ? addDays(x.recur.next, 7) : addMonths(x.recur.next, 1); DB.add('tasks', { ...x, id: undefined, created: undefined, title: x.title, status: 'todo', due: x.recur.next, recur: null, doneAt: null, esc: 0, rem: 0, comments: [], history: [{ ts: now, by: 'system', what: 'Created from recurring task' }], checklist: (x.checklist || []).map(c => ({ ...c, done: false })), fromRecur: x.id }, { quiet: true }); DB.set('tasks', x.id, { recur: { ...x.recur, next: nxt } }, { quiet: true }); n++; });
    /* FIN-06 collections follow-up tasks */
    overdueItems().forEach(o => { const key = o.id; const fu = DB.q('collections').some(c => c.key === key && now - c.ts < st('followupHours') * 3600e3); if (!fu && !DB.q('tasks').some(x => x.collKey === key && x.status !== 'done')) { const cl = DB.get('clients', o.sale.clientId); DB.add('tasks', { title: 'Collect ' + money(o.out) + ' · ' + (cl?.name || '') + ' · ' + o.sale.no, desc: o.row.label + ' was due ' + fmtDate(o.row.due) + ' (' + o.days + ' days overdue).', assignee: o.sale.officer, due: addDays(t, 1), priority: o.days > 30 ? 'High' : 'Medium', status: 'todo', link: { type: 'sale', id: o.sale.id }, collKey: key, auto: 'collection', comments: [], history: [] }, { quiet: true }); n++; } if (o.days > 90 && !DB.q('tasks').some(x => x.collKey === key + ':dr' && x.status !== 'done')) { DB.add('tasks', { title: 'Default review · ' + (DB.get('clients', o.sale.clientId)?.name || '') + ' · ' + o.sale.no, desc: 'More than 90 days overdue. Decide: restructure, final notice or revoke.', assignee: usersWithRole('companyexec')[0]?.id || deptHead('Operations'), due: addDays(t, 5), priority: 'Urgent', status: 'todo', link: { type: 'sale', id: o.sale.id }, collKey: key + ':dr', auto: 'collection', comments: [], history: [] }, { quiet: true }); n++; } });
    /* CX-02 SLA */
    DB.q('tickets').filter(x => !['Resolved', 'Closed'].includes(x.status) && !x.breached && x.slaDue < now).forEach(x => { DB.set('tickets', x.id, { breached: true, priority: x.priority === 'Low' ? 'Medium' : x.priority === 'Medium' ? 'High' : 'Urgent', escalated: true }, { action: 'sla-breach' }); notify(deptHead('Customer Experience') || x.owner, 'SLA breached: ' + x.no, x.subject, '#/cx/tickets', true); n++; });
    /* HR-06 missed clock-out */
    DB.q('attendance').filter(a => a.date < t && a.in && !a.out && !a.missed).forEach(a => { DB.set('attendance', a.id, { missed: true }, { quiet: true }); notify(a.userId, 'You did not clock out on ' + fmtDate(a.date), 'Request a correction from your line manager.', '#/hr/attendance'); n++; });
    /* HR-02 document expiry */
    DB.q('vault').filter(v => v.expiry && v.expiry <= addDays(t, 30) && !v.alerted).forEach(v => { usersWithRole('hr').forEach(u => notify(u.id, 'Document expiring: ' + v.name, userName(DB.q('employees').find(e => e.id === v.empId)?.userId) + ' · ' + fmtDate(v.expiry), '#/hr/vault')); DB.set('vault', v.id, { alerted: true }, { quiet: true }); n++; });
    /* LND-02 session reminders */
    DB.q('sessions').filter(s => s.date === addDays(t, 1) && !s.reminded).forEach(s => { (s.invitees || []).forEach(u => notify(u, 'Training tomorrow: ' + s.title, fmtDate(s.date) + ' ' + (s.time || ''), '#/learning/calendar')); DB.set('sessions', s.id, { reminded: true }, { quiet: true }); n++; });
    Jobs.extra.forEach(f => { try { n += f() || 0; } catch (e) { console.error(e); } });
    return n;
  },
  extra: []
};
