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
  if (mod === 'reset') { app.innerHTML = resetPage(); document.title = 'Reset password · Tri-OP'; return; }
  if (mod === 'f' || mod === 'verify') { app.innerHTML = mod === 'f' ? (ROUTE.parts[1] === 'lead' ? publicLeadForm() : publicFormA()) : publicVerify(ROUTE.parts[1]); document.title = 'Triconna Real Estate'; return; }
  if (!SESS.uid || !me()) { app.innerHTML = loginPage(); document.title = 'Sign in · Tri-OP'; return; }
  if (!mod || mod === 'login') { location.hash = '#/dashboard'; return; }
  DB.sync();
  let html;
  if (!PAGES[mod]) html = notFoundPage();
  else if (!allowed(mod)) html = noAccess(mod);
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
  const groups = [['Executives', ['u_md', 'u_coo', 'u_cexec']], ['Heads of department', ['u_ops', 'u_sales', 'u_rd', 'u_cxh']], ['Finance and HR', ['u_fin1', 'u_fin2', 'u_hr']], ['Staff', ['u_s1', 'u_cx1', 'u_op1']], ['System and audit', ['u_admin', 'u_aud']]];
  return `<div class="login"><section class="l">${leafBg}<div class="row" style="gap:14px"><span style="width:46px;display:block">${logoSvg('#fff')}</span><div><div style="font-size:20px">Tri-OP</div><div style="color:#9fb7a8;font-size:13px">Triconna Real Estate</div></div></div><div><h1>One calm place to run <em>sales</em>, money and people.</h1><p style="color:#bcd3c4;margin-top:16px;max-width:460px">Inventory, CRM, finance and accounting, realtors, HR, tasks, chat and learning, each person seeing only what their role allows.</p></div><div class="small" style="color:#7f9b8a">TRC-OPS-SPEC-001 · Prototype with demo data stored in this browser</div></section>
  <section class="r"><div style="max-width:560px;margin:0 auto"><h2 style="font-size:28px;letter-spacing:-.02em;margin-bottom:6px">Sign in</h2><p class="muted" style="margin-bottom:20px">Pick a demo account to see the role-based view. Executive, Finance, HR and Admin roles ask for a two-factor code (demo code: <b>123456</b>).</p>
  ${groups.map(([g, ids]) => `<div class="small muted" style="margin:14px 0 6px;text-transform:uppercase;letter-spacing:.06em">${g}</div><div class="stack" style="gap:8px">${ids.map(id => { const u = userById(id); const r = ROLES[u.role]; return `<button class="ucard" data-act="login" data-u="${id}">${avatar(u.name)}<div class="grow"><b>${esc(u.name)}</b><span>${esc(u.title)} · ${esc(r.label)}</span></div>${r.tfa ? `<span class="pill nodot">${icon('lock', 'sm')} 2FA</span>` : ''}${icon('chevr', 'sm')}</button>`; }).join('')}</div>`).join('')}
  <div class="hr"></div><a class="btn" href="#/f/form-a">${icon('share', 'sm')} Realtor registration (Form A)</a> <a class="btn ghost" href="#/reset">Forgot password?</a> <button class="btn ghost" data-act="demo.reset">Reset demo data</button></div></section></div>`;
}
ACT['login'] = el => {
  const u = userById(el.dataset.u);
  if (u.expires && u.expires < today()) return toast('This access ended on ' + fmtDate(u.expires) + '. Ask an administrator to extend it.', 'bad');
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
  box.innerHTML += `<a href="#/search?q=${encodeURIComponent(q.trim())}" data-act="sclose" style="justify-content:center;color:var(--forest)">See all results and filter</a>`; box.classList.remove('hide');
}
PAGES.search = (parts, q) => {
  const term = q.q || UI.lastSearch || ''; UI.lastSearch = term; const res = searchAll(term); const groups = uniq(res.map(r => r.g)); const g = UI.searchG && groups.includes(UI.searchG) ? UI.searchG : '';
  const list = res.filter(r => !g || r.g === g);
  return pageHead({ title: `Search${pi('search', true)}results`, sub: term ? `${res.length} results for “${esc(term)}” across what your role can see` : 'Type at least two characters in the search box' }) + `<form class="row" style="margin-bottom:14px" data-submit="search.go"><label class="chip grow">${icon('search', 'sm')}<input name="q" value="${esc(term)}" placeholder="Search clients, plots, staff, invoices, tickets" aria-label="Search"></label><button class="btn primary">Search</button></form><div class="tabs">${[''].concat(groups).map(x => `<a href="#" data-act="search.g" data-g="${esc(x)}" class="${x === g ? 'on' : ''}">${x || 'All'}${x ? `<span class="n">${res.filter(r => r.g === x).length}</span>` : ''}</a>`).join('')}</div>` + (list.length ? `<div class="stack" style="gap:8px">${list.map(r => `<a class="tilebtn" href="#/${r.l}">${icon(r.ic)}<span class="grow"><b style="font-weight:500">${esc(r.t)}</b><br><span class="small muted">${esc(r.s || '')}</span></span><span class="tag">${esc(r.g)}</span></a>`).join('')}</div>` : card('', emptyState(term ? 'No results. Try a name, phone number, plot or invoice number.' : 'Start typing to search.', 'search')));
};
ACT['search.go'] = f => { const v = f.q.value.trim(); UI.searchG = ''; go('search?q=' + encodeURIComponent(v)); };
ACT['search.g'] = el => { UI.searchG = el.dataset.g; render(); };
ACT['sclose'] = () => { $('#sres')?.classList.add('hide'); const s = $('#gsearch'); if (s) s.value = ''; };

