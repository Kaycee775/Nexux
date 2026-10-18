'use strict';
/* Tri-OP core: utilities, data store, session, roles & permissions, audit, notifications */

const LS_DB = 'triop.db.v1', LS_REV = 'triop.rev.v1', LS_SESS = 'triop.sess.v1', LS_UI = 'triop.ui.v1';

/* ---------- utilities ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => (n < 0 ? '-' : '') + '₦' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-NG');
const moneyShort = n => { n = Number(n) || 0; const a = Math.abs(n); const s = a >= 1e9 ? (a / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (a / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (a / 1e3).toFixed(0) + 'K' : String(Math.round(a)); return (n < 0 ? '-' : '') + '₦' + s; };
const num = n => (Number(n) || 0).toLocaleString('en-NG');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const isoDate = d => { d = d instanceof Date ? d : new Date(d); const o = d.getTimezoneOffset() * 60000; return new Date(d - o).toISOString().slice(0, 10); };
const today = () => isoDate(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return isoDate(x); };
const addMonths = (d, n) => { const x = new Date(d); const day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + n); const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(day, last)); return isoDate(x); };
const daysBetween = (a, b) => Math.round((new Date(isoDate(b)) - new Date(isoDate(a))) / 864e5);
const fmtDate = d => d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = t => t ? new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDT = t => t ? fmtDate(isoDate(t)) + ', ' + fmtTime(t) : '—';
const ago = t => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + 'm ago'; const h = Math.round(m / 60); if (h < 24) return h + 'h ago'; return Math.round(h / 24) + 'd ago'; };
const monthKey = d => String(d).slice(0, 7);
const monthLabel = k => new Date(k + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const sum = (a, f = x => x) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const uniq = a => Array.from(new Set(a));
const by = (f, dir = 1) => (a, b) => { const x = f(a), y = f(b); return (x > y ? 1 : x < y ? -1 : 0) * dir; };
const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const cap = s => String(s || '').replace(/(^|[\s_-])\w/g, m => m.toUpperCase()).replace(/_/g, ' ');
const rid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const clone = o => JSON.parse(JSON.stringify(o));
const phoneNorm = p => String(p || '').replace(/^p:/i, '').replace(/[^\d]/g, '').replace(/^234/, '0').replace(/^(?!0)/, '0');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function fiscalYear(d = today()) { const y = +d.slice(0, 4), m = +d.slice(5, 7); const s = m >= 7 ? y : y - 1; return { start: s + '-07-01', end: (s + 1) + '-06-30', label: 'FY' + s + '/' + String(s + 1).slice(2) }; }

function csvEscape(v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function toCSV(cols, rows) { return [cols.map(c => csvEscape(c.l)).join(',')].concat(rows.map(r => cols.map(c => csvEscape(typeof c.x === 'function' ? c.x(r) : r[c.k])).join(','))).join('\n'); }
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const clean = rows.filter(r => r.some(x => String(x).trim() !== ''));
  if (!clean.length) return [];
  const head = clean[0].map(h => h.trim());
  return clean.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}
function download(name, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function tableToXls(title, cols, rows) {
  const th = cols.map(c => `<th>${esc(c.l)}</th>`).join('');
  const tr = rows.map(r => '<tr>' + cols.map(c => `<td>${esc(typeof c.x === 'function' ? c.x(r) : r[c.k])}</td>`).join('') + '</tr>').join('');
  return `<html><head><meta charset="utf-8"></head><body><table border="1"><caption>${esc(title)}</caption><tr>${th}</tr>${tr}</table></body></html>`;
}

/* ---------- data store ---------- */
const GLOBAL = new Set(['companies', 'users', 'roles']);
let CO = 'tre';
const DB = {
  d: null, rev: 0, timer: null,
  load() { try { const raw = localStorage.getItem(LS_DB); if (!raw) return false; this.d = JSON.parse(raw); this.rev = +localStorage.getItem(LS_REV) || 0; return true; } catch (e) { return false; } },
  init() { if (!this.load()) { this.d = Seed.build(); this.flush(); } },
  reset() { this.d = Seed.build(); this.flush(); },
  flush() { clearTimeout(this.timer); this.timer = null; try { this.rev = (+localStorage.getItem(LS_REV) || this.rev) + 1; localStorage.setItem(LS_DB, JSON.stringify(this.d)); localStorage.setItem(LS_REV, String(this.rev)); } catch (e) { console.warn('Storage write failed', e); if (typeof toast === 'function') toast('Browser storage is full. Export your data from Admin → Data administration.', 'bad'); } },
  dirty() { if (!this.timer) this.timer = setTimeout(() => this.flush(), 40); },
  sync() { const r = +localStorage.getItem(LS_REV) || 0; if (r > this.rev) this.load(); },
  q(c) { const a = this.d[c] || []; return GLOBAL.has(c) ? a.filter(r => !r.del) : a.filter(r => !r.del && r.co === CO); },
  all(c) { return this.d[c] || []; },
  get(c, id) { return (this.d[c] || []).find(r => r.id === id); },
  add(c, o, opt = {}) {
    this.sync();
    const r = Object.assign({ co: CO, cby: SESS.uid }, o);
    r.created = r.created || Date.now(); r.co = r.co || CO;
    if (!r.id) r.id = c.slice(0, 3) + '_' + rid();
    (this.d[c] = this.d[c] || []).push(r);
    if (!opt.quiet) audit('create', c, r.id, o.name || o.title || o.no || '');
    this.dirty(); return r;
  },
  set(c, id, patch, opt = {}) {
    this.sync();
    const r = this.get(c, id); if (!r) return null;
    const ch = [];
    for (const k in patch) { if (JSON.stringify(r[k]) !== JSON.stringify(patch[k])) { if (!['log', 'history', 'comments', 'schedule'].includes(k)) ch.push(k + ': ' + short(r[k]) + ' → ' + short(patch[k])); } }
    Object.assign(r, patch, { upd: Date.now() });
    if (!opt.quiet && ch.length) audit(opt.action || 'update', c, id, ch.join('; ').slice(0, 300));
    this.dirty(); return r;
  },
  del(c, id) { const r = this.get(c, id); if (!r) return; this.sync(); r.del = true; r.delAt = Date.now(); r.delBy = SESS.uid; audit('delete', c, id, r.name || r.title || r.no || ''); this.dirty(); },
  restore(c, id) { const r = this.get(c, id); if (!r) return; this.sync(); delete r.del; audit('restore', c, id, r.name || r.title || ''); this.dirty(); },
  purge(c, id) { this.sync(); this.d[c] = this.d[c].filter(r => r.id !== id); audit('purge', c, id, ''); this.dirty(); },
  seq(name, co = CO) {
    this.sync(); this.d.seq = this.d.seq || {}; const k = co + ':' + name; this.d.seq[k] = (this.d.seq[k] || 0) + 1; this.dirty(); return this.d.seq[k];
  },
  peekSeq(name, co = CO) { return ((this.d.seq || {})[co + ':' + name] || 0) + 1; },
  setting(k) { const s = (this.d.settings || {})[CO] || {}; return s[k] ?? (DEFAULT_SETTINGS[k]); },
  setSetting(k, v) { this.d.settings[CO] = this.d.settings[CO] || {}; this.d.settings[CO][k] = v; audit('setting', 'settings', k, short(v)); this.dirty(); }
};
['beforeunload', 'pagehide', 'visibilitychange'].forEach(ev => window.addEventListener(ev, () => { if (DB.timer && DB.d) DB.flush(); }));
const short = v => { const s = typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''); return s.length > 40 ? s.slice(0, 40) + '…' : s; };
const DEFAULT_SETTINGS = {
  reservationDays: 7, secondApprovalAmount: 5000000, lateTime: '08:30', closeTime: '17:30', staleLeadHours: 48, realtorStallDays: 14, protectionDays: 30,
  slaHours: { Urgent: 4, High: 24, Medium: 48, Low: 96 }, commissionRates: { Associate: 5, Maverick: 7, Referral: 3 }, followupHours: 48,
  officeIp: '41.58.0.0/16', retentionDays: 365, vatRate: 7.5, whtRate: 5
};

