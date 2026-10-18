'use strict';
/* Tri-OP shell: router, navigation, login, search, notifications, profile */

const PAGES = {}; const AFTER = []; const UI = { open: false };
try { Object.assign(UI, JSON.parse(localStorage.getItem(LS_UI) || '{}')); } catch (e) { }
let ROUTE = { parts: [], q: {} };

const NAV = [
  { k: 'dashboard', l: 'Dashboard', ic: 'home' }, { k: 'mywork', l: 'My work', ic: 'check' },
  { g: 'Sales' }, { k: 'inventory', l: 'Property inventory', ic: 'estate' }, { k: 'crm', l: 'Sales and CRM', ic: 'users' }, { k: 'realtors', l: 'Realtors (TARP)', ic: 'share' }, { k: 'cx', l: 'Customer experience', ic: 'headset' },
  { g: 'Money' }, { k: 'finance', l: 'Finance', ic: 'coins' }, { k: 'accounting', l: 'Accounting', ic: 'calc' },
  { g: 'People' }, { k: 'hr', l: 'HR and admin', ic: 'briefcase' }, { k: 'performance', l: 'Performance', ic: 'trophy' }, { k: 'learning', l: 'Learning', ic: 'cap' },
  { g: 'Work' }, { k: 'work', l: 'Tasks and projects', ic: 'clipboard' }, { k: 'reports', l: 'Department reports', ic: 'file' }, { k: 'chat', l: 'Team chat', ic: 'chat' },
  { g: 'System' }, { k: 'approvals', l: 'Approvals', ic: 'shield' }, { k: 'admin', l: 'Admin console', ic: 'settings' }
];
const OPEN_MODS = ['approvals', 'notifications', 'search', 'profile'];
const allowed = m => OPEN_MODS.includes(m) || !!modAccess(m);