/* ---------- notifications, profile, quick create ---------- */
ACT['bell'] = () => openDrawer(() => { const list = DB.q('notifications').filter(n => n.user === SESS.uid).sort(by(n => n.ts, -1)).slice(0, 40); return { title: 'Notifications', body: list.length ? `<div class="stack" style="gap:8px">${list.map(n => `<a class="tilebtn" href="${n.link || '#/notifications'}" data-act="nread" data-id="${n.id}" style="${n.read ? '' : 'background:var(--honey);border-color:var(--forest)'}">${icon(n.critical ? 'warn' : 'bell')}<span class="grow"><b style="font-weight:500">${esc(n.title)}</b><br><span class="small muted">${esc(n.body)} · ${ago(n.ts)}</span></span></a>`).join('')}</div>` : emptyState('You are all caught up.', 'bell'), foot: `<button class="btn" data-act="nreadall">Mark all as read</button>` }; });
ACT['nread'] = el => { DB.set('notifications', el.dataset.id, { read: true }, { quiet: true }); closeAllOverlays(); };
ACT['nreadall'] = () => { DB.q('notifications').filter(n => n.user === SESS.uid).forEach(n => DB.set('notifications', n.id, { read: true }, { quiet: true })); render(); };
ACT['more'] = () => openModal({ title: 'Menu', body: `<div class="stack" style="gap:8px">${NAV.filter(n => n.k && allowed(n.k)).map(n => `<a class="tilebtn" href="#/${n.k}" data-act="ov.close">${icon(n.ic)}<span>${n.l}</span></a>`).join('')}<a class="tilebtn" href="#/profile" data-act="ov.close">${icon('user')}<span>Profile</span></a></div>`, live: false });
ACT['nav.toggle'] = () => { UI.open = !UI.open; localStorage.setItem(LS_UI, JSON.stringify(UI)); $('.rail').classList.toggle('open', UI.open); };
ACT['profile'] = () => { closeAllOverlays(); go('profile'); };
ACT['quick'] = () => {
  const items = [['New task', 'clipboard', () => ACT['task.new']?.()], ['Request leave', 'calendar', () => ACT['leave.new']?.()], ['Raise expense requisition', 'wallet', () => ACT['exp.new']?.(), 'fin.expense.any'], ['New lead', 'target', () => ACT['lead.new']?.(), 'crm.write'], ['Log ticket', 'headset', () => ACT['tk.new']?.(), 'cx.write'], ['Record payment', 'coins', () => ACT['pay.new']?.(), 'fin.confirm'], ['New invoice', 'receipt', () => ACT['inv.new']?.(), 'fin.invoice'], ['Register realtor (walk-in)', 'share', () => ACT['rlt.new']?.(), 'rlt.write']].filter(i => !i[3] || i[3] === 'fin.expense.any' || can(i[3]));
  QUICK = items; openModal({ title: 'Quick create', body: `<div class="stack" style="gap:8px">${items.map((it, i) => `<button class="tilebtn" data-act="quick.go" data-i="${i}">${icon(it[1])}<span>${it[0]}</span></button>`).join('')}</div>`, live: false });
};
let QUICK = []; ACT['quick.go'] = el => { const f = QUICK[+el.dataset.i][2]; closeOverlay(); f(); };

