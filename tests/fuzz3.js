const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
const USERS = (process.argv[2] || 'u_md').split(','); const ONLY = process.argv[3];
const R = eval(require('fs').readFileSync(__dirname + '/fuzz.js', 'utf8').match(/const ROUTES = (\[.*?\]);/s)[1]);
const SKIP = ['logout', 'demo.reset', 'switch.user', 'ov.close', 'ov.yes', 'nav.toggle', 'sclose', 'chat.attach', 'adm.backup', 'adm.restore', 'ov.submit', 'profile'];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] }); let n = 0, bad = 0; const toasts = new Set();
  for (const uid of USERS) {
    const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); let errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text())); p.on('dialog', d => d.dismiss().catch(() => { })); p.on('popup', pp => pp.close().catch(() => { }));
    await p.goto((process.env.TRIOP_URL || 'http://localhost:8765/index.html')); await p.waitForSelector('.login'); await p.evaluate(u => { SESS.uid = u; SESS.co = 'tre'; saveSession(); }, uid); await p.reload(); await p.waitForSelector('.shell');
    const fill = () => p.evaluate(() => { const f = document.querySelector('#ovform'); if (!f) return false; f.querySelectorAll('input,select,textarea').forEach(el => { if (el.type === 'hidden' || el.readOnly || el.disabled) return; if (el.tagName === 'SELECT') { if (!el.value) { const o = Array.from(el.options).find(x => x.value); if (o) { el.value = o.value; el.dispatchEvent(new Event('change', { bubbles: true })); } } } else if (el.type === 'checkbox') { if (el.closest('.msel') && !f.querySelector('.msel input:checked')) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } } else if (el.type === 'number') { if (!el.value) el.value = el.min && +el.min > 0 ? el.min : 1000; } else if (el.type === 'date') { if (!el.value) el.value = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10); } else if (el.type === 'time') { if (!el.value) el.value = '10:00'; } else if (el.type === 'file') { } else if (!el.value) el.value = el.type === 'email' ? 'qa@test.example' : el.type === 'tel' ? '08055550123' : 'QA test'; }); return true; });
    const settle = async () => { await p.waitForTimeout(50); for (let i = 0; i < 4; i++) { if (await p.$('#ovform')) { await fill(); await p.evaluate(() => { try { ACT['ov.submit'](); } catch (e) { console.error('SUBMIT ' + e.message); } }); await p.waitForTimeout(60); } } };
    const capT = async () => { const t = await p.evaluate(() => Array.from(document.querySelectorAll('.toast.bad,.toast.warn')).map(x => x.textContent)); t.forEach(x => toasts.add(uid + ' ' + x)); await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove())); };
    for (const r of R) {
      if (ONLY && !r.startsWith(ONLY)) continue;
      const go = async () => { await p.evaluate(h => { closeAllOverlays(); location.hash = '#/' + h; }, r); await p.waitForTimeout(70); };
      await go();
      const tabs = await p.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('#main tr.clk[data-t]')).map(x => x.dataset.t))));
      for (const t of tabs) {
        await go(); errs = [];
        const row = await p.$(`#main tr.clk[data-t="${t}"]`); if (!row) continue; try { await row.click({ timeout: 800 }); } catch (e) { continue; } await p.waitForTimeout(80);
        const acts = await p.evaluate(skip => Array.from(document.querySelectorAll('#overlay [data-act]')).map(e => e.dataset.act).filter(a => !skip.includes(a)), SKIP);
        const ons = await p.evaluate(() => Array.from(document.querySelectorAll('#overlay [data-on]')).map(e => e.dataset.on));
        if (errs.length) { bad++; console.log(`[${uid}] ${r} open row ${t}: ${errs.slice(0, 2).join(' | ')}`); }
        for (const a of [...new Set(acts)]) {
          await go(); errs = []; const row2 = await p.$(`#main tr.clk[data-t="${t}"]`); if (!row2) break; try { await row2.click({ timeout: 800 }); } catch (e) { break; } await p.waitForTimeout(60);
          const el = await p.$(`#overlay [data-act="${a}"]`); if (!el) continue; n++; try { await el.click({ timeout: 800, force: true }); } catch (e) { continue; }
          await settle(); await capT(); await p.evaluate(() => closeAllOverlays());
          if (errs.length) { bad++; console.log(`[${uid}] ${r} row ${t} overlay act ${a}: ${errs.slice(0, 2).join(' | ')}`); }
        }
        for (const o of [...new Set(ons)]) { await go(); errs = []; const row2 = await p.$(`#main tr.clk[data-t="${t}"]`); if (!row2) break; try { await row2.click({ timeout: 800 }); } catch (e) { break; } await p.waitForTimeout(60); n++; await p.evaluate(on => { const el = document.querySelector(`#overlay [data-on="${on}"]`); if (el && el.options && el.options.length > 1) { el.selectedIndex = el.options.length - 1; el.dispatchEvent(new Event('change', { bubbles: true })); } }, o); await settle(); await capT(); if (errs.length) { bad++; console.log(`[${uid}] ${r} row ${t} overlay on ${o}: ${errs.slice(0, 2).join(' | ')}`); } }
      }
      await go(); const acts = await p.evaluate(skip => Array.from(new Set(Array.from(document.querySelectorAll('#main [data-act]')).map(e => e.dataset.act))).filter(a => !skip.includes(a)), SKIP);
      for (const a of acts) {
        await go(); errs = []; const el = await p.$(`#main [data-act="${a}"]`); if (!el) continue; n++; try { await el.click({ timeout: 800, force: true }); } catch (e) { continue; }
        await settle(); await capT();
        const acts2 = await p.evaluate(skip => Array.from(new Set(Array.from(document.querySelectorAll('#overlay [data-act]')).map(e => e.dataset.act))).filter(a => !skip.includes(a)), SKIP);
        for (const a2 of acts2) { const e2 = await p.$(`#overlay [data-act="${a2}"]`); if (!e2) continue; n++; try { await e2.click({ timeout: 800, force: true }); } catch (e) { continue; } await settle(); await capT(); }
        await p.evaluate(() => closeAllOverlays());
        if (errs.length) { bad++; console.log(`[${uid}] ${r} page act ${a}: ${errs.slice(0, 2).join(' | ')}`); }
      }
      const ons = await p.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('#main [data-on]')).map(e => e.dataset.on))));
      for (const o of ons) { await go(); errs = []; n++; await p.evaluate(on => { const el = document.querySelector(`#main [data-on="${on}"]`); if (!el) return; if (el.options) { el.selectedIndex = Math.min(1, el.options.length - 1); el.dispatchEvent(new Event('change', { bubbles: true })); } else { el.click(); } }, o); await p.waitForTimeout(80); if (errs.length) { bad++; console.log(`[${uid}] ${r} data-on ${o}: ${errs.slice(0, 2).join(' | ')}`); } }
    }
    await ctx.close();
  }
  await b.close(); console.log(`fuzz3 done: ${n} interactions, ${bad} with errors`); console.log('--- toasts (warn/bad) seen ---'); [...toasts].sort().forEach(t => console.log(t));
})();