function parseHash() {
  const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?'); const q = {};
  (qs || '').split('&').filter(Boolean).forEach(p => { const [k, v] = p.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
  return { parts: path.split('/').filter(Boolean).map(decodeURIComponent), q };
}
function go(path) { if (location.hash === '#/' + path) render(); else location.hash = '#/' + path; }
function openFromQuery(key, fn) { if (ROUTE.q[key]) { const id = ROUTE.q[key]; history.replaceState(null, '', location.pathname + location.search + '#/' + ROUTE.parts.join('/')); delete ROUTE.q[key]; setTimeout(() => fn(id), 20); } }

/* ---------- render ---------- */
let lastRoute = '';
function render() {
  ROUTE = parseHash(); const mod = ROUTE.parts[0] || '';
  const scrollY = window.scrollY, same = lastRoute === ROUTE.parts.join('/'); lastRoute = ROUTE.parts.join('/');
  AFTER.length = 0;
  const app = $('#app');
  if (mod === 'f' || mod === 'verify') { app.innerHTML = mod === 'f' ? (ROUTE.parts[1] === 'lead' ? publicLeadForm() : publicFormA()) : publicVerify(ROUTE.parts[1]); document.title = 'Triconna Real Estate'; return; }
  if (!SESS.uid || !me()) { app.innerHTML = loginPage(); document.title = 'Sign in · Tri-OP'; return; }
  if (!mod || mod === 'login') { location.hash = '#/dashboard'; return; }
  DB.sync();
  let html;
  if (!allowed(mod)) html = noAccess(mod);
  else if (!PAGES[mod]) html = card('Not found', '<p>This page does not exist.</p>');
  else { try { html = PAGES[mod](ROUTE.parts.slice(1), ROUTE.q); } catch (e) { console.error(e); html = card('Something went wrong', `<p>${esc(e.message)}</p><p class="muted small">Try again, or go back to the dashboard.</p>`); } }
  const keepSearch = $('#gsearch')?.value;
  app.innerHTML = shell(html, mod);
  if (keepSearch) $('#gsearch').value = keepSearch;
  document.title = (NAV.find(n => n.k === mod)?.l || 'Tri-OP') + ' · Tri-OP';
  AFTER.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  refreshOverlays(); if (same) window.scrollTo(0, scrollY); else window.scrollTo(0, 0);
}
function noAccess(mod) { return pageHead({ title: 'No access' }) + card('', `<p>Your role (${esc(ROLES[me().role].label)}) does not include this area. Access is scoped by role, department and record. Ask an administrator if you need it.</p><p style="margin-top:12px"><a class="btn" href="#/dashboard">Back to dashboard</a></p>`); }

function approvalCount() { return DB.q('approvals').filter(a => canDecide(a)).length; }
function chatUnread() { const u = me(); const rd = u.chatRead || {}; return DB.q('channels').filter(c => c.members.includes(u.id) && !(u.mute || []).includes(c.id)).reduce((n, c) => n + DB.q('messages').filter(m => m.ch === c.id && m.by !== u.id && m.ts > (rd[c.id] || 0)).length, 0); }
function shell(content, mod) {
  const u = me(); const badges = { approvals: approvalCount(), chat: chatUnread() };
  const rail = NAV.map(n => { if (n.g) return `<div class="grp">${n.g}</div>`; if (!allowed(n.k)) return ''; return `<a class="nl ${mod === n.k ? 'on' : ''}" href="#/${n.k}" title="${esc(n.l)}" aria-label="${esc(n.l)}">${icon(n.ic)}<span>${n.l}</span>${badges[n.k] ? `<em class="badge" style="font-style:normal">${badges[n.k]}</em>` : ''}</a>`; }).join('').replace(/<div class="grp">[^<]*<\/div>(?=<div class="grp">|$)/g, '');
  const mn = [['dashboard', 'home', 'Home'], ['mywork', 'check', 'My work'], ['chat', 'chat', 'Chat'], ['approvals', 'shield', 'Approvals']].filter(x => allowed(x[0])).map(([k, ic, l]) => `<a href="#/${k}" class="${mod === k ? 'on' : ''}">${icon(ic)}<span>${l}</span></a>`).join('') + `<button data-act="more" aria-label="More">${icon('menu')}<span>More</span></button>`;
  const cos = DB.d.companies.filter(c => u.co.includes(c.id));
  return `<div class="shell"><aside class="rail ${UI.open ? 'open' : ''}"><button class="logo" data-act="nav.toggle" aria-label="Expand or collapse menu" title="Expand or collapse menu" style="border:0;background:none;cursor:pointer">${logoSvg('#fff')}</button><nav aria-label="Main">${rail}</nav><div class="rb"><a class="nl" href="#/profile" title="Profile">${icon('user')}<span>${esc(u.name)}</span></a></div></aside>
  <main class="main" id="main"><div class="topbar">${cos.length > 1 ? `<label class="chip co">${icon('building', 'sm')}<select id="cosw" aria-label="Company">${opts(cos.map(c => [c.id, c.name]), CO)}</select></label>` : `<span class="chip co">${icon('building', 'sm')}${esc(company().name)}</span>`}
  <div class="search"><label class="chip">${icon('search', 'sm')}<input id="gsearch" type="search" placeholder="Search clients, plots, staff, invoices, tickets" autocomplete="off" aria-label="Global search"></label><div class="sresults hide" id="sres"></div></div><span class="sp"></span>
  ${readOnlyUser() ? '' : `<button class="btn primary" data-act="quick">${icon('plus', 'sm')} Quick create</button>`}
  <button class="iconbtn" data-act="bell" aria-label="Notifications">${icon('bell')}${unreadCount() ? '<span class="dot"></span>' : ''}</button>
  <button class="iconbtn" style="padding:0;border:0" data-act="profile" aria-label="Profile">${avatar(u.name)}</button></div>${content}</main></div><nav class="mnav" aria-label="Mobile">${mn}</nav>`;
}
function renderBadge() { if (SESS.uid && me()) render(); }

/* ---------- login ---------- */
function loginPage() {
  const groups = [['Executives', ['u_md', 'u_coo']], ['Heads of department', ['u_ops', 'u_sales', 'u_rd', 'u_cxh']], ['Finance and HR', ['u_fin1', 'u_fin2', 'u_hr']], ['Staff', ['u_s1', 'u_cx1', 'u_op1']], ['System and audit', ['u_admin', 'u_aud']]];
  return `<div class="login"><section class="l">${leafBg}<div class="row" style="gap:14px"><span style="width:46px;display:block">${logoSvg('#fff')}</span><div><div style="font-size:20px">Tri-OP</div><div style="color:#9fb7a8;font-size:13px">Triconna Real Estate</div></div></div><div><h1>One calm place to run <em>sales</em>, money and people.</h1><p style="color:#bcd3c4;margin-top:16px;max-width:460px">Inventory, CRM, finance and accounting, realtors, HR, tasks, chat and learning, each person seeing only what their role allows.</p></div><div class="small" style="color:#7f9b8a">TRC-OPS-SPEC-001 · Prototype with demo data stored in this browser</div></section>
  <section class="r"><div style="max-width:560px;margin:0 auto"><h2 style="font-size:28px;letter-spacing:-.02em;margin-bottom:6px">Sign in</h2><p class="muted" style="margin-bottom:20px">Pick a demo account to see the role-based view. Executive, Finance, HR and Admin roles ask for a two-factor code (demo code: <b>123456</b>).</p>
  ${groups.map(([g, ids]) => `<div class="small muted" style="margin:14px 0 6px;text-transform:uppercase;letter-spacing:.06em">${g}</div><div class="stack" style="gap:8px">${ids.map(id => { const u = userById(id); const r = ROLES[u.role]; return `<button class="ucard" data-act="login" data-u="${id}">${avatar(u.name)}<div class="grow"><b>${esc(u.name)}</b><span>${esc(u.title)} · ${esc(r.label)}</span></div>${r.tfa ? `<span class="pill nodot">${icon('lock', 'sm')} 2FA</span>` : ''}${icon('chevr', 'sm')}</button>`; }).join('')}</div>`).join('')}
  <div class="hr"></div><a class="btn" href="#/f/form-a">${icon('share', 'sm')} Realtor registration (Form A)</a> <button class="btn ghost" data-act="demo.reset">Reset demo data</button></div></section></div>`;
}
ACT['login'] = el => {
  const u = userById(el.dataset.u);
  const done = () => { SESS.uid = u.id; SESS.co = u.co.includes(CO) ? CO : u.co[0]; CO = SESS.co; saveSession(); audit('login', 'session', u.id, ROLES[u.role].label + (ROLES[u.role].tfa ? ' (2FA)' : '')); location.hash = '#/dashboard'; render(); };
  if (ROLES[u.role].tfa) openForm({ title: 'Two-factor sign-in', submit: 'Verify and sign in', fields: [{ n: 'code', l: 'Six-digit code from your authenticator app', req: true, ph: '123456', hint: 'Demo code: 123456', vf: v => v === '123456' ? '' : 'That code is not valid. Enter 123456 for the demo.' }], onSubmit: () => { done(); } });
  else done();
};
ACT['logout'] = () => { audit('logout', 'session', SESS.uid, ''); SESS.uid = null; saveSession(); closeAllOverlays(); location.hash = '#/login'; render(); };
ACT['demo.reset'] = () => confirmDlg('This replaces all data in this browser with the original demo data.', () => { DB.reset(); SESS.uid = null; saveSession(); location.hash = '#/login'; render(); toast('Demo data reset'); }, { danger: true, yes: 'Reset data' });
ACT['switch.user'] = el => { closeAllOverlays(); SESS.uid = null; saveSession(); location.hash = '#/login'; render(); };

/* ---------- public pages ---------- */
function publicShell(inner) { return `<div class="publicpage"><div class="row" style="gap:12px;margin-bottom:20px"><span style="width:44px;display:block">${logoSvg('#008C38').replace(/stroke="#001F10"/, 'stroke="#FCFFFC"')}</span><div><b style="font-size:18px">Triconna Real Estate</b><div class="muted small">TARP realtor network</div></div></div>${inner}</div>`; }
function publicFormA() {
  const q = ROUTE.q; const camp = DB.d.campaigns.find(c => c.code === q.camp); const refc = (q.ref || '').toUpperCase();
  const ups = DB.d.realtors.find(r => r.code && r.code === refc);
  const src = ups ? 'Referral' : camp ? (camp.kind === 'consultant' ? 'Ads: Consultant campaign' : 'Ads: Triconna brand') : 'Organic';
  const srcNote = ups ? 'Referred by ' + ups.name : camp ? 'Campaign: ' + camp.name : 'General registration link';
  const fields = [{ n: 'name', l: 'Full name', req: true }, { n: 'phone', l: 'Phone number', t: 'tel', req: true, hint: 'We use your phone number to avoid duplicate registrations.' }, { n: 'email', l: 'Email', t: 'email', req: true }, { n: 'address', l: 'Home address' }, { n: 'refcode', l: 'Referral code (if you have one)', v: refc }, { n: 'heard', l: 'How did you hear about us?', t: 'select', o: ['Instagram', 'Facebook', 'Radio', 'Billboard', 'Friend or colleague', 'Walk-in', 'Search or website', 'Other'], hint: 'For marketing reports only. It does not change your source.' }, { n: 'agree', l: 'I agree that Triconna may process my details under the Nigeria Data Protection Act 2023.', t: 'check', req: true }];
  return publicShell(`<div class="card white"><h2 style="font-size:24px;letter-spacing:-.02em;margin-bottom:6px">Join the TARP realtor network</h2><p class="muted" style="margin-bottom:16px">Form A: register your interest. Our Realtors Development team will guide you through onboarding.</p><div class="alert ok" style="margin-bottom:16px">${icon('check', 'sm')}<span>Source recorded from this link: <b>${esc(src)}</b>. ${esc(srcNote)}</span></div><form id="forma" novalidate>${formHtml(fields, { refcode: refc }, 'fa')}</form><p style="margin-top:16px"><button class="btn primary" data-act="forma.submit" data-src="${esc(src)}" data-camp="${esc(camp?.id || '')}">Register</button></p></div>`);
}
ACT['forma.submit'] = el => {
  const form = $('#forma'); const fields = [{ n: 'name', l: 'Full name', req: true }, { n: 'phone', l: 'Phone number', req: true }, { n: 'email', l: 'Email', req: true }, { n: 'address', l: 'Address' }, { n: 'refcode', l: 'Referral code' }, { n: 'heard', l: 'Heard' }, { n: 'agree', l: 'Consent', t: 'check', req: true }];
  const v = readForm(form, fields); if (!v) return; if (!v.agree) { toast('Please accept the data consent.', 'warn'); return; }
  const coId = DB.d.companies[0].id; const co0 = CO; CO = coId;
  const dup = DB.q('realtors').find(r => phoneNorm(r.phone) === phoneNorm(v.phone));
  if (dup) { CO = co0; $('#app').innerHTML = publicShell(card('Already registered', `<p>This phone number is already registered with the TARP network, so no new entry was created. Our team will contact you.</p>`)); return; }
  const refc = (v.refcode || '').trim().toUpperCase(); const up = refc && DB.q('realtors').find(r => r.code === refc);
  let source = el.dataset.src, ref = el.dataset.camp; if (up) { source = 'Referral'; ref = up.id; }
  const r = DB.add('realtors', { name: v.name, phone: v.phone, email: v.email, address: v.address, stage: 'Entry registered', source, sourceRef: ref, heard: v.heard, batch: '', created: Date.now(), lastActivity: Date.now(), checklist: Object.fromEntries(['formB', 'physical', 'cbt', 'tour', 'formC', 'docs'].map(k => [k, { done: false }])), level: '', code: '', upline: up ? up.id : '', formA: true, locked: true }, { quiet: true });
  audit('form-a', 'realtors', r.id, 'Online Form A · source ' + source);
  const head = deptHead('Realtors Development'); notify(head, 'New Form A sign-up: ' + v.name, 'Source: ' + source, '#/realtors/pipeline');
  CO = co0; $('#app').innerHTML = publicShell(card('Thank you', `<p style="font-size:16px;margin-bottom:8px">Your registration has been received, <b>${esc(v.name)}</b>.</p><p class="muted">We will contact you on ${esc(v.phone)} with your onboarding schedule.</p>`));
};
function publicVerify(code) {
  const d = DB.d.docsLog.find(x => x.code === code);
  return publicShell(d ? `<div class="card white"><div class="alert ok" style="margin-bottom:14px">${icon('check', 'sm')}<span><b>Valid document.</b> This was issued by Triconna Real Estate.</span></div>${kv([['Document', esc(d.title)], ['Reference', esc(d.code)], ['Issued', fmtDT(d.ts)], ['Client', esc(d.client || '—')], ['Sale', esc(d.saleNo || '—')]])}</div>` : `<div class="card white"><div class="alert bad">${icon('warn', 'sm')}<span><b>We could not verify this code.</b> Check the code on the document, or contact Triconna.</span></div></div>`);
}

/* ---------- global search ---------- */
function searchAll(q) {
  q = q.toLowerCase().trim(); if (q.length < 2) return []; const m = s => String(s || '').toLowerCase().includes(q); const out = [];
  const add = (g, t, s, l, ic) => out.push({ g, t, s, l, ic });
  if (modAccess('crm') || modAccess('crm:read')) { DB.q('clients').filter(c => m(c.name) || m(c.phone) || m(c.email)).slice(0, 5).forEach(c => add('Clients', c.name, c.phone, `crm/client/${c.id}`, 'user')); DB.q('leads').filter(c => m(c.name) || m(c.phone)).slice(0, 4).forEach(c => add('Leads', c.name, c.stage + ' · ' + c.phone, `crm/leads?l=${c.id}`, 'target')); DB.q('sales').filter(s => m(s.no)).slice(0, 3).forEach(s => add('Sales', s.no, DB.get('clients', s.clientId)?.name, `crm/sales?s=${s.id}`, 'receipt')); }
  if (modAccess('inventory') || modAccess('inventory:read')) DB.q('plots').filter(p => m(plotLabel(p)) || m(p.survey)).slice(0, 6).forEach(p => add('Plots', plotLabel(p), PLOT_LABEL[p.status] + ' · ' + money(p.price), `inventory/plots?p=${p.id}`, 'estate'));
  if (modAccess('hr') || can('read.all')) DB.q('employees').filter(e => m(e.name) || m(e.title)).slice(0, 5).forEach(e => add('Staff', e.name, e.title + ' · ' + e.dept, `hr/directory?e=${e.id}`, 'users')); else DB.q('employees').filter(e => m(e.name)).slice(0, 4).forEach(e => add('Staff', e.name, e.title, `hr/directory?e=${e.id}`, 'users'));
  if (modAccess('finance')) DB.q('invoices').filter(i => m(i.no) || m(i.customer)).slice(0, 4).forEach(i => add('Invoices', i.no, i.customer + ' · ' + money(i.total), `finance/invoices?i=${i.id}`, 'receipt'));
  if (modAccess('cx')) DB.q('tickets').filter(t => m(t.no) || m(t.subject)).slice(0, 4).forEach(t => add('Tickets', t.no + ' · ' + t.subject, t.status, `cx/tickets?t=${t.id}`, 'headset'));
  DB.q('tasks').filter(t => m(t.title) && (can('task.manage') || t.assignee === SESS.uid || (t.followers || []).includes(SESS.uid))).slice(0, 4).forEach(t => add('Tasks', t.title, userName(t.assignee) + ' · ' + t.status, `work/tasks?t=${t.id}`, 'clipboard'));
  if (modAccess('realtors') || modAccess('realtors:read')) DB.q('realtors').filter(r => m(r.name) || m(r.code)).slice(0, 4).forEach(r => add('Realtors', r.name, r.stage, `realtors/pipeline?r=${r.id}`, 'share'));
  return out;
}
function paintSearch(q) {
  const box = $('#sres'); if (!box) return; const res = searchAll(q); if (q.trim().length < 2) { box.classList.add('hide'); return; }
  let g = ''; box.innerHTML = res.length ? res.map(r => { const h = (r.g !== g ? `<div class="grp">${r.g}</div>` : ''); g = r.g; return `${h}<a href="#/${r.l}" data-act="sclose">${icon(r.ic, 'sm')}<span class="grow"><b style="font-weight:500">${esc(r.t)}</b><br><span class="small muted">${esc(r.s || '')}</span></span></a>`; }).join('') : '<div class="empty">No results. Try a name, phone number, plot or invoice number.</div>';
  box.classList.remove('hide');
}
ACT['sclose'] = () => { $('#sres')?.classList.add('hide'); const s = $('#gsearch'); if (s) s.value = ''; };

/* ---------- notifications, profile, quick create ---------- */
ACT['bell'] = () => openDrawer(() => { const list = DB.q('notifications').filter(n => n.user === SESS.uid).sort(by(n => n.ts, -1)).slice(0, 40); return { title: 'Notifications', body: list.length ? `<div class="stack" style="gap:8px">${list.map(n => `<a class="tilebtn" href="${n.link || '#/notifications'}" data-act="nread" data-id="${n.id}" style="${n.read ? '' : 'background:var(--honey);border-color:var(--forest)'}">${icon(n.critical ? 'warn' : 'bell')}<span class="grow"><b style="font-weight:500">${esc(n.title)}</b><br><span class="small muted">${esc(n.body)} · ${ago(n.ts)}</span></span></a>`).join('')}</div>` : emptyState('You are all caught up.', 'bell'), foot: `<button class="btn" data-act="nreadall">Mark all as read</button>` }; });
ACT['nread'] = el => { DB.set('notifications', el.dataset.id, { read: true }, { quiet: true }); closeAllOverlays(); };
ACT['nreadall'] = () => { DB.q('notifications').filter(n => n.user === SESS.uid).forEach(n => DB.set('notifications', n.id, { read: true }, { quiet: true })); render(); };
PAGES.notifications = () => { setTimeout(() => ACT.bell(), 10); return pageHead({ title: 'Notifications' }) + card('', '<p class="muted">Opening your notifications…</p>'); };
ACT['more'] = () => openModal({ title: 'Menu', body: `<div class="stack" style="gap:8px">${NAV.filter(n => n.k && allowed(n.k)).map(n => `<a class="tilebtn" href="#/${n.k}" data-act="ov.close">${icon(n.ic)}<span>${n.l}</span></a>`).join('')}<a class="tilebtn" href="#/profile" data-act="ov.close">${icon('user')}<span>Profile</span></a></div>`, live: false });
ACT['nav.toggle'] = () => { UI.open = !UI.open; localStorage.setItem(LS_UI, JSON.stringify(UI)); $('.rail').classList.toggle('open', UI.open); };
ACT['quick'] = () => {
  const items = [['New task', 'clipboard', () => ACT['task.new']?.()], ['Request leave', 'calendar', () => ACT['leave.new']?.()], ['Raise expense requisition', 'wallet', () => ACT['exp.new']?.(), 'fin.expense.any'], ['New lead', 'target', () => ACT['lead.new']?.(), 'crm.write'], ['Log ticket', 'headset', () => ACT['tk.new']?.(), 'cx.write'], ['Record payment', 'coins', () => ACT['pay.new']?.(), 'fin.confirm'], ['New invoice', 'receipt', () => ACT['inv.new']?.(), 'fin.invoice'], ['Register realtor (walk-in)', 'share', () => ACT['rlt.new']?.(), 'rlt.write']].filter(i => !i[3] || i[3] === 'fin.expense.any' || can(i[3]));
  QUICK = items; openModal({ title: 'Quick create', body: `<div class="stack" style="gap:8px">${items.map((it, i) => `<button class="tilebtn" data-act="quick.go" data-i="${i}">${icon(it[1])}<span>${it[0]}</span></button>`).join('')}</div>`, live: false });
};
let QUICK = []; ACT['quick.go'] = el => { const f = QUICK[+el.dataset.i][2]; closeOverlay(); f(); };

PAGES.profile = () => {
  const u = me(); const r = ROLES[u.role]; const e = empOf(u.id);
  return pageHead({ title: `${esc(u.name.split(' ')[0])}${pi('user', true)}profile`, sub: esc(u.title) + ' · ' + esc(u.dept) }) +
    `<div class="grid g2"><section class="card"><h3>Account</h3>${kv([['Role', esc(r.label)], ['Scope', esc(r.scope)], ['What it allows', esc(r.note)], ['Email', esc(u.email)], ['Phone', esc(u.phone)], ['Two-factor', r.tfa ? 'Required for your role' : 'Optional'], ['Companies', u.co.map(c => esc(DB.get('companies', c).name)).join(', ')]])}<div class="row" style="margin-top:16px"><button class="btn" data-act="switch.user">${icon('refresh', 'sm')} Switch demo user</button><button class="btn danger" data-act="logout">${icon('logout', 'sm')} Sign out</button></div></section>
    <section class="card"><h3>Notification preferences</h3>${autoForm('users', u.id, [{ n: 'prefs_email', l: 'Email', t: 'check' }, { n: 'prefs_sms', l: 'SMS', t: 'check' }, { n: 'prefs_app', l: 'In-app messages', t: 'check' }], { prefs_email: u.prefs?.email, prefs_sms: u.prefs?.sms, prefs_app: u.prefs?.app })}<p class="small muted">Critical alerts (SLA breaches, payment holds, security) are always delivered and cannot be switched off. WhatsApp arrives with Phase 3.</p>
    <h3 style="margin-top:20px">Approval delegation</h3><p class="small muted" style="margin-bottom:8px">While you are away, someone else can approve on your behalf. Every delegated decision is logged.</p>${u.deleg?.to ? `<p>Delegated to <b>${esc(userName(u.deleg.to))}</b> until ${fmtDate(u.deleg.until)}.</p>` : ''}<button class="btn" data-act="deleg.set">${u.deleg?.to ? 'Change delegate' : 'Set delegate'}</button></section></div>
    ${e ? `<section class="card" style="margin-top:16px"><h3>My employment</h3>${kv([['Manager', esc(userName(e.manager))], ['Start date', fmtDate(e.start)], ['Grade', esc(e.grade)], ['Annual leave', (e.leaveAllow - (e.leaveTaken || 0)) + ' of ' + e.leaveAllow + ' days left']])}</section>` : ''}`;
};
ACT['deleg.set'] = () => openForm({ title: 'Delegate approvals', fields: [{ n: 'to', l: 'Delegate to', t: 'select', req: true, o: coUsers().filter(x => x.id !== SESS.uid && x.role !== 'auditor').map(x => [x.id, x.name + ' · ' + x.title]) }, { n: 'until', l: 'Until', t: 'date', req: true, min: today() }], submit: 'Save delegation', onSubmit: v => { DB.set('users', SESS.uid, { deleg: { to: v.to, until: v.until } }); render(); } });

/* ---------- global events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  if (!t.closest('.search')) $('#sres')?.classList.add('hide');
  const a = t.closest('[data-act]');
  if (a && ACT[a.dataset.act]) { if (a.tagName === 'A' && a.dataset.act !== 'sclose' && a.dataset.act !== 'nread') e.preventDefault(); try { ACT[a.dataset.act](a, e); } catch (err) { console.error(err); toast(err.message || 'Something went wrong', 'bad'); } return; }
  if (tableClick(e)) return;
});
document.addEventListener('input', e => {
  if (e.target.id === 'gsearch') { paintSearch(e.target.value); return; }
  if (tableInput(e)) return;
});
document.addEventListener('change', e => {
  if (e.target.dataset.on && ACT[e.target.dataset.on]) { ACT[e.target.dataset.on](e.target, e); return; }
  if (e.target.id === 'cosw') { CO = e.target.value; SESS.co = CO; saveSession(); audit('switch-company', 'session', CO, ''); render(); return; }
  if (e.target.closest('[data-autosave]') && !e.target.matches('[data-file]')) { const box = e.target.closest('[data-autosave]'); if (box.dataset.autosave.startsWith('users|') && e.target.name?.startsWith('prefs_')) { const f = $$('input[name^=prefs_]', box); const prefs = Object.fromEntries(f.map(x => [x.name.replace('prefs_', ''), x.checked])); DB.set('users', SESS.uid, { prefs }); const s = $('[data-saved]', box); if (s) s.textContent = '✓ Saved'; return; } autosaveChange(e.target); return; }
  if (tableChange(e)) return;
  const fi = e.target.closest('[data-file]'); if (fi && e.target.files && !e.target.closest('#overlay')) { const file = e.target.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { e.target.dataset.url = rd.result; e.target.dataset.fname = file.name; }; rd.readAsDataURL(file); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && OV.stack.length) closeOverlay(); });
window.addEventListener('hashchange', () => { closeAllOverlays(); render(); });
window.addEventListener('storage', e => { if (e.key === LS_REV && SESS.uid) { DB.load(); if (ROUTE.parts[0] === 'chat' && typeof chatRefresh === 'function' && chatRefresh()) return; if (!OV.stack.length && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render(); } });

/* ---------- boot ---------- */
function boot() {
  DB.init(); if (typeof applyRoleOverrides === 'function') applyRoleOverrides(); loadSession(); if (SESS.uid && !me()) { SESS.uid = null; }
  Jobs.run(); setInterval(() => { if (!OV.stack.length && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) Jobs.run(); }, 60000);
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
}