/* ----- notifications centre ----- */
PAGES.notifications = (parts) => {
  const f = parts[0] || 'all'; const all = DB.q('notifications').filter(n => n.user === SESS.uid).sort(by(n => n.ts, -1));
  const list = all.filter(n => f === 'unread' ? !n.read : f === 'critical' ? n.critical : true);
  return pageHead({ title: `Notifications${pi('bell', true)}centre`, sub: `${all.filter(n => !n.read).length} unread · ${all.length} in total`, acts: `<a class="btn" href="#/profile/notifications">${icon('settings', 'sm')} Preferences</a><button class="btn primary" data-act="nreadall">Mark all as read</button>` }) + tabs('notifications', [{ k: 'all', l: 'All' }, { k: 'unread', l: 'Unread', n: all.filter(n => !n.read).length || '' }, { k: 'critical', l: 'Critical' }], f) + (list.length ? `<div class="stack" style="gap:8px">${list.slice(0, 80).map(n => `<a class="tilebtn" href="${n.link || '#/notifications'}" data-act="nread2" data-id="${n.id}" style="${n.read ? '' : 'background:var(--honey);border-color:var(--forest)'}">${icon(n.critical ? 'warn' : 'bell')}<span class="grow"><b style="font-weight:500">${esc(n.title)}</b><br><span class="small muted">${esc(n.body)} · ${ago(n.ts)}</span></span>${n.critical ? spill('Critical', 'bad') : `<span class="tag">${esc((NOTE_CATS.find(c => c[0] === (n.cat || noteCat(n.link))) || [0, 'System'])[1])}</span>`}${n.read ? '' : spill('New', 'ok')}</a>`).join('')}</div>` : card('', emptyState('You are all caught up.', 'bell')));
};
ACT['nread2'] = el => { DB.set('notifications', el.dataset.id, { read: true }, { quiet: true }); };

/* ----- profile, preferences, security ----- */
PAGES.profile = (parts) => {
  const tab = parts[0] || 'account'; const u = me(); const r = ROLES[u.role]; const e = empOf(u.id);
  const body = tab === 'notifications' ? profNotify(u) : tab === 'security' ? profSecurity(u, r) : `<div class="grid g2"><section class="card"><h3>Account</h3>${kv([['Role', esc(r.label)], ['Scope', esc(r.scope)], ['What it allows', esc(r.note)], ['Email', esc(u.email)], ['Phone', esc(u.phone)], ['Department', esc(u.dept)], ['Companies', u.co.map(c => esc(DB.get('companies', c).name)).join(', ')]])}<div class="row" style="margin-top:16px"><button class="btn" data-act="switch.user">${icon('refresh', 'sm')} Switch demo user</button><a class="btn ghost" href="#/system">System states</a><button class="btn danger" data-act="logout">${icon('logout', 'sm')} Sign out</button></div></section>${e ? `<section class="card"><h3>My employment</h3>${kv([['Manager', esc(userName(e.manager))], ['Start date', fmtDate(e.start)], ['Grade', esc(e.grade)], ['Annual leave', (e.leaveAllow - (e.leaveTaken || 0)) + ' of ' + e.leaveAllow + ' days left']])}</section>` : ''}</div>`;
  return pageHead({ title: `${esc(u.name.split(' ')[0])}${pi('user', true)}profile and settings`, sub: esc(u.title) + ' · ' + esc(u.dept) }) + tabs('profile', [{ k: 'account', l: 'Account' }, { k: 'notifications', l: 'Notification preferences' }, { k: 'security', l: 'Security and delegation' }], tab) + body;
};
function profNotify(u) {
  const np = u.nprefs || {}; const ch = [['app', 'In-app'], ['email', 'Email'], ['sms', 'SMS'], ['wa', 'WhatsApp (Phase 3)']];
  return card('Choose how you hear about things', `<table class="tbl"><thead><tr><th>Type of notification</th>${ch.map(c => `<th class="num">${c[1]}</th>`).join('')}</tr></thead><tbody>${NOTE_CATS.map(([k, l]) => `<tr><td>${esc(l)}${k === 'system' ? '<div class="small muted">Critical alerts such as SLA breaches and payment holds are always delivered.</div>' : ''}</td>${ch.map(([c]) => { const on = k === 'system' && c !== 'wa' ? true : c === 'wa' ? false : (np[k]?.[c] ?? (u.prefs?.[c] ?? (c === 'app'))); return `<td class="num"><input type="checkbox" data-act="np.toggle" data-cat="${k}" data-ch="${c}" ${on ? 'checked' : ''} ${(k === 'system' && c !== 'wa') || c === 'wa' ? 'disabled' : ''} aria-label="${esc(l)} ${c}"></td>`; }).join('')}</tr>`).join('')}</tbody></table><p class="small muted" style="margin-top:10px">Changes save as you tick them.</p>`, { ic: 'bell' });
}
ACT['np.toggle'] = el => { const u = me(); const np = JSON.parse(JSON.stringify(u.nprefs || {})); np[el.dataset.cat] = { ...(np[el.dataset.cat] || {}), [el.dataset.ch]: el.checked }; DB.set('users', u.id, { nprefs: np }, { quiet: true }); toast('Preference saved'); };
function profSecurity(u, r) {
  return `<div class="grid g2" style="align-items:start"><section class="card"><h3>Sign-in security</h3>${kv([['Two-factor sign-in', r.tfa ? spill('Required for your role', 'ok') : spill('Optional', 'mute')], ['Password last changed', u.pwChangedAt ? fmtDate(isoDate(u.pwChangedAt)) : 'Never in this prototype'], ['This session', 'This browser · ' + fmtDT(Date.now())]])}<div class="row" style="margin-top:14px"><button class="btn" data-act="pw.change">Change password</button><button class="btn danger" data-act="logout">Sign out</button></div></section><section class="card"><h3>Approval delegation</h3><p class="small muted" style="margin-bottom:8px">While you are away, someone else can approve on your behalf. Every delegated decision is logged.</p>${u.deleg?.to ? `<p>Delegated to <b>${esc(userName(u.deleg.to))}</b> until ${fmtDate(u.deleg.until)}.</p>` : ''}<button class="btn" data-act="deleg.set">${u.deleg?.to ? 'Change delegate' : 'Set delegate'}</button>${u.deleg?.to ? ` <button class="btn ghost" data-act="deleg.clear">Remove</button>` : ''}</section></div>`;
}
ACT['deleg.clear'] = () => { DB.set('users', SESS.uid, { deleg: null }); render(); };
ACT['pw.change'] = () => openForm({ title: 'Change password', fields: [{ n: 'cur', l: 'Current password', t: 'password', req: true }, { n: 'n1', l: 'New password', t: 'password', req: true, vf: v => v.length < 8 ? 'Use at least 8 characters.' : '' }, { n: 'n2', l: 'Repeat new password', t: 'password', req: true, vf: (v, all) => v !== all.n1 ? 'The two passwords do not match.' : '' }], onSubmit: () => { DB.set('users', SESS.uid, { pwChangedAt: Date.now() }, { action: 'password-change' }); toast('Password changed'); render(); } });

