const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); } })();
const LAUNCH = { executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] };
const URL0 = process.env.TRIOP_URL || 'http://localhost:8765/index.html';
const BASE = URL0;
const USERS = (process.argv[2] || 'u_md,u_coo,u_ops,u_sales,u_rd,u_cxh,u_fin1,u_fin2,u_hr,u_s1,u_cx1,u_op1,u_admin,u_aud').split(',');
const ROUTES = {
  dashboard: ['', 'exec', 'dept', 'me'], mywork: [''], approvals: ['waiting', 'mine', 'all'], notifications: [''], profile: [''],
  inventory: ['estates', 'plots', 'titles', 'inspections'], crm: ['pipeline', 'leads', 'clients', 'sales', 'calls', 'targets'],
  realtors: ['pipeline', 'events', 'sources', 'network', 'leads', 'reports', 'formA'], cx: ['tickets', 'sla', 'surveys'],
  finance: ['confirm', 'payments', 'collections', 'commissions', 'invoices', 'expenses', 'budgets', 'reports', 'tripay'],
  accounting: ['accounts', 'journals', 'payables', 'bank', 'statements/pnl', 'statements/bs', 'statements/tb', 'statements/cf', 'periods', 'tax', 'assets', 'payroll'],
  hr: ['directory', 'org', 'leave', 'attendance', 'vault', 'onboarding', 'announcements', 'payroll', 'exit'], performance: ['scorecards', 'kpis', 'appraisals', 'alerts'], learning: ['mine', 'programmes', 'calendar', 'assignments', 'assessments', 'reading', 'reports', 'certs'],
  work: ['tasks', 'board', 'calendar', 'gantt', 'projects', 'issues', 'timesheets', 'workload', 'reports'], reports: ['submissions', 'review', 'digest'], chat: [''],
  admin: ['users', 'roles', 'org', 'rules', 'settings', 'templates', 'lookups', 'integrations', 'data', 'chat', 'audit']
};
(async () => {
  const browser = await chromium.launch(LAUNCH);
  let bad = 0, total = 0;
  for (const uid of USERS) {
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } }); const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
    await page.goto(BASE); await page.waitForSelector('.login');
    await page.click(`[data-u="${uid}"]`); await page.waitForTimeout(150);
    if (await page.$('#ovform')) { await page.fill('input[name=code]', '123456'); await page.click('[data-act="ov.submit"]'); }
    await page.waitForSelector('.shell', { timeout: 5000 });
    for (const [mod, tabs] of Object.entries(ROUTES)) {
      for (const t of tabs) {
        total++; errs.length = 0; const h = `#/${mod}${t ? '/' + t : ''}`;
        await page.evaluate(h2 => { location.hash = h2; }, h); await page.waitForTimeout(60);
        const txt = await page.evaluate(() => document.querySelector('#main') ? document.querySelector('#main').innerText.slice(0, 3000).replace(/\n/g, ' ') : 'NOMAIN');
        const failed = errs.length || /Something went wrong/.test(txt) || (/Not found|does not exist/.test(txt));
        if (failed) { bad++; console.log(`[${uid}] ${h} -> ${errs.join(' | ') || txt.slice(0,200)}`); }
      }
    }
    await ctx.close();
  }
  await browser.close(); console.log(`done: ${total} routes, ${bad} with problems`);
})();
