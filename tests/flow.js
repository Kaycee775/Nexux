const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
const LAUNCH = { executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] };
const URL0 = process.env.TRIOP_URL || 'http://localhost:8765/index.html';
const BASE = URL0;
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const b = await chromium.launch(LAUNCH);
  const ctx = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const login = async uid => { await p.evaluate(u => { SESS.uid = u; SESS.co = 'tre'; saveSession(); location.hash = '#/dashboard'; }, uid); await p.reload(); await p.waitForSelector('.shell'); };
  await p.goto(BASE); await p.waitForSelector('.login');
  /* 1. sales officer creates lead via the UI */
  await p.click('[data-u="u_s1"]'); await p.waitForSelector('.shell'); await p.evaluate(() => { location.hash = '#/crm/leads'; }); await p.waitForTimeout(200);
  await p.click('[data-act="lead.new"]'); await p.waitForSelector('#ovform');
  await p.fill('#of-name', 'Test Buyer One'); await p.fill('#of-phone', '08099990001'); await p.selectOption('#of-source', 'Instagram'); await p.click('[data-act="ov.submit"]'); await p.waitForTimeout(200);
  let lead = await p.evaluate(() => DB.q('leads').find(l => l.name === 'Test Buyer One')); ok(!!lead, 'lead created via form'); ok(lead && lead.stage === 'New', 'lead starts at New');
  /* duplicate detection */
  await p.click('[data-act="lead.new"]'); await p.waitForSelector('#ovform'); await p.fill('#of-name', 'Dup Person'); await p.fill('#of-phone', '08099990001'); await p.selectOption('#of-source', 'Instagram'); await p.click('[data-act="ov.submit"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => /Possible duplicate/.test(document.body.innerText)), 'duplicate lead warns'); await p.evaluate(() => closeAllOverlays());
  /* 2. convert to sale (UI form) */
  const plot = await p.evaluate(() => { const e = DB.q('estates')[0]; const pl = DB.q('plots').find(x => x.estate === e.id && x.status === 'available'); return { e: e.id, p: pl.id }; });
  await p.evaluate(id => saleForm({ leadId: id }), lead.id); await p.waitForSelector('#ovform');
  await p.selectOption('#of-estateId', plot.e); await p.waitForTimeout(150); await p.check(`input[value="${plot.p}"]`); await p.waitForTimeout(100);
  await p.selectOption('#of-planId', 'pl_6'); await p.waitForTimeout(150); ok(await p.evaluate(() => /total/.test(document.querySelector('#ovform').innerText)), 'plan summary preview shows');
  await p.click('[data-act="ov.submit"]'); await p.waitForTimeout(400);
  const sale = await p.evaluate(() => DB.q('sales').find(s => DB.get('clients', s.clientId)?.name === 'Test Buyer One')); ok(!!sale, 'sale created from lead'); ok(sale && sale.status === 'pending', 'sale pending until deposit');
  const plotRec = await p.evaluate(id => DB.get('plots', id), plot.p); ok(plotRec.status === 'reserved' && !!plotRec.reservedUntil, 'plot reserved with hold date');
  /* double allocation blocked */
  const dbl = await p.evaluate(({ id, cid }) => { try { createSale({ clientId: cid, plotIds: [id], planId: 'pl_6', estateId: DB.get('plots', id).estate }); return 'allowed'; } catch (e) { return e.message; } }, { id: plot.p, cid: sale.clientId }); ok(/belong|reserved|only one/i.test(dbl), 'double allocation blocked: ' + dbl);
  /* 3. client pays via Tri-Pay sandbox, finance confirms */
  const pay = await p.evaluate(sid => { const s = DB.get('sales', sid); const pp = recordPayment({ saleId: sid, amount: s.deposit, method: 'Bank transfer', channel: 'tripay', date: today(), ref: 'X1' }); return pp.id; }, sale.id);
  await login('u_fin1'); await p.evaluate(() => { location.hash = '#/finance/confirm'; }); await p.waitForTimeout(250);
  ok(await p.evaluate(id => !!document.querySelector(`[data-act="pay.confirm"][data-id="${id}"]`), pay), 'pending payment visible in confirmation workspace');
  await p.click(`[data-act="pay.confirm"][data-id="${pay}"]`); await p.waitForTimeout(300);
  const p2 = await p.evaluate(id => DB.get('payments', id), pay); ok(p2.status === 'confirmed' && /^RC-/.test(p2.receiptNo), 'payment confirmed and receipt issued: ' + p2.receiptNo);
  const j = await p.evaluate(id => DB.q('journals').find(x => x.source === 'payment' && x.ref === id), pay); ok(!!j && j.lines.some(l => l.acct === '1010' && l.dr > 0), 'ledger journal posted to bank');
  const plot2 = await p.evaluate(id => DB.get('plots', id), plot.p); ok(plot2.status === 'allocated', 'plot becomes allocated after deposit');
  const comm = await p.evaluate(sid => DB.q('commissions').filter(c => c.saleId === sid).length, sale.id); console.log('   commissions for sale (realtor optional):', comm);
  const lead2 = await p.evaluate(id => DB.get('leads', id).stage, lead.id); ok(lead2 === 'Won', 'lead becomes Won after deposit');
  /* maker-checker */
  const own = await p.evaluate(() => { const s = DB.q('sales').find(x => saleBalance(x) > 100000 && ['active', 'pending'].includes(x.status)); SESS.uid = 'u_fin1'; const pp = recordPayment({ saleId: s.id, amount: 100000, method: 'Cash', channel: 'offline', date: today(), ref: 'C1' }); try { confirmPayment(pp.id); return 'allowed'; } catch (e) { return e.message; } }); ok(/recorded this payment/.test(own), 'recorder cannot confirm own payment: ' + own);
  /* second officer needed for large payments */
  const big = await p.evaluate(() => { const s = DB.q('sales').find(x => saleBalance(x) > DB.setting('secondApprovalAmount') + 1000); if (!s) return 'nosale'; const pp = recordPayment({ saleId: s.id, amount: DB.setting('secondApprovalAmount'), method: 'Bank transfer', channel: 'tripay', date: today(), ref: 'BIG' }); SESS.uid = 'u_fin1'; const r1 = confirmPayment(pp.id); let r1b; try { confirmPayment(pp.id); r1b = 'twice'; } catch (e) { r1b = 'blocked'; } SESS.uid = 'u_fin2'; const r2 = confirmPayment(pp.id); return [r1, r1b, r2, DB.get('payments', pp.id).status].join(','); }); ok(big === 'first,blocked,done,confirmed', 'large payment needs two officers: ' + big);
  /* 4. period lock */
  const lock = await p.evaluate(() => { const k = DB.q('periods').find(x => x.status === 'closed'); try { postJournal({ date: k.id + '-10', memo: 't', lines: [{ acct: '1010', dr: 5 }, { acct: '4200', cr: 5 }] }); return 'posted'; } catch (e) { return e.message; } }); ok(/closed/.test(lock), 'closed period blocks posting: ' + lock);
  const unb = await p.evaluate(() => { try { postJournal({ date: today(), memo: 't', lines: [{ acct: '1010', dr: 5 }, { acct: '4200', cr: 4 }] }); return 'posted'; } catch (e) { return e.message; } }); ok(/balance/.test(unb), 'unbalanced journal rejected');
  /* 5. approvals chain: expense */
  const ex = await p.evaluate(() => { SESS.uid = 'u_s1'; const e = DB.add('expenses', { no: 'EX-T', desc: 'Test', category: 'Marketing', amount: 300000, userId: 'u_s1', dept: 'Sales', status: 'pending', date: today() }); const a = startApproval({ type: 'expense', ref: e.id, title: 'T', amount: 300000, requester: 'u_s1' }); return { id: a.id, steps: a.steps.map(s => s.key) }; }); ok(ex.steps.join() === 'manager,finance', 'expense chain by amount: ' + ex.steps);
  const self = await p.evaluate(id => { SESS.uid = 'u_s1'; try { decide(id, 'approved'); return 'allowed'; } catch (e) { return 'blocked'; } }, ex.id); ok(self === 'blocked', 'requester cannot approve own request');
  const fin = await p.evaluate(id => { SESS.uid = 'u_sales'; decide(id, 'approved'); SESS.uid = 'u_fin1'; decide(id, 'approved'); const a = DB.get('approvals', id); const e = DB.get('expenses', a.ref); return a.status + '/' + e.status; }, ex.id); ok(fin === 'approved/approved', 'two-step approval completes and updates expense: ' + fin);
  /* 6. reservation expiry */
  const exp = await p.evaluate(sid => { const s = DB.get('sales', sid); const pr = DB.q('sales').find(x => x.status === 'pending' && x.id !== sid); if (!pr) return 'none'; pr.plotIds.forEach(i => DB.set('plots', i, { reservedUntil: addDays(today(), -1) }, { quiet: true })); Jobs.run(); return DB.get('sales', pr.id).status + '/' + DB.get('plots', pr.plotIds[0]).status; }, sale.id); ok(exp === 'expired/available' || exp === 'none', 'reservation auto-expires: ' + exp);
  /* 7. realtor source lock + referral code precedence */
  const rl = await p.evaluate(() => { const a = DB.q('realtors').find(r => r.code); return a ? a.code : null; }); ok(!!rl, 'associate has referral code ' + rl);
  await p.evaluate(c => { SESS.uid = null; location.hash = '#/f/form-a?ref=' + c + '&camp=CMP101'; }, rl); await p.waitForTimeout(300);
  await p.fill('#fa-name', 'Form A Tester'); await p.fill('#fa-phone', '08077770001'); await p.fill('#fa-email', 'a@b.co'); await p.check('#fa-agree'); await p.click('[data-act="forma.submit"]'); await p.waitForTimeout(300);
  const fa = await p.evaluate(() => DB.q('realtors').find(r => r.name === 'Form A Tester')); ok(fa && fa.source === 'Referral' && fa.locked, 'Form A: referral code wins over campaign; source locked: ' + (fa && fa.source));
  /* 8. attendance & leave */
  await login('u_s2'); const clk = await p.evaluate(() => { const a = DB.q('attendance').find(x => x.userId === 'u_s2' && x.date === today()); return !!a; });
  await p.evaluate(() => { location.hash = '#/dashboard/me'; }); await p.waitForTimeout(250);
  if (!clk) { await p.click('[data-act="clock.in"]'); await p.waitForSelector('#ovform'); await p.check('#of-ok'); await p.click('[data-act="ov.submit"]'); await p.waitForTimeout(250); }
  ok(await p.evaluate(() => !!DB.q('attendance').find(x => x.userId === 'u_s2' && x.date === today())), 'clock in recorded');
  const lv = await p.evaluate(() => { SESS.uid = 'u_s2'; const l = requestLeave({ type: 'Annual', from: addDays(today(), 10), to: addDays(today(), 12), reason: 'x' }); const a = DB.q('approvals').find(x => x.ref === l.id); SESS.uid = 'u_sales'; decide(a.id, 'approved'); return DB.get('leaves', l.id).status; }); ok(lv === 'approved', 'leave approved by line manager');
  /* 9. chat message + mention */
  await login('u_s1'); await p.evaluate(() => { location.hash = '#/chat'; }); await p.waitForSelector('#composer'); await p.fill('#composer', 'Hello @Zainab test message'); await p.click('[data-act="chat.send"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => DB.q('messages').some(m => m.text.includes('@Zainab test'))), 'chat message posted'); ok(await p.evaluate(() => DB.q('notifications').some(n => n.user === 'u_s2' && /mentioned/.test(n.title))), 'mention notifies the colleague');
  /* 10. test taking */
  const tk = await p.evaluate(() => { SESS.uid = 'u_s4'; const a = DB.q('assessments').find(x => x.kind === 'Online'); return a.id; }); await login('u_s4'); await p.evaluate(id => ACT['asm.take']({ dataset: { id } }), tk); await p.waitForTimeout(200); await p.click('[data-act="exam.submit"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => DB.q('attempts').some(x => x.userId === 'u_s4' && !x.paper && x.submitted > Date.now() - 20000)), 'online assessment auto-marked and saved');
  /* 11. integrity */
  const chk = await p.evaluate(() => integrityChecks().filter(c => c.items.length).map(c => c.k + ': ' + c.items.slice(0, 3).join(','))); console.log('   integrity issues:', chk.length ? chk : 'none');
  ok(errs.length === 0, 'no console errors during flow ' + errs.slice(0, 3).join(' | '));
  await b.close(); console.log(fails ? `\n${fails} FAILURES` : '\nALL FLOW CHECKS PASSED');
})().catch(e => { console.log('FLOW CRASH', e.message); process.exit(1); });