function audit(action, entity, ref, detail) {
  if (DB.quiet) return;
  const u = (typeof me === 'function' && SESS.uid) ? me() : null;
  DB.d.audit.push({ id: 'aud_' + rid(), ts: Date.now(), user: SESS.uid || 'system', name: u ? u.name : 'System', co: CO, action, entity, ref, detail: detail || '' });
  DB.dirty();
}

/* ---------- session, roles, permissions ---------- */
const SESS = { uid: null, co: null, tfa: false };
function loadSession() { try { Object.assign(SESS, JSON.parse(localStorage.getItem(LS_SESS) || '{}')); } catch (e) { } if (SESS.co) CO = SESS.co; }
function saveSession() { localStorage.setItem(LS_SESS, JSON.stringify(SESS)); }
const me = () => DB.get('users', SESS.uid);
const userById = id => DB.get('users', id);
const userName = id => { const u = userById(id); return u ? u.name : (id === 'system' ? 'System' : (id || '—')); };
const company = () => DB.get('companies', CO);

const ROLES = {
  superadmin: { label: 'Super Admin', scope: 'All companies', tfa: true, mods: ['dashboard', 'admin', 'chat', 'learning', 'mywork', 'hr:self'], perms: ['admin.users', 'admin.config', 'data.admin', 'audit.view', 'integrations', 'export'], note: 'Configuration, users, roles, integrations, backups. No business approvals.' },
  groupexec: { label: 'Group Executive', scope: 'All companies', tfa: true, mods: 'all', perms: ['read.all', 'approve.any', 'audit.view', 'chat.announce', 'period.reopen', 'multi.co', 'task.manage', 'perf.manage', 'learn.manage', 'hr.sensitive', 'export', 'rpt.review', 'fin.confirm2'], note: 'Read everything; approve high-value items; executive dashboards.' },
  companyexec: { label: 'Company Executive', scope: 'One company', tfa: true, mods: 'all', perms: ['read.all', 'approve.any', 'audit.view', 'chat.announce', 'period.reopen', 'task.manage', 'perf.manage', 'learn.manage', 'hr.sensitive', 'export', 'rpt.review', 'fin.confirm2'], note: 'Read everything in the company; final approvals.' },
  hod: { label: 'Head of Department', scope: 'Own department', mods: ['dashboard', 'mywork', 'work', 'reports', 'performance', 'chat', 'learning', 'hr:self', 'hr:team'], perms: ['approve.team', 'task.manage', 'rpt.review', 'perf.manage', 'export'], note: 'Department dashboard; approve the team’s requests; review reports.' },
  finance: { label: 'Finance Officer', scope: 'Finance records', tfa: true, mods: ['dashboard', 'mywork', 'finance', 'accounting', 'crm:read', 'inventory:read', 'work', 'reports', 'chat', 'learning', 'hr:self'], perms: ['fin.confirm', 'fin.invoice', 'fin.expense.post', 'acc.journal', 'acc.close', 'fin.commission.pay', 'export'], note: 'Raise invoices, confirm payments, issue receipts, post expenses.' },
  hr: { label: 'HR Officer', scope: 'HR records', tfa: true, mods: ['dashboard', 'mywork', 'hr', 'work', 'reports', 'performance', 'chat', 'learning'], perms: ['hr.write', 'hr.sensitive', 'announce.post', 'approve.hr', 'export', 'perf.manage', 'learn.manage', 'rpt.review'], note: 'Staff records, leave, onboarding, documents, exit log.' },
  staff: { label: 'Staff', scope: 'Own records and assigned work', mods: ['dashboard', 'mywork', 'work', 'reports', 'chat', 'learning', 'hr:self', 'performance:self'], perms: [], note: 'Personal dashboard, tasks, requests, report submission.' },
  auditor: { label: 'Auditor (read-only)', scope: 'Granted scope, time-limited', mods: 'all', perms: ['read.all', 'audit.view', 'export'], readonly: true, note: 'Read records and audit log; export.' }
};
const DEPT_MODS = {
  'Sales': ['crm', 'inventory', 'realtors:read'], 'Marketing': ['crm:read', 'realtors:camp'], 'Operations': ['inventory', 'cx', 'crm:read', 'realtors:read'],
  'Finance': ['finance', 'accounting'], 'HR': ['hr'], 'Realtors Development': ['realtors', 'crm:read'], 'Customer Experience': ['cx', 'crm', 'inventory:read'], 'Management': []
};
const DEPT_PERMS = {
  'Sales': ['crm.write', 'inv.reserve'], 'Operations': ['inv.write', 'inv.docs', 'cx.write', 'crm.write', 'inv.reserve'], 'Customer Experience': ['cx.write', 'crm.write'],
  'Realtors Development': ['rlt.write', 'rlt.campaign'], 'Marketing': ['rlt.campaign']
};
function userPerms(u) { u = u || me(); if (!u) return []; const r = ROLES[u.role] || ROLES.staff; return uniq([...(r.perms || []), ...(r.readonly ? [] : (DEPT_PERMS[u.dept] || [])), ...(u.flags || [])]); }
const can = p => { const u = me(); return !!u && userPerms(u).includes(p); };
const canAny = (...p) => p.some(can);
/* module access: returns 'write' | 'read' | 'self' | false */
function modAccess(m) {
  const u = me(); if (!u) return false; const r = ROLES[u.role]; const list = r.mods === 'all' ? null : [...r.mods, ...(DEPT_MODS[u.dept] || [])];
  if (r.mods === 'all') return r.readonly || ['groupexec', 'companyexec'].includes(u.role) ? 'read' : 'write';
  const hit = list.filter(x => x === m || x.startsWith(m + ':'));
  if (!hit.length) return false;
  if (hit.includes(m)) return 'write';
  if (hit.some(x => x === m + ':read')) return 'read';
  return 'self';
}
const readOnlyUser = () => !!(ROLES[me()?.role]?.readonly);
const isExec = () => ['groupexec', 'companyexec'].includes(me()?.role);