/* ----- password reset (public) ----- */
function resetPage() {
  const st = UI.reset || { step: 1 }; let inner;
  if (st.step === 1) inner = `<p class="muted" style="margin-bottom:14px">Enter your work email. We will send a six-digit code.</p><form id="rsform" novalidate>${formHtml([{ n: 'email', l: 'Work email', t: 'email', req: true }], {}, 'rs')}</form><div class="row" style="margin-top:16px"><button class="btn primary" data-act="rs.send">Send code</button><a class="btn" href="#/login">Back to sign in</a></div>`;
  else if (st.step === 2) inner = `<div class="alert info" style="margin-bottom:14px">${icon('mail', 'sm')}<span>A code was sent to <b>${esc(st.email)}</b>. Demo code: <b>123456</b>.</span></div><form id="rsform" novalidate>${formHtml([{ n: 'code', l: 'Six-digit code', req: true }, { n: 'n1', l: 'New password', t: 'password', req: true, vf: v => v.length < 8 ? 'Use at least 8 characters.' : '' }, { n: 'n2', l: 'Repeat new password', t: 'password', req: true, vf: (v, a) => v !== a.n1 ? 'The two passwords do not match.' : '' }], {}, 'rs')}</form><div class="row" style="margin-top:16px"><button class="btn primary" data-act="rs.set">Set new password</button></div>`;
  else inner = `<div class="alert ok">${icon('check', 'sm')}<span>Your password has been reset. You can sign in now.</span></div><p style="margin-top:16px"><a class="btn primary" href="#/login">Go to sign in</a></p>`;
  return publicShell(`<div class="card white"><h2 style="font-size:24px;letter-spacing:-.02em;margin-bottom:6px">Reset your password</h2>${inner}</div>`);
}
ACT['rs.send'] = () => { const v = readForm($('#rsform'), [{ n: 'email', l: 'Email', req: true }]); if (!v) return; const u = DB.d.users.find(x => x.email === v.email.trim().toLowerCase()); sendExternal('email', v.email, 'Your Tri-OP reset code is 123456'); UI.reset = { step: 2, email: v.email }; if (u) audit('password-reset-request', 'users', u.id, ''); render(); };
ACT['rs.set'] = () => { const v = readForm($('#rsform'), [{ n: 'code', l: 'Code', req: true }, { n: 'n1', l: 'New password', t: 'password', req: true, vf: x => x.length < 8 ? 'Use at least 8 characters.' : '' }, { n: 'n2', l: 'Repeat', t: 'password', req: true, vf: (x, a) => x !== a.n1 ? 'The two passwords do not match.' : '' }]); if (!v) return; if (v.code !== '123456') return toast('That code is not valid. Enter 123456 for the demo.', 'bad'); const u = DB.d.users.find(x => x.email === (UI.reset.email || '').toLowerCase()); if (u) { u.pwChangedAt = Date.now(); DB.dirty(); } UI.reset = { step: 3 }; render(); };

