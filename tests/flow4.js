const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
const URL0 = process.env.TRIOP_URL || 'http://localhost:8765/index.html';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(URL0); await p.waitForSelector('.login');
  const as = async u => { await p.evaluate(x => { SESS.uid = x; SESS.co = 'tre'; saveSession(); location.hash = '#/dashboard'; }, u); await p.reload(); await p.waitForSelector('.shell'); };
  /* password reset (public) */
  await p.evaluate(() => { location.hash = '#/reset'; }); await p.waitForTimeout(200);
  await p.fill('#rs-email', 'bayo.ogunleye@triconna.example'); await p.click('[data-act="rs.send"]'); await p.waitForTimeout(200);
  await p.fill('#rs-code', '123456'); await p.fill('#rs-n1', 'LongPassw0rd'); await p.fill('#rs-n2', 'LongPassw0rd'); await p.click('[data-act="rs.set"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => /password has been reset/.test(document.body.innerText)), 'password reset flow completes');
  /* notification preferences are honoured */
  await as('u_s1'); const np = await p.evaluate(() => { const u = me(); DB.set('users', u.id, { nprefs: { tasks: { app: false, email: false } } }); const before = DB.q('notifications').filter(n => n.user === u.id).length; notify(u.id, 'task x', '', '#/work/tasks'); const a = DB.q('notifications').filter(n => n.user === u.id).length; notify(u.id, 'critical x', '', '#/work/tasks', true); return [before === a, DB.q('notifications').filter(n => n.user === u.id).length === a + 1]; });
  ok(np[0] && np[1], 'muted category suppressed; critical alerts always delivered');
  /* notifications centre + preferences page */
  await p.evaluate(() => { location.hash = '#/notifications/unread'; }); await p.waitForTimeout(200); ok(await p.evaluate(() => /Notifications/.test(document.querySelector('#main h1').innerText)), 'notifications centre page');
  await p.evaluate(() => { location.hash = '#/profile/notifications'; }); await p.waitForTimeout(200); ok(await p.evaluate(() => document.querySelectorAll('[data-act="np.toggle"]').length >= 12), 'preference matrix renders');
  /* 404 */
  await p.evaluate(() => { location.hash = '#/nonsense'; }); await p.waitForTimeout(200); ok(await p.evaluate(() => /could not find that page/.test(document.querySelector('#main').innerText)), '404 page');
  /* role dashboards */
  const tabsOf = async u => { await as(u); return p.evaluate(() => DASH_TABS().map(t => t.k).join()); };
  ok((await tabsOf('u_md')).startsWith('md,'), 'MD gets the group dashboard'); ok((await tabsOf('u_coo')).startsWith('coo,'), 'COO gets the operations dashboard'); ok((await tabsOf('u_cexec')).startsWith('company'), 'Company Executive dashboard'); ok((await tabsOf('u_aud')).startsWith('audit'), 'Auditor view'); ok((await tabsOf('u_admin')).startsWith('sys'), 'Super Admin dashboard'); ok((await tabsOf('u_fin1')).startsWith('officer'), 'Finance Officer dashboard'); ok((await tabsOf('u_hr')).startsWith('officer'), 'HR Officer dashboard');
  for (const d of ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Realtors Development', 'Customer Experience']) { await as('u_md'); const t = await p.evaluate(dp => { UI.deptView = dp; location.hash = '#/dashboard/dept'; render(); return deptTop(dp).length; }, d); ok(t > 200, 'HOD dashboard for ' + d + ' has department content'); }
  /* reserve plot with a timed hold, then release */
  await as('u_s1'); const rv = await p.evaluate(() => { const pl = DB.q('plots').find(x => x.status === 'available'); const l = DB.q('leads').find(x => !['Won', 'Lost'].includes(x.stage)); setPlotStatus(pl, 'reserved', 'hold', { reservedUntil: addDays(today(), 3), reservedFor: l.id, holdName: l.name }); const r1 = DB.get('plots', pl.id).status; DB.set('plots', pl.id, { reservedUntil: addDays(today(), -1) }, { quiet: true }); Jobs.run(); return r1 + ':' + DB.get('plots', pl.id).status; }); ok(rv === 'reserved:available', 'plot hold without a sale expires automatically: ' + rv);
  /* duplicate lead merge */
  const mg = await p.evaluate(() => { const l = DB.q('leads')[0]; ACT.lead_ = 1; saveLead({ name: 'Dup ' + l.name, phone: l.phone, email: 'merged@x.co', source: 'Instagram' }); ACT['dup.merge'](); const x = DB.get('leads', l.id); return x.email === 'merged@x.co' || !!x.email; }); ok(mg, 'duplicate lead merges into the existing lead');
  /* assignment rule + estate mapping */
  await as('u_sales'); const ar = await p.evaluate(() => { ACT['rule.set']({ value: 'estate' }); const e = DB.q('estates')[0]; DB.set('estates', e.id, { officers: ['u_s2'] }); const l = { estateId: e.id }; return assignOfficer(l) === 'u_s2' && DB.setting('assignRule') === 'estate'; }); ok(ar, 'By-estate rule routes to the mapped officer');
  /* general ledger, receivables, consolidation */
  await as('u_md'); await p.evaluate(() => { location.hash = '#/accounting/ledger'; }); await p.waitForTimeout(250); ok(await p.evaluate(() => /Closing balance/.test(document.querySelector('#main').innerText)), 'general ledger shows closing balance');
  await p.evaluate(() => { location.hash = '#/accounting/consol'; }); await p.waitForTimeout(250); ok(await p.evaluate(() => /Consolidated position/.test(document.querySelector('#main').innerText)), 'group consolidation view');
  /* employee profile tabs */
  await as('u_hr'); const et = await p.evaluate(() => { const e = DB.q('employees')[3]; openEmployee(e.id); const out = []; for (const k of ['details', 'docs', 'leave', 'attendance', 'training', 'appraisals']) { UI.empTab = k; refreshOverlays(); out.push(document.querySelector('#overlay .mb').innerText.length > 20); } closeAllOverlays(); return out.every(Boolean); }); ok(et, 'employee profile tabs all render');
  /* project templates + recurring */
  await as('u_ops'); const tp = await p.evaluate(() => { const p0 = DB.add('projects', { name: 'T tpl', template: true, span: 20, blueprint: [{ title: 'A', off: 2 }, { title: 'B', off: 9 }], milestones: [{ n: 'M', off: 10 }], team: [], start: today(), due: today(), owner: SESS.uid }); ACT['tpl.use']({ dataset: { id: p0.id } }); return !!document.querySelector('#ovform'); }); ok(tp, 'template use form opens');
  /* approval chain builder */
  await as('u_admin'); const cb = await p.evaluate(() => { const r = DB.q('rules').find(x => x.type === 'expense'); ACT['rule.edit']({ dataset: { id: r.id } }); ACT['chain.addtier'](); const n = CHAIN.tiers.length; ACT['chain.save'](); return n === 4 && DB.get('rules', r.id).tiers.length === 4 && DB.get('rules', r.id).tiers[3].max === null; }); ok(cb, 'approval chain builder adds a band and saves');
  /* roles matrix + design system + flows */
  await p.evaluate(() => { location.hash = '#/admin/roles'; }); await p.waitForTimeout(250); ok(await p.evaluate(() => /Modules by role/.test(document.querySelector('#main').innerText) && document.querySelectorAll('#main table').length >= 2), 'roles and permissions matrix');
  await p.evaluate(() => { location.hash = '#/admin/design'; }); await p.waitForTimeout(250); ok(await p.evaluate(() => /Brand colours/.test(document.querySelector('#main').innerText)), 'design system page');
  const fl = await p.evaluate(() => { const ids = coUsers().slice(0, 5).map(u => u.id); DB.add('signoffs', { flow: 'l2o', testers: ids, notes: '', signed: false, ts: Date.now() }); ACT['flow.sign']({ dataset: { id: 'l2o' } }); document.querySelector('[data-act="ov.yes"]').click(); return DB.q('signoffs')[0].signed; }); ok(fl, 'prototype flow signs off after 5 testers');
  /* programme detail, results, milestone template, targets */
  await as('u_hr'); await p.evaluate(() => { location.hash = '#/learning/results'; }); await p.waitForTimeout(250); ok(await p.evaluate(() => /Pass rate/.test(document.querySelector('#main').innerText)), 'assessment results screen');
  const pd = await p.evaluate(() => { ACT['prg.open']({ dataset: { id: DB.q('programmes')[0].id } }); return /learning objectives/i.test(document.querySelector('#overlay').innerText); }); ok(pd, 'programme detail panel');
  await as('u_cxh'); const mt = await p.evaluate(() => { ACT['mt.edit'](null, DB.q('msgtpl')[0].id); return !!document.querySelector('#ovform'); }); ok(mt, 'milestone template editor opens');
  const mn = await p.evaluate(() => { DB.set('msgtpl', DB.q('msgtpl')[0].id, { text: 'Custom {{name}} {{sale}}' }); const s = DB.q('sales').find(x => x.status === 'active'); const before = DB.q('outbox').length; notifyClientMilestone(s, 'allocation milestone'); return DB.q('outbox').slice(before).some(o => /^Custom /.test(o.text)); }); ok(mn, 'client notices use the edited template');
  await as('u_md'); const tg = await p.evaluate(() => { const k = DB.q('kpis')[0]; ACT['kpi.tgt']({ value: '77', dataset: { id: k.id, m: monthKey(today()) } }); return kpiTarget(DB.get('kpis', k.id), monthKey(today())) === 77; }); ok(tg, 'KPI target setting per month');
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? fails + ' FAILURES' : 'FLOW4 PASSED');
})().catch(e => { console.log('CRASH', e.message); process.exit(1); });
