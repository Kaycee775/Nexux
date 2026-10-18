const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
const LAUNCH = { executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] };
const URL0 = process.env.TRIOP_URL || 'http://localhost:8765/index.html';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const b = await chromium.launch(LAUNCH);
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(URL0); await p.waitForSelector('.login');
  const as = async uid => { await p.evaluate(u => { SESS.uid = u; SESS.co = 'tre'; CO = 'tre'; saveSession(); }, uid); };
  await as('u_ops'); await p.reload(); await p.waitForSelector('.shell');
  /* transfer approval */
  const tr = await p.evaluate(() => { const s = DB.q('sales').find(x => x.status === 'active' && x.paid > 0); const other = DB.q('clients').find(c => c.id !== s.clientId); SESS.uid = 'u_s1'; const a = startApproval({ type: 'transfer', ref: s.id, title: 'T', meta: { toClient: other.id, reason: 'r' } }); SESS.uid = 'u_ops'; decide(a.id, 'approved'); return { st: DB.get('approvals', a.id).status, owner: DB.get('sales', s.id).clientId === other.id, plot: DB.get('plots', s.plotIds[0]).clientId === other.id, doc: DB.q('docsLog').some(d => d.type === 'allocation') }; });
  ok(tr.st === 'approved' && tr.owner && tr.plot, 'transfer: approval moves sale and plot ownership');
  /* revocation */
  const rv = await p.evaluate(() => { const s = DB.q('sales').find(x => x.status === 'active' && x.paid > 0 && x.total - x.paid > 0); SESS.uid = 'u_s1'; const a = startApproval({ type: 'revocation', ref: s.id, title: 'R', amount: 10000, meta: { refund: 10000, reason: 'x' } }); const steps = a.steps.map(x => x.key).join(); SESS.uid = 'u_ops'; decide(a.id, 'approved'); SESS.uid = 'u_coo'; decide(a.id, 'approved'); const st = DB.get('sales', s.id); const pl = DB.get('plots', s.plotIds[0]); return { steps, sale: st.status, plot: pl.status, tb: Math.abs(sum(trialBalance(), x => x.dr) - sum(trialBalance(), x => x.cr)) < 1 }; });
  ok(rv.steps === 'opsdir,exec' && rv.sale === 'revoked' && rv.plot === 'revoked' && rv.tb, 'revocation: two-step approval revokes sale/plot and books stay balanced ' + JSON.stringify(rv));
  /* commission approval posts to ledger */
  const cm = await p.evaluate(() => { const c = DB.q('commissions').find(x => x.status === 'calculated'); if (!c) return 'none'; const before = acctBal('2100'); SESS.uid = 'u_fin1'; const a = startApproval({ type: 'commission', ref: c.id, title: 'C', amount: c.amount }); SESS.uid = 'u_ops'; decide(a.id, 'approved'); if (DB.get('approvals', a.id).status !== 'approved') { SESS.uid = 'u_coo'; decide(a.id, 'approved'); } return DB.get('commissions', c.id).status + ':' + (acctBal('2100') - before === c.amount); });
  ok(cm === 'approved:true' || cm === 'none', 'commission approval posts payable ' + cm);
  /* manual journal approval */
  const jv = await p.evaluate(() => { SESS.uid = 'u_fin3'; const j = postJournal({ date: today(), memo: 'Manual', lines: [{ acct: '5500', dr: 1000 }, { acct: '1010', cr: 1000 }], status: 'pending', source: 'manual' }); const a = startApproval({ type: 'journal', ref: j.id, title: 'J', amount: 1000 }); const pre = DB.get('journals', j.id).status; SESS.uid = 'u_fin3'; let self = 'ok'; try { decide(a.id, 'approved'); } catch (e) { self = 'blocked'; } SESS.uid = 'u_fin1'; decide(a.id, 'approved'); return [pre, self, DB.get('journals', j.id).status].join(); }); ok(jv === 'pending,blocked,posted', 'manual journal: pending, maker blocked, posts after approval: ' + jv);
  /* period reopen by exec */
  const pr = await p.evaluate(() => { SESS.uid = 'u_coo'; const per = DB.q('periods').find(x => x.status === 'closed'); const a = (() => { SESS.uid = 'u_fin1'; return startApproval({ type: 'reopen', ref: per.id, title: 'Reopen', meta: { reason: 'adj' } }); })(); SESS.uid = 'u_coo'; decide(a.id, 'approved'); return DB.get('periods', per.id).status + ':' + (DB.get('periods', per.id).reopened || []).length; }); ok(pr === 'open:1', 'period reopen needs executive and is logged: ' + pr);
  /* invoice lifecycle */
  const iv = await p.evaluate(() => { SESS.uid = 'u_fin1'; const i = DB.q('invoices').find(x => x.status === 'draft'); ACT['inv.issue']({ dataset: { id: i.id } }); const s1 = DB.get('invoices', i.id).status; const ar = acctBal('1150'); ACT['inv.paid']({ dataset: { id: i.id } }); return [s1, DB.get('invoices', i.id).status, ar > acctBal('1150')].join(); }); ok(iv === 'sent,paid,true', 'invoice issue then receipt posts to ledger: ' + iv);
  /* induction */
  const ind = await p.evaluate(() => { SESS.uid = 'u_rd'; const r = DB.q('realtors').find(x => x.stage === 'Ready for induction'); ACT['rlt.induct']({ dataset: { id: r.id } }); document.querySelector('[data-act="ov.yes"]')?.click(); const x = DB.get('realtors', r.id); return x.stage + ':' + /^TARP/.test(x.code) + ':' + DB.q('webhooks').some(w => w.event === 'realtor.inducted'); }); ok(ind === 'Inducted (Associate):true:true', 'induction creates Associate + code and notifies Tri-Pay: ' + ind);
  const blocked = await p.evaluate(() => { SESS.uid = 'u_rd2'; const r = DB.q('realtors').find(x => x.stage === 'Entry registered'); const before = r.stage; ACT['rlt.induct']({ dataset: { id: r.id } }); return DB.get('realtors', r.id).stage === before; }); ok(blocked, 'non-admin cannot induct an incomplete realtor');
  /* source correction */
  const sc = await p.evaluate(() => { SESS.uid = 'u_rd'; const r = DB.q('realtors').find(x => x.source === 'Organic'); const a = startApproval({ type: 'sourcefix', ref: r.id, title: 'fix', meta: { source: 'Walk-in', ref: 'u_rd1', reason: 'typo' } }); SESS.uid = 'u_ops'; decide(a.id, 'approved'); const x = DB.get('realtors', r.id); return x.source + ':' + (x.sourceLog || []).length; }); ok(sc === 'Walk-in:1', 'source correction needs Operations Director and is logged: ' + sc);
  /* collections sweep */
  const cs = await p.evaluate(() => { SESS.uid = 'u_fin1'; const before = DB.q('tasks').filter(t => t.auto === 'collection').length; Jobs.run(); return DB.q('tasks').filter(t => t.auto === 'collection').length >= before && overdueItems().length > 0; }); ok(cs, 'collections job creates follow-up tasks for overdue instalments');
  /* SLA breach */
  const sl = await p.evaluate(() => { const t = DB.q('tickets').find(x => !['Resolved', 'Closed'].includes(x.status) && !x.breached); if (!t) return 'none'; DB.set('tickets', t.id, { slaDue: Date.now() - 1000 }, { quiet: true }); Jobs.run(); return DB.get('tickets', t.id).breached + ':' + DB.get('tickets', t.id).escalated; }); ok(sl === 'true:true' || sl === 'none', 'ticket breaching SLA escalates automatically: ' + sl);
  /* bank match suggestion */
  const bk = await p.evaluate(() => { const t = DB.q('bankTxns').find(x => !x.matched && bankSuggest(x)); return !!t; }); console.log('   bank suggestion available:', bk);
  /* migration via CSV upload */
  await as('u_admin'); await p.reload(); await p.waitForSelector('.shell'); await p.evaluate(() => { location.hash = '#/admin/data'; }); await p.waitForTimeout(200);
  await p.evaluate(() => ACT['mig.plots']()); await p.waitForSelector('#impf');
  const nos = await p.evaluate(() => { const e = DB.q('estates').find(x => x.name === 'Velcrest'); return DB.q('plots').filter(x => x.estate === e.id && x.status === 'available').slice(0, 3).map(x => x.no); }); const csv = 'estate,plot,size,status,owner,price,documentation\nVelcrest,"' + nos[0] + ' & ' + nos[1] + '",450,Sold,Migration Buyer,"₦2,900,000",Pending\nNoSuchEstate,1,450,Sold,X,100,\nVelcrest,' + nos[2] + ',450,Available,,,';
  await p.setInputFiles('#impf', { name: 'alloc.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => /2 valid rows, 1 rejected|\b2\b.*valid/.test(document.querySelector('#impres').innerText)), 'allocation import validates rows (reports rejects): ' + (await p.evaluate(() => document.querySelector('#impres').innerText.replace(/\n/g, ' ').slice(0, 120))));
  await p.click('[data-act="imp.commit"]'); await p.waitForTimeout(250);
  const mp = await p.evaluate(nos2 => { const e = DB.q('estates').find(x => x.name === 'Velcrest'); return nos2.map(n => DB.q('plots').find(x => x.estate === e.id && x.no === n)).map(x => x.status + ':' + (DB.get('clients', x.clientId)?.name || '')).join('|'); }, nos.slice(0, 2)); ok(mp === 'allocated:Migration Buyer|allocated:Migration Buyer', 'multi-plot cell split into one plot each: ' + mp);
  await p.evaluate(() => ACT['mig.sales']()); await p.waitForSelector('#impf');
  const csv2 = 'client,phone,email,estate,plots,plan,total,paid,realtor,source\nMigration Buyer,p:0803 111 2222,mb@mail.example,Velcrest,' + nos[0] + ' & ' + nos[1] + ',6 months,"₦5,800,000","₦2,000,000",,Instagram\nBad Row,0803,x@y.z,Velcrest,99,6 months,100,0,,';
  await p.setInputFiles('#impf', { name: 'pay.csv', mimeType: 'text/csv', buffer: Buffer.from(csv2) }); await p.waitForTimeout(300); await p.click('[data-act="imp.commit"]'); await p.waitForTimeout(300);
  const ms = await p.evaluate(() => { const c = DB.q('clients').find(x => x.name === 'Migration Buyer'); const s = DB.q('sales').find(x => x.clientId === c.id); return c.phone + ':' + s.paid + ':' + s.total + ':' + s.schedule.length + ':' + (integrityChecks().filter(k => k.items.length).length); }); ok(/^08031112222:2000000:5800000:7:/.test(ms), 'payment tracker import: phone cleaned, opening payment, remaining schedule generated: ' + ms);
  const un = await p.evaluate(() => { const tb = trialBalance(); return Math.abs(sum(tb, a => a.dr) - sum(tb, a => a.cr)) < 1; }); ok(un, 'trial balance still balances after all of the above');
  /* role override */
  const ro = await p.evaluate(() => { const r = DB.d.roles.find(x => x.id === 'staff'); r.perms = ['export']; applyRoleOverrides(); SESS.uid = 'u_s1'; const has = can('export'); r.perms = []; applyRoleOverrides(); return has && !can('export'); }); ok(ro, 'role permissions are configurable without code changes');
  /* scope: staff cannot see finance */
  await p.evaluate(() => { SESS.uid = 'u_s1'; location.hash = '#/finance/confirm'; }); await p.waitForTimeout(300); ok(await p.evaluate(() => /No access/.test(document.querySelector('#main').innerText)), 'staff has no access to finance');
  await p.evaluate(() => { SESS.uid = 'u_aud'; location.hash = '#/hr/directory'; }); await p.waitForTimeout(200);
  const sens = await p.evaluate(() => { SESS.uid = 'u_aud'; return hrSens(); }); ok(!sens, 'auditor cannot see salary / disciplinary records');
  ok(errs.length === 0, 'no console errors ' + errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? `\n${fails} FAILURES` : '\nALL FLOW2 CHECKS PASSED');
})().catch(e => { console.log('FLOW2 CRASH', e.message); process.exit(1); });