/* ----- system states (empty, loading, error, no permission, 404) ----- */
const skeleton = (rows = 4) => `<div class="stack" style="gap:10px" aria-busy="true" aria-label="Loading">${Array.from({ length: rows }, (_, i) => `<div class="skel" style="height:${i ? 46 : 64}px;width:${100 - i * 8}%"></div>`).join('')}</div>`;
function notFoundPage() { return pageHead({ title: `Page${pi('help', true)}not found` }) + card('', `<div class="empty">${icon('help')}<div style="font-size:16px;margin-bottom:6px">We could not find that page.</div><div>The link may be old, or the page may have moved. Search for what you need or go back.</div><div class="row" style="justify-content:center;margin-top:14px"><a class="btn primary" href="#/dashboard">Back to dashboard</a><a class="btn" href="#/search">Search</a></div></div>`); }
PAGES.system = () => pageHead({ title: `System${pi('shield', true)}states`, sub: 'How Tri-OP looks when there is nothing to show, something is loading, or something goes wrong' }) + `<div class="grid g3">${card('Empty', emptyState('Nothing here yet. Create the first record to get started.', 'inbox'), { ic: 'inbox' })}${card('Loading', skeleton(3), { ic: 'refresh' })}${card('Error', `<div class="alert bad">${icon('warn', 'sm')}<span><b>Something went wrong.</b> We could not load this page. Try again, or go back to the dashboard.</span></div><div class="row" style="margin-top:12px"><button class="btn" data-act="sys.retry">Try again</button></div>`, { ic: 'warn' })}${card('No permission', `<div class="empty">${icon('lock')}<div>Your role does not include this area. Ask an administrator if you need access.</div></div>`, { ic: 'lock' })}${card('Page not found (404)', `<div class="empty">${icon('help')}<div>We could not find that page.</div><a class="btn sm" style="margin-top:10px" href="#/this-page-does-not-exist">Open a missing page</a></div>`, { ic: 'help' })}${card('Offline', `<div class="alert">${icon('warn', 'sm')}<span>You are offline. Changes are kept on this device and will sync when you reconnect.</span></div>`, { ic: 'link' })}</div>`;
ACT['sys.retry'] = () => { toast('Reloaded'); render(); };
window.addEventListener('offline', () => toast('You are offline. Changes are kept on this device.', 'warn')); window.addEventListener('online', () => toast('Back online'));

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
document.addEventListener('keydown', e => { if (e.key === 'Escape' && OV.stack.length) closeOverlay(); if (e.key === 'Enter' && e.target.id === 'gsearch' && e.target.value.trim().length > 1) { go('search?q=' + encodeURIComponent(e.target.value.trim())); $('#sres')?.classList.add('hide'); } });
window.addEventListener('hashchange', () => { closeAllOverlays(); render(); });
window.addEventListener('storage', e => { if (e.key === LS_REV && SESS.uid) { DB.load(); if (ROUTE.parts[0] === 'chat' && typeof chatRefresh === 'function' && chatRefresh()) return; if (!OV.stack.length && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) render(); } });

/* ---------- boot ---------- */
function boot() {
  DB.init(); if (typeof applyRoleOverrides === 'function') applyRoleOverrides(); loadSession(); if (SESS.uid && !me()) { SESS.uid = null; }
  Jobs.run(); setInterval(() => { if (!OV.stack.length && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) Jobs.run(); }, 60000);
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
}

