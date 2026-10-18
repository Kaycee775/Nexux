const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1360, height: 900 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto((process.env.TRIOP_URL || 'http://localhost:8765/index.html')); await p.waitForSelector('.login');
  const as = async u => { await p.evaluate(x => { SESS.uid = x; SESS.co = 'tre'; saveSession(); }, u); await p.reload(); await p.waitForSelector('.shell'); };
  await as('u_ops');
  // survey plan + map placement
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC';
  const eid = await p.evaluate(png => { const e = DB.q('estates')[0]; DB.set('estates', e.id, { layout: 'data:image/png;base64,' + png }); return e.id; }, png);
  await p.evaluate(id => { location.hash = '#/inventory/estate/' + id; }, eid); await p.waitForTimeout(300);
  const pid = await p.evaluate(() => DB.q('plots')[0].id);
  await p.selectOption('[data-on="map.pick"]', pid); await p.waitForTimeout(200);
  await p.click('img[data-act="map.place"]', { position: { x: 100, y: 50 } }); await p.waitForTimeout(200);
  ok(await p.evaluate(id => !!DB.get('plots', id).pos, pid), 'plot placed on survey plan'); ok(await p.evaluate(() => !!document.querySelector('.mk')), 'marker rendered');
  // facility
  await p.evaluate(() => { location.hash = '#/work/facility'; }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => /FM-0001/.test(document.querySelector('#main').innerText)), 'facility requests listed');
  await p.click('[data-act="fac.new"]'); await p.waitForSelector('#ovform'); await p.fill('#of-property', 'Test Court'); await p.fill('#of-desc', 'Leaking roof'); await p.click('[data-act="ov.submit"]'); await p.waitForTimeout(250);
  const fid = await p.evaluate(() => DB.q('facilityreqs').find(f => f.property === 'Test Court')?.id); ok(!!fid, 'facility request created');
  await p.evaluate(id => ACT['fac.done']({ dataset: { id } }), fid); await p.waitForSelector('#ovform'); await p.fill('#of-v', 'fixed'); await p.click('[data-act="ov.submit"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(id => DB.get('facilityreqs', id).status === 'Completed', fid), 'facility request completed');
  // dashboard filters
  await as('u_md'); await p.evaluate(() => { location.hash = '#/dashboard/company'; }); await p.waitForTimeout(300);
  await p.evaluate(() => ACT['dsh.set']({ dataset: { k: 'from' }, value: '2026-01-01' })); await p.waitForTimeout(200);
  ok(await p.evaluate(() => /Sales in range/.test(document.body.innerText) && dashFiltered().sales.length > 10), 'dashboard date filter widens results: ' + await p.evaluate(() => dashFiltered().sales.length));
  // search page
  await p.fill('#gsearch', 'Test Buyer'); await p.evaluate(() => { location.hash = '#/search?q=Lisbon'; }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.querySelectorAll('#main a.tilebtn').length > 0), 'search page lists results');
  // profile button + auditor expiry
  await p.click('[data-act="profile"]'); await p.waitForTimeout(250); ok(await p.evaluate(() => location.hash === '#/profile'), 'avatar opens profile');
  const ex = await p.evaluate(() => { DB.d.users.find(u => u.id === 'u_aud').expires = '2020-01-01'; SESS.uid = null; saveSession(); render(); ACT.login({ dataset: { u: 'u_aud' } }); return SESS.uid; }); ok(!ex, 'expired auditor access refused');
  // ack
  await as('u_s1'); const ack = await p.evaluate(() => { const s = DB.q('sales').find(x => DB.q('payments').some(y => y.saleId === x.id && y.status === 'confirmed')); ACT['doc.ack']({ dataset: { id: s.id } }); return /acknowledge/i.test(document.querySelector('#overlay').innerText); }); ok(ack, 'payment acknowledgement document renders');
  ok(errs.length === 0, 'no errors ' + errs.slice(0, 3).join('|'));
  await b.close(); console.log(fails ? fails + ' FAILURES' : 'FLOW3 PASSED');
})().catch(e => { console.log('CRASH', e.message); process.exit(1); });
