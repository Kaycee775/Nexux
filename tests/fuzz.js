const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
const LAUNCH = { executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] };
const URL0 = process.env.TRIOP_URL || 'http://localhost:8765/index.html';
const USERS = (process.argv[2] || 'u_md,u_fin1,u_s1').split(','); const ONLY = process.argv[3];
const ROUTES = ['inventory/letters','crm/rules','accounting/ledger','accounting/receivables','accounting/consol','work/templates','work/recurring','work/sitedev','work/assets','work/facility','cx/templates','performance/departments','performance/targets','learning/results','admin/departments','admin/companies','admin/numbering','admin/design','admin/flows','profile/notifications','profile/security','system','notifications/unread','search?q=Lisbon','dashboard/md','dashboard/coo','dashboard/audit','dashboard/officer','dashboard/sys','dashboard/schedules','dashboard/md','dashboard/coo','dashboard/company','dashboard/dept','dashboard/me','dashboard/officer','dashboard/audit','dashboard/sys','dashboard/schedules','mywork','approvals/waiting','inventory/estates','inventory/plots','inventory/titles','inventory/inspections','crm/pipeline','crm/leads','crm/clients','crm/sales','crm/calls','crm/targets','realtors/pipeline','realtors/events','realtors/sources','realtors/network','realtors/reports','realtors/formA','cx/tickets','cx/sla','cx/surveys','finance/confirm','finance/payments','finance/collections','finance/commissions','finance/invoices','finance/expenses','finance/budgets','finance/reports','finance/tripay','accounting/accounts','accounting/journals','accounting/payables','accounting/bank','accounting/statements/pnl','accounting/periods','accounting/tax','accounting/assets','accounting/payroll','hr/directory','hr/org','hr/leave','hr/attendance','hr/vault','hr/onboarding','hr/announcements','hr/payroll','hr/exit','performance/scorecards','performance/kpis','performance/appraisals','performance/alerts','learning/mine','learning/programmes','learning/calendar','learning/assignments','learning/assessments','learning/reading','learning/reports','learning/certs','work/tasks','work/board','work/calendar','work/gantt','work/projects','work/issues','work/timesheets','work/workload','work/reports','reports/submissions','reports/review','reports/digest','chat','admin/users','admin/roles','admin/rules','admin/settings','admin/templates','admin/lookups','admin/integrations','admin/data','admin/chat','admin/audit','profile'];
const SKIP = new Set(['logout','demo.reset','switch.user','ov.close','ov.yes','ov.submit','nav.toggle','sclose','chat.attach','coll.sweep','adm.backup','adm.restore']);
(async () => {
  const b = await chromium.launch(LAUNCH); let clicks = 0, bad = 0;
  for (const uid of USERS) {
    const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); let errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text())); p.on('dialog', d => d.dismiss().catch(() => { })); p.on('popup', pp => pp.close().catch(() => { }));
    await p.goto(URL0); await p.waitForSelector('.login'); await p.evaluate(u => { SESS.uid = u; SESS.co = 'tre'; saveSession(); }, uid); await p.reload(); await p.waitForSelector('.shell');
    for (const r of ROUTES) {
      if (ONLY && !r.startsWith(ONLY)) continue;
      await p.evaluate(h => { location.hash = '#/' + h; }, r); await p.waitForTimeout(80);
      const acts = await p.evaluate(skip => { const s = new Set(skip); return Array.from(document.querySelectorAll('#main [data-act]')).map(e => e.dataset.act).filter(a => !s.has(a)); }, [...SKIP]);
      const uniqActs = [...new Set(acts)];
      for (const a of uniqActs) {
        errs = []; await p.evaluate(h => { if (location.hash !== '#/' + h) location.hash = '#/' + h; }, r); await p.waitForTimeout(40);
        const el = await p.$(`#main [data-act="${a}"]`); if (!el) continue; clicks++;
        try { await el.click({ timeout: 800, force: true }); } catch (e) { continue; }
        await p.waitForTimeout(60);
        if (await p.$('#ovform')) { await p.evaluate(() => { try { ACT['ov.submit'](); } catch (e) { console.error('SUBMIT ' + e.message); } }); await p.waitForTimeout(40); }
        await p.evaluate(() => { try { closeAllOverlays(); } catch (e) { } document.querySelectorAll('.toast').forEach(t => t.remove()); });
        if (errs.length) { bad++; console.log(`[${uid}] ${r} click ${a}: ${errs.slice(0, 2).join(' | ')}`); }
      }
    }
    await ctx.close();
  }
  await b.close(); console.log(`fuzz done: ${clicks} clicks, ${bad} with errors`);
})();