/* ---------- notifications & outbox ---------- */
const NOTE_CATS = [['approvals', 'Approvals and requests'], ['tasks', 'Tasks and projects'], ['chat', 'Chat mentions and messages'], ['finance', 'Finance and collections'], ['people', 'HR, leave and attendance'], ['learning', 'Learning and training'], ['system', 'System and critical alerts']];
function noteCat(link = '') { const l = String(link); return /approvals/.test(l) ? 'approvals' : /#\/work|mywork/.test(l) ? 'tasks' : /#\/chat/.test(l) ? 'chat' : /#\/(finance|accounting|crm\/sales)/.test(l) ? 'finance' : /#\/(hr|reports|performance)/.test(l) ? 'people' : /#\/learning/.test(l) ? 'learning' : 'system'; }
function notify(userId, title, body = '', link = '', critical = false) {
  if (!userId) return;
  const u = userById(userId); const cat = critical ? 'system' : noteCat(link); const np = ((u && u.nprefs) || {})[cat] || {}; const pref = (u && u.prefs) || { email: true, sms: false, app: true };
  const app = critical || (np.app ?? pref.app ?? true), email = critical || (np.email ?? pref.email ?? true), sms = critical || (np.sms ?? pref.sms ?? false);
  if (app) DB.add('notifications', { user: userId, title, body, link, read: false, critical, cat, ts: Date.now() }, { quiet: true });
  if (email) DB.add('outbox', { channel: 'email', to: u ? u.email : userId, text: title + (body ? ' — ' + body : ''), ts: Date.now() }, { quiet: true });
  if (sms) DB.add('outbox', { channel: 'sms', to: u ? (u.phone || '') : '', text: title, ts: Date.now() }, { quiet: true });
}
function notifyRole(role, title, body, link, critical) { DB.d.users.filter(u => u.role === role && u.co.includes(CO)).forEach(u => notify(u.id, title, body, link, critical)); }
const unreadCount = () => DB.q('notifications').filter(n => n.user === SESS.uid && !n.read).length;
function sendExternal(channel, to, text) { DB.add('outbox', { channel, to, text, ts: Date.now() }, { quiet: true }); }
