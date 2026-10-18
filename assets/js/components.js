'use strict';
/* Tri-OP UI components: icons, tables, forms, overlays, charts */

const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.6 0 4.4 1.9 4.4 4.5"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-4 3.1-6.5 7-6.5s7 2.5 7 6.5"/>',
  estate: '<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-6h6v6"/><path d="M9 11.5h6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  coins: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.4c-.5-1-1.5-1.6-2.8-1.6-1.6 0-2.8.9-2.8 2.1 0 3 5.8 1.5 5.8 4.4 0 1.3-1.2 2.1-3 2.1-1.4 0-2.5-.6-3-1.7M12 6v1.8M12 16.4V18"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/><path d="M8 10h8M8 13h5"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevr: '<path d="M9 5l7 7-7 7"/>', chevd: '<path d="M5 9l7 7 7-7"/>', chevl: '<path d="M15 5l-7 7 7 7"/>',
  arrowur: '<path d="M7 17L17 7M8 7h9v9"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.7 1-5.9L3.5 9.7l5.9-.8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 14v4M8 21h8M10 18h4"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="2"/><rect x="17" y="14" width="4" height="6" rx="2"/><path d="M19 20c0 1.2-1.6 2-4 2h-2"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.500 6-3v-4.500"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7l8.500 6 8.500-6"/>',
  phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.500 6.500l4 4"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  eye: '<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="8" cy="8" r="1.200"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M20 12H9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4l-2 2M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
  pin: '<path d="M12 21s7-6.500 7-12a7 7 0 0 0-14 0c0 5.500 7 12 7 12z"/><circle cx="12" cy="9" r="2.500"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.800"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  clip: '<path d="M20 11l-8.500 8.500a5 5 0 0 1-7-7L13 4a3.500 3.500 0 0 1 5 5l-8.500 8.500a2 2 0 0 1-3-3L14 7"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.500 2.300 2 4 2s3-.5 4-2M9 9.500h.01M15 9.500h.01"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.500 6h.01M3.500 12h.01M3.500 18h.01"/>',
  kanban: '<rect x="3" y="4" width="5" height="16" rx="2"/><rect x="10" y="4" width="5" height="10" rx="2"/><rect x="17" y="4" width="4" height="13" rx="2"/>',
  gantt: '<path d="M4 6h8M8 12h10M6 18h9"/><path d="M3 3v18"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5M3 17.500l9 5 9-5" opacity=".55"/>',
  wallet: '<path d="M4 7a2 2 0 0 1 2-2h12v4"/><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="16.500" cy="13.500" r="1.200"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
  sparkle: '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 16l.8 2.200L22 19l-2.200.8L19 22l-.8-2.200L16 19l2.200-.8z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.7.400-1 .9-1 1.700M12 17h.01"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.600 0l3-3a4 4 0 0 0-5.600-5.600l-1 1M14 10a4 4 0 0 0-5.600 0l-3 3a4 4 0 0 0 5.600 5.600l1-1"/>',
  share: '<circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="6" r="2.500"/><circle cx="18" cy="18" r="2.500"/><path d="M8.200 11l7.600-3.800M8.200 13l7.600 3.800"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
  inspect: '<circle cx="10.500" cy="10.500" r="6.500"/><path d="M20 20l-4.900-4.900M8 10.500l2 2 3-3.500"/>',
  more: '<circle cx="5" cy="12" r="1.300"/><circle cx="12" cy="12" r="1.300"/><circle cx="19" cy="12" r="1.300"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  leaf: '<path d="M5 19c0-10 6-15 15-15 0 9-5 15-13 15"/><path d="M5 19c3-5 6-8 10-10"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  pie: '<path d="M12 3v9h9a9 9 0 1 1-9-9z"/><path d="M15 3.500A9 9 0 0 1 20.500 9H15z"/>',
  scale: '<path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7a3.500 3.500 0 0 0 6 0zM19 7l-3 7a3.500 3.500 0 0 0 6 0z"/>'
};
const icon = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.grid}</svg>`;
const logoSvg = (c = '#fff') => `<svg viewBox="0 0 64 64" fill="none"><rect x="6" y="6" width="52" height="52" rx="15" stroke="${c}" stroke-width="5"/><path d="M19 45c0-14 9-23 27-25-1 17-8 27-22 27-3 0-5-.8-5-2z" fill="${c}"/><path d="M20 45c6-8 12-14 21-18" stroke="#001F10" stroke-width="2.600" stroke-linecap="round"/></svg>`;
const leafBg = `<svg class="leafbg" viewBox="0 0 64 64" fill="none"><path d="M10 54C6 28 24 8 56 6c0 28-14 46-38 46" stroke="#8FEB0F" stroke-width="2" opacity=".6"/><path d="M10 54c10-16 22-28 40-40M22 46l6-10M30 38l4-8" stroke="#8FEB0F" stroke-width="1.500" opacity=".5"/></svg>`;
const pi = (ic, lime) => `<span class="pi ${lime ? 'lime' : ''}">${icon(ic)}</span>`;

const TONES = {
  ok: ['confirmed', 'paid', 'fully paid', 'won', 'accepted', 'approved', 'done', 'closed', 'resolved', 'active', 'available', 'posted', 'completed', 'documented', 'inducted', 'present', 'on track', 'issued', 'received', 'passed', 'verified', 'matched', 'granted', 'signed', 'returned', 'sent', 'on time', 'published', 'excellent', 'maverick', 'associate', 'green', 'attended', 'ready', 'live', 'valid', 'submitted'],
  warn: ['pending', 'reserved', 'awaiting second', 'in progress', 'negotiation', 'review', 'at risk', 'overdue', 'late', 'onboarding in progress', 'ready for induction', 'high', 'urgent', 'medium', 'draft', 'open', 'partial', 'amber', 'inspection', 'expiring', 'unmatched', 'due', 'doing', 'scheduled', 'planned', 'awaiting', 'in review', 'new', 'contacted', 'withheld'],
  bad: ['rejected', 'lost', 'revoked', 'breached', 'failed', 'off track', 'void', 'cancelled', 'exited', 'inactive', 'defaulted', 'red', 'critical', 'absent', 'missed', 'declined', 'expired'],
  info: ['allocated', 'low', 'info', 'todo', 'backlog', 'entry registered', 'blue', 'remote', 'field', 'office', 'on leave', 'dnd'],
  dark: ['maverick-x']
};
function tone(s) { const k = String(s || '').toLowerCase(); for (const t in TONES) if (TONES[t].includes(k)) return t; return ''; }
const spill = (s, t) => `<span class="pill ${t ?? tone(s)}">${esc(s)}</span>`;
const avatar = (name, cls = '', color) => `<span class="av ${cls}" style="background:${color || hashColor(name)}" title="${esc(name)}">${esc(initials(name))}</span>`;
function hashColor(s) { const c = ['#008C38', '#003D20', '#1F7A4C', '#2E8B57', '#0B5D3B', '#4C9A2A', '#26734D', '#157347']; let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return c[h % c.length]; }
const userChip = id => { const u = userById(id); return u ? `<span class="row" style="gap:8px">${avatar(u.name, 'sm')}<span>${esc(u.name)}</span></span>` : '<span class="muted">—</span>'; };
const opts = (list, sel, blank) => (blank != null ? `<option value="">${esc(blank)}</option>` : '') + list.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(l)}</option>`; }).join('');
const kv = rows => `<dl class="kv">${rows.filter(Boolean).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v ?? '—'}</dd>`).join('')}</dl>`;
const emptyState = (msg, ic = 'inbox') => `<div class="empty">${icon(ic)}<div>${esc(msg)}</div></div>`;
const textOf = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.trim(); };
const ACT = {}; const ACTB = {};

/* ---------- page furniture ---------- */
function pageHead({ title, sub, acts = '' }) { return `<div class="pagehead"><div style="flex:1;min-width:260px"><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div><div class="acts">${acts}</div></div>`; }
function tabs(base, items, cur) { return `<nav class="tabs" aria-label="Sections">${items.map(t => `<a href="#/${base}/${t.k}" class="${t.k === cur ? 'on' : ''}">${esc(t.l)}${t.n ? `<span class="n">${t.n}</span>` : ''}</a>`).join('')}</nav>`; }
function card(title, body, { ic, acts = '', cls = '' } = {}) { return `<section class="card ${cls}">${title ? `<div class="ch">${ic ? `<span class="ci" style="width:36px;height:36px;border-radius:12px;background:#fff;display:grid;place-items:center">${icon(ic)}</span>` : ''}<h3>${title}</h3><span class="sp"></span>${acts}</div>` : ''}${body}</section>`; }
function tile({ cls = '', ic, title, value, unit = '', pc, caps, sub, href, menu }) {
  const n = 8; const on = caps ? Math.round(Math.min(1, caps.v / (caps.max || 1)) * n) : 0;
  return `<div class="tile ${cls}">${href ? `<a class="full" href="${href}" aria-label="${esc(title)}"></a>` : ''}<div class="th"><span class="ci">${icon(ic || 'grid')}</span><span>${esc(title)}</span>${pc != null ? `<span class="pc">${pc}%${ring(pc, 18)}</span>` : ''}</div><div class="big">${value}${unit ? `<small>${unit}</small>` : ''}</div>${caps ? `<div class="caps">${Array.from({ length: n }, (_, i) => `<i class="${i < on ? '' : 'off'}"></i>`).join('')}</div>` : ''}${sub ? `<div class="small muted" style="margin-top:10px">${sub}</div>` : ''}</div>`;
}
function ring(p, s = 44, col = 'var(--forest)') { const r = (s - 6) / 2, c = 2 * Math.PI * r; return `<svg class="ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" style="transform:rotate(-90deg)"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="#D5E3D3" stroke-width="3"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c * Math.min(1, p / 100)} ${c}"/></svg>`; }
function pillBars({ labels, a, b, max, cur, ghost = [], fmt = v => v, hl }) {
  const m = max || Math.max(...a, 1) * 1.1; const ticks = 5;
  return `<div class="pbars"><div class="gl">${Array.from({ length: ticks }, (_, i) => `<div style="position:absolute;left:0;right:0;top:${i * 20}%;border-top:1px solid #DDE8DB"></div>`).join('')}</div><div class="yax">${Array.from({ length: ticks + 1 }, (_, i) => `<span>${fmt(m * (1 - i / ticks))}</span>`).join('')}</div>${labels.map((l, i) => { const h = Math.max(a[i] / m * 100, 0); const inner = b ? Math.min(100, (b[i] || 0) / (a[i] || 1) * 100) : 0; return `<div class="pb ${ghost.includes(i) ? 'ghost' : ''} ${cur === i ? 'cur' : ''}" title="${esc(l)}: ${fmt(a[i])}${b ? ' / ' + fmt(b[i]) : ''}"><div class="col"><div class="bar" style="height:${ghost.includes(i) ? 22 : Math.max(h, 8)}%"><span class="d1"></span>${b ? `<div class="in" style="height:${inner}%"></div><span class="d2"></span>` : ''}${hl === i ? `<span class="lab">${fmt(a[i])}</span>` : ''}</div></div><div class="xl">${esc(l)}</div></div>`; }).join('')}</div>`;
}
function hbars(items, fmt = v => v) { const m = Math.max(...items.map(i => i.v), 1); return `<div class="hb">${items.map(i => `<div><div class="l"><span>${esc(i.l)}</span><span>${fmt(i.v)}</span></div><div class="prog ${i.warn ? 'warn' : ''}"><i style="width:${i.v / m * 100}%"></i></div></div>`).join('')}</div>`; }
function lineChart(pts, { h = 150, fmt = v => v, color = 'var(--forest)', labels = [] } = {}) {
  if (!pts.length) return emptyState('No data yet', 'trend'); const W = 600, H = h, m = Math.max(...pts, 1), p = 14; const xs = i => p + i * (W - 2 * p) / Math.max(pts.length - 1, 1), ys = v => H - p - v / m * (H - 2 * p - 10);
  const d = pts.map((v, i) => (i ? 'L' : 'M') + xs(i).toFixed(1) + ' ' + ys(v).toFixed(1)).join(' ');
  return `<svg class="line" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((v, i) => `<circle cx="${xs(i)}" cy="${ys(v)}" r="4" fill="#fff" stroke="${color}" stroke-width="2"><title>${esc(labels[i] || '')} ${fmt(v)}</title></circle>`).join('')}</svg>${labels.length ? `<div class="row small muted" style="justify-content:space-between">${labels.map(l => `<span>${esc(l)}</span>`).join('')}</div>` : ''}`;
}
const progress = (v, max, warn) => `<div class="prog ${warn ? 'warn' : ''}"><i style="width:${Math.min(100, pct(v, max))}%"></i></div>`;

/* ---------- toasts & overlays ---------- */
function toast(msg, t = '') { const el = document.createElement('div'); el.className = 'toast ' + t; el.textContent = msg; $('#toasts').appendChild(el); setTimeout(() => el.remove(), t === 'bad' ? 5200 : 3200); }
const OV = { stack: [] };
function openOverlay({ kind, title, body, foot = '', wide, xl, live, fn, onClose, noscrim }) {
  const id = rid(); const root = document.createElement('div'); root.className = 'scrim ' + (kind === 'drawer' ? 'dr' : ''); root.dataset.ov = id;
  const entry = { id, kind, root, fn, live: live ?? (kind === 'drawer'), onClose, wide, xl };
  OV.stack.push(entry); $('#overlay').appendChild(root); paintOverlay(entry, { title, body, foot }); document.body.style.overflow = 'hidden';
  root.addEventListener('mousedown', e => { if (e.target === root && !noscrim) closeOverlay(id); });
  setTimeout(() => { const f = root.querySelector('[autofocus],input:not([type=hidden]):not([readonly]),select,textarea'); if (f && kind !== 'drawer') f.focus(); }, 30);
  return id;
}
function paintOverlay(e, c) {
  const cls = e.kind === 'drawer' ? 'drawer' + (e.wide ? ' wide' : '') : 'modal' + (e.wide ? ' wide' : '') + (e.xl ? ' xl' : '');
  const keepScroll = e.root.querySelector('.mb')?.scrollTop || 0;
  e.root.innerHTML = `<div class="${cls}" role="dialog" aria-modal="true" aria-label="${esc(c.title)}"><div class="mh"><h2>${c.title}</h2><button class="iconbtn" data-act="ov.close" aria-label="Close">${icon('x')}</button></div><div class="mb">${c.body}</div>${c.foot ? `<div class="mf">${c.foot}</div>` : ''}</div>`;
  const mb = e.root.querySelector('.mb'); if (mb) mb.scrollTop = keepScroll;
}
function openModal(o) { return openOverlay({ kind: 'modal', ...o }); }
function openDrawer(fn, o = {}) { const c = fn(); return openOverlay({ kind: 'drawer', fn, ...c, ...o }); }
function closeOverlay(id) {
  const i = id ? OV.stack.findIndex(e => e.id === id) : OV.stack.length - 1; if (i < 0) return;
  const [e] = OV.stack.splice(i, 1); e.root.remove(); if (e.onClose) e.onClose(); if (!OV.stack.length) document.body.style.overflow = '';
}
function closeAllOverlays() { while (OV.stack.length) closeOverlay(); }
function refreshOverlays() { OV.stack.forEach(e => { if (e.live && e.fn) { const c = e.fn(); if (!c) { closeOverlay(e.id); return; } paintOverlay(e, c); } }); }
function confirmDlg(msg, onYes, { title = 'Please confirm', yes = 'Confirm', danger = false } = {}) {
  const id = openModal({ title, body: `<p>${msg}</p>`, foot: `<button class="btn" data-act="ov.close">Cancel</button><button class="btn ${danger ? 'danger' : 'primary'}" id="cf-${'y'}" data-act="ov.yes">${esc(yes)}</button>` });
  OV.stack.find(e => e.id === id).yes = onYes;
}
ACT['ov.close'] = () => closeOverlay();
ACT['ov.yes'] = () => { const e = OV.stack[OV.stack.length - 1]; const f = e.yes; closeOverlay(); f && f(); };

/* ---------- forms ---------- */
const AUTOF = {}; const AUTOPRE = {};
function fieldHtml(f, vals, idp) {
  if (f.show && !f.show(vals)) return '';
  const v = vals[f.n] ?? f.v ?? ''; const id = idp + '-' + f.n; const req = f.req ? '<span class="req"> *</span>' : '';
  const ro = f.ro ? 'readonly' : ''; const ph = f.ph ? `placeholder="${esc(f.ph)}"` : '';
  const hint = f.hint ? `<div class="hint">${f.hint}</div>` : '';
  const o = typeof f.o === 'function' ? f.o(vals) : f.o;
  switch (f.t) {
    case 'sep': return `<div class="fsep">${esc(f.l)}</div>`;
    case 'html': return `<div>${typeof f.html === 'function' ? f.html(vals) : f.html}</div>`;
    case 'hidden': return `<input type="hidden" name="${f.n}" value="${esc(v)}">`;
    case 'check': return `<div class="fld chkr"><input type="checkbox" id="${id}" name="${f.n}" ${v ? 'checked' : ''} ${f.ro ? 'disabled' : ''}><label for="${id}">${esc(f.l)}</label></div>`;
    case 'textarea': return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><textarea id="${id}" name="${f.n}" ${ph} ${ro}>${esc(v)}</textarea>${hint}</div>`;
    case 'select': return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><select id="${id}" name="${f.n}" ${f.ro ? 'disabled' : ''} ${f.reform ? `data-reform="1"` : ''}>${opts(o || [], v, f.blank === false ? null : (f.blank ?? 'Select…'))}</select>${hint}</div>`;
    case 'multi': { const cur = Array.isArray(v) ? v : []; return `<div class="fld"><label>${esc(f.l)}${req}</label><div class="msel" data-multi="${f.n}">${(o || []).map(x => { const [ov, ol] = Array.isArray(x) ? x : [x, x]; return `<label><input type="checkbox" value="${esc(ov)}" ${f.reform ? 'data-reform="1"' : ''} ${cur.includes(ov) ? 'checked' : ''}>${esc(ol)}</label>`; }).join('')}</div>${hint}</div>`; }
    case 'file': return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><input type="file" id="${id}" name="${f.n}" data-file="1" ${f.accept ? `accept="${f.accept}"` : ''}>${v ? `<div class="hint">Current: ${esc(vals[f.n + '_name'] || 'uploaded file')}</div>` : ''}${hint}</div>`;
    case 'money': case 'number': return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><input id="${id}" name="${f.n}" type="number" inputmode="decimal" step="${f.step || (f.t === 'money' ? '1' : 'any')}" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} value="${esc(v)}" ${ph} ${ro}>${hint}</div>`;
    case 'date': return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><input id="${id}" name="${f.n}" type="date" value="${esc(v)}" ${f.min ? `min="${f.min}"` : ''} ${ro}>${hint}</div>`;
    case 'datetime': return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><input id="${id}" name="${f.n}" type="datetime-local" value="${esc(v)}" ${ro}>${hint}</div>`;
    case 'time': return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><input id="${id}" name="${f.n}" type="time" value="${esc(v)}" ${ro}>${hint}</div>`;
    default: return `<div class="fld"><label for="${id}">${esc(f.l)}${req}</label><input id="${id}" name="${f.n}" type="${f.t || 'text'}" value="${esc(v)}" ${ph} ${ro} ${f.t === 'password' ? 'autocomplete="new-password"' : ''}>${hint}</div>`;
  }
}
function formHtml(fields, vals = {}, idp = 'f') {
  let out = '', buf = [];
  const flush = () => { if (buf.length) { out += `<div class="fgrid">${buf.join('')}</div>`; buf = []; } };
  for (const f of fields) { const h = fieldHtml(f, vals, idp); if (!h) continue; if (f.half) buf.push(h); else { flush(); out += h; } }
  flush(); return `<div class="f">${out}</div>`;
}
function readForm(root, fields, silent) {
  const vals = {}; let ok = true; $$('.fld.bad', root).forEach(e => { e.classList.remove('bad'); $('.err', e)?.remove(); });
  for (const f of fields) {
    if (['sep', 'html'].includes(f.t)) continue;
    let v;
    if (f.t === 'multi') v = $$(`[data-multi="${f.n}"] input:checked`, root).map(i => i.value);
    else { const el = root.querySelector(`[name="${f.n}"]`); if (!el) continue; v = f.t === 'check' ? el.checked : f.t === 'file' ? (el.dataset.url || undefined) : el.value; if (f.t === 'file' && el.dataset.fname) vals[f.n + '_name'] = el.dataset.fname; if (f.t === 'number' || f.t === 'money') v = v === '' ? '' : Number(v); }
    vals[f.n] = v;
    if (f.req && !silent && (v === '' || v == null || (Array.isArray(v) && !v.length))) { ok = false; const el = root.querySelector(`[name="${f.n}"],[data-multi="${f.n}"]`); const w = el?.closest('.fld'); if (w) { w.classList.add('bad'); w.insertAdjacentHTML('beforeend', `<div class="err">${esc(f.l)} is required.</div>`); } }
    if (f.vf && !silent && ok) { const m = f.vf(v, vals); if (m) { ok = false; const w = root.querySelector(`[name="${f.n}"]`)?.closest('.fld'); if (w) { w.classList.add('bad'); w.insertAdjacentHTML('beforeend', `<div class="err">${esc(m)}</div>`); } } }
  }
  return ok ? vals : null;
}
function openForm({ title, fields, vals = {}, submit = 'Save', wide, onSubmit, draft, extra = '', cancel = true }) {
  let cur = clone(vals); const dk = draft ? 'triop.draft.' + draft : null;
  if (dk) { try { const d = JSON.parse(sessionStorage.getItem(dk) || 'null'); if (d) cur = { ...cur, ...d }; } catch (e) { } }
  const id = openModal({ title, wide, body: `<form id="ovform" novalidate>${formHtml(fields, cur, 'of')}</form>`, foot: `${extra}${cancel ? '<button class="btn" data-act="ov.close" type="button">Cancel</button>' : ''}<button class="btn primary" data-act="ov.submit">${esc(submit)}</button>`, live: false });
  const e = OV.stack.find(x => x.id === id); e.fields = fields; e.onSubmit = onSubmit; e.dk = dk; e.cur = cur;
  const form = () => e.root.querySelector('form');
  e.root.addEventListener('input', () => { if (dk) { const v = readForm(form(), fields, true); sessionStorage.setItem(dk, JSON.stringify(v)); } });
  e.root.addEventListener('change', ev => {
    if (ev.target.matches('[data-file]')) { const file = ev.target.files[0]; if (!file) return; if (file.size > 900000) { toast('File is larger than 900 KB. Choose a smaller file.', 'bad'); ev.target.value = ''; return; } const rd = new FileReader(); rd.onload = () => { ev.target.dataset.url = rd.result; ev.target.dataset.fname = file.name; }; rd.readAsDataURL(file); }
    if (ev.target.matches('select') || ev.target.matches('[type=checkbox]')) { if (ev.target.dataset.reform || fields.some(f => f.show)) { const v = readForm(form(), fields, true); const st = e.root.querySelector('.mb').scrollTop; Object.assign(e.cur, v); e.root.querySelector('form').innerHTML = formHtml(fields, e.cur, 'of'); e.root.querySelector('.mb').scrollTop = st; } }
  });
  e.root.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { ev.preventDefault(); ACT['ov.submit'](); } });
  return id;
}
ACT['ov.submit'] = () => {
  const e = OV.stack[OV.stack.length - 1]; if (!e || !e.onSubmit) return;
  const vals = readForm(e.root.querySelector('form'), e.fields); if (!vals) { toast('Check the highlighted fields.', 'warn'); return; }
  const r = e.onSubmit(vals); if (r === false) return; if (e.dk) sessionStorage.removeItem(e.dk); closeOverlay(e.id);
};
function askText(title, label, cb, { submit = 'Confirm', req = true, t = 'textarea', vals = {} } = {}) { openForm({ title, fields: [{ n: 'v', l: label, t, req }], submit, vals, onSubmit: v => cb(v.v) }); }
function autoForm(coll, id, fields, rec) {
  const key = coll + '|' + id; AUTOF[key] = fields;
  return `<div data-autosave="${key}">${formHtml(fields, rec, 'af')}<div class="saved" data-saved style="min-height:18px;margin-top:6px"></div></div>`;
}
function autosaveChange(el) {
  const box = el.closest('[data-autosave]'); if (!box) return false; const [coll, id] = box.dataset.autosave.split('|'); const fields = AUTOF[box.dataset.autosave];
  const vals = readForm(box, fields, true); const rec = DB.get(coll, id); if (!rec) return true;
  const patch = {}; for (const f of fields) if (vals[f.n] !== undefined && !['sep', 'html'].includes(f.t)) patch[f.n] = vals[f.n];
  if (AUTOPRE[coll]) AUTOPRE[coll](id, patch, rec); if (Object.keys(patch).length) DB.set(coll, id, patch); const s = $('[data-saved]', box); if (s) { s.textContent = '✓ Saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }
  return true;
}

/* ---------- tables ---------- */
const TBL = {};
function table(def) {
  const old = TBL[def.id]; const st = { q: '', sort: def.sort || null, f: {}, page: 0, sel: new Set(), ...(old ? { q: old.q, sort: old.sort, f: old.f, page: old.page, sel: old.sel } : {}) };
  TBL[def.id] = Object.assign(st, { def });
  const fl = (def.filters || []).map(f => `<label class="chip"><select data-tf="${def.id}|${f.k}" aria-label="${esc(f.l)}">${opts(f.o.map(x => Array.isArray(x) ? x : [x, x]), st.f[f.k] || '', f.l + ': all')}</select></label>`).join('');
  const views = def.id && def.views !== false ? `<label class="chip"><select data-tv="${def.id}" aria-label="Saved views">${viewOpts(def.id)}</select></label>` : '';
  const ex = def.export === false ? '' : `<span class="sp"></span>${def.tools || ''}<div style="position:relative"><button class="btn sm" data-act="t.exmenu" data-t="${def.id}">${icon('download', 'sm')} Export</button></div>`;
  return `<div class="tcard" id="t-${def.id}"><div class="ttools"><label class="chip" style="flex:1;min-width:160px;max-width:300px">${icon('search', 'sm')}<input type="search" placeholder="${esc(def.ph || 'Search')}" value="${esc(st.q)}" data-ts="${def.id}" aria-label="Search table"></label>${fl}${views}${ex}</div><div id="tb-${def.id}">${tableBody(def.id)}</div></div>`;
}
function viewOpts(id) { let v = []; try { v = JSON.parse(localStorage.getItem('triop.views.' + id) || '[]'); } catch (e) { } return `<option value="">Views</option>${v.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('')}<option value="__save">＋ Save current view…</option>${v.length ? '<option value="__clear">Remove saved views</option>' : ''}`; }
function tableRows(id) {
  const st = TBL[id], def = st.def; let rows = typeof def.rows === 'function' ? def.rows() : def.rows; const q = st.q.trim().toLowerCase();
  if (q) rows = rows.filter(r => (def.search ? def.search(r) : def.cols.map(c => c.sv ? c.sv(r) : r[c.k]).join(' ')).toString().toLowerCase().includes(q));
  for (const f of (def.filters || [])) { const v = st.f[f.k]; if (v) rows = rows.filter(r => String(f.get(r)) === v); }
  if (st.sort) { const c = def.cols.find(c => c.k === st.sort.k); if (c) rows = rows.slice().sort(by(r => { const x = c.sv ? c.sv(r) : r[c.k]; return typeof x === 'string' ? x.toLowerCase() : (x ?? 0); }, st.sort.dir)); }
  return rows;
}
function tableBody(id) {
  const st = TBL[id], def = st.def; const rows = tableRows(id); const ps = def.ps || 14; const pages = Math.max(1, Math.ceil(rows.length / ps)); if (st.page >= pages) st.page = pages - 1; const slice = rows.slice(st.page * ps, st.page * ps + ps);
  const bulk = def.bulk && def.bulk.length;
  const head = `<tr>${bulk ? `<th class="chk"><input type="checkbox" data-tall="${id}" aria-label="Select all"></th>` : ''}${def.cols.map(c => `<th class="${c.num ? 'num' : ''} ${c.sv || c.k ? 's' : ''}" ${c.k ? `data-tsort="${id}|${c.k}"` : ''}>${esc(c.l)}${st.sort && st.sort.k === c.k ? (st.sort.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}</tr>`;
  const body = slice.map(r => `<tr class="${def.onRow ? 'clk' : ''} ${st.sel.has(r.id) ? 'sel' : ''}" data-t="${id}" data-r="${esc(r.id)}">${bulk ? `<td class="chk"><input type="checkbox" data-tsel="${id}|${esc(r.id)}" ${st.sel.has(r.id) ? 'checked' : ''} aria-label="Select row"></td>` : ''}${def.cols.map(c => `<td class="${c.num ? 'num' : ''}">${c.r ? c.r(r) : esc(r[c.k] ?? '—')}</td>`).join('')}</tr>`).join('');
  const bb = bulk && st.sel.size ? `<div class="bulkbar"><span>${st.sel.size} selected</span>${def.bulk.map((b, i) => `<button class="btn sm" data-act="t.bulk" data-t="${id}" data-i="${i}">${esc(b.l)}</button>`).join('')}<button class="btn sm ghost" style="color:#fff" data-act="t.clearsel" data-t="${id}">Clear</button></div>` : '';
  return `${bb}<div class="twrap"><table class="tbl"><thead>${head}</thead><tbody>${body || `<tr><td colspan="${def.cols.length + (bulk ? 1 : 0)}">${emptyState(def.empty || 'Nothing to show yet.')}</td></tr>`}</tbody></table></div><div class="tfoot"><span>${rows.length} ${rows.length === 1 ? 'record' : 'records'}</span><span class="sp"></span>${pages > 1 ? `<button class="btn sm" data-act="t.page" data-t="${id}" data-d="-1" ${st.page === 0 ? 'disabled' : ''}>${icon('chevl', 'sm')}</button><span>Page ${st.page + 1} of ${pages}</span><button class="btn sm" data-act="t.page" data-t="${id}" data-d="1" ${st.page >= pages - 1 ? 'disabled' : ''}>${icon('chevr', 'sm')}</button>` : ''}</div>`;
}
function retable(id) { const el = $('#tb-' + id); if (el) el.innerHTML = tableBody(id); }
ACT['t.page'] = el => { TBL[el.dataset.t].page += +el.dataset.d; retable(el.dataset.t); };
ACT['t.clearsel'] = el => { TBL[el.dataset.t].sel.clear(); retable(el.dataset.t); };
ACT['t.bulk'] = el => { const st = TBL[el.dataset.t]; st.def.bulk[+el.dataset.i].f([...st.sel]); };
ACT['t.exmenu'] = el => {
  const id = el.dataset.t; openModal({ title: 'Export', body: `<p class="muted" style="margin-bottom:14px">Exports the rows matching your current search and filters.</p><div class="stack" style="gap:8px"><button class="btn" data-act="t.ex" data-t="${id}" data-f="xlsx">${icon('file', 'sm')} Excel</button><button class="btn" data-act="t.ex" data-t="${id}" data-f="csv">${icon('file', 'sm')} CSV</button><button class="btn" data-act="t.ex" data-t="${id}" data-f="pdf">${icon('file', 'sm')} PDF (print)</button></div>`, live: false });
};
ACT['t.ex'] = el => {
  const st = TBL[el.dataset.t], def = st.def; const rows = tableRows(el.dataset.t);
  const cols = def.cols.map(c => ({ l: c.l, x: r => c.x ? c.x(r) : c.sv ? c.sv(r) : c.r ? textOf(c.r(r)) : r[c.k] }));
  exportRows(def.title || def.id, cols, rows, el.dataset.f); closeOverlay();
};
function exportRows(title, cols, rows, fmt) {
  const name = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + today();
  audit('export', 'export', title, rows.length + ' rows as ' + fmt);
  if (fmt === 'csv') download(name + '.csv', toCSV(cols, rows), 'text/csv');
  else if (fmt === 'xlsx') download(name + '.xls', tableToXls(title, cols, rows), 'application/vnd.ms-excel');
  else { const th = cols.map(c => `<th>${esc(c.l)}</th>`).join(''), tr = rows.map(r => '<tr>' + cols.map(c => `<td>${esc(typeof c.x === 'function' ? c.x(r) : r[c.k])}</td>`).join('') + '</tr>').join(''); printHtml(`<div class="doc"><div class="lh"><b>${esc(title)}</b><span>${esc(company().name)} · ${fmtDate(today())}</span></div><table><tr>${th}</tr>${tr}</table><div class="foot">Exported from Tri-OP by ${esc(me().name)}</div></div>`); }
}
function printHtml(html) { $('#print-root').innerHTML = html; setTimeout(() => window.print(), 80); }
function exportBtn(title, cols, rowsFn) { const id = 'ex_' + rid(); EXP[id] = { title, cols, rowsFn }; return `<button class="btn sm" data-act="ex.menu" data-i="${id}">${icon('download', 'sm')} Export</button>`; }
const EXP = {};
ACT['ex.menu'] = el => { const id = el.dataset.i; openModal({ title: 'Export', body: `<div class="stack" style="gap:8px"><button class="btn" data-act="ex.go" data-i="${id}" data-f="xlsx">Excel</button><button class="btn" data-act="ex.go" data-i="${id}" data-f="csv">CSV</button><button class="btn" data-act="ex.go" data-i="${id}" data-f="pdf">PDF (print)</button></div>`, live: false }); };
ACT['ex.go'] = el => { const e = EXP[el.dataset.i]; exportRows(e.title, e.cols, e.rowsFn(), el.dataset.f); closeOverlay(); };

/* table input handlers (wired from app.js) */
function tableInput(e) {
  const t = e.target;
  if (t.dataset.ts) { TBL[t.dataset.ts].q = t.value; TBL[t.dataset.ts].page = 0; retable(t.dataset.ts); return true; }
  return false;
}
function tableChange(e) {
  const t = e.target;
  if (t.dataset.tf) { const [id, k] = t.dataset.tf.split('|'); TBL[id].f[k] = t.value; TBL[id].page = 0; retable(id); return true; }
  if (t.dataset.tv) {
    const id = t.dataset.tv, v = t.value; const key = 'triop.views.' + id; let list = []; try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (x) { }
    if (v === '__save') { askText('Save view', 'View name', name => { const st = TBL[id]; list.push({ name, q: st.q, f: { ...st.f }, sort: st.sort }); localStorage.setItem(key, JSON.stringify(list)); render(); toast('View saved'); }, { t: 'text', submit: 'Save view' }); t.value = ''; }
    else if (v === '__clear') { localStorage.removeItem(key); render(); }
    else if (v !== '') { const s = list[+v]; Object.assign(TBL[id], { q: s.q, f: { ...s.f }, sort: s.sort, page: 0 }); render(); }
    return true;
  }
  if (t.dataset.tall) { const id = t.dataset.tall; const rows = tableRows(id); const st = TBL[id]; if (t.checked) rows.forEach(r => st.sel.add(r.id)); else st.sel.clear(); retable(id); return true; }
  if (t.dataset.tsel) { const [id, rid2] = t.dataset.tsel.split('|'); const st = TBL[id]; t.checked ? st.sel.add(rid2) : st.sel.delete(rid2); retable(id); return true; }
  return false;
}
function tableClick(e) {
  const th = e.target.closest('[data-tsort]'); if (th) { const [id, k] = th.dataset.tsort.split('|'); const st = TBL[id]; st.sort = st.sort && st.sort.k === k ? (st.sort.dir === 1 ? { k, dir: -1 } : null) : { k, dir: 1 }; retable(id); return true; }
  const tr = e.target.closest('tr[data-t]'); if (tr && !e.target.closest('a,button,input,select,label')) { const st = TBL[tr.dataset.t]; if (st && st.def.onRow) { const row = (typeof st.def.rows === 'function' ? st.def.rows() : st.def.rows).find(r => r.id === tr.dataset.r); if (row) st.def.onRow(row); } return true; }
  return false;
}

/* ---------- calendar ---------- */
const CAL = {};
function calState(key) { if (!CAL[key]) { const d = new Date(); CAL[key] = { y: d.getFullYear(), m: d.getMonth() }; } return CAL[key]; }
ACT['cal.nav'] = el => { const s = calState(el.dataset.k); s.m += +el.dataset.d; if (s.m < 0) { s.m = 11; s.y--; } if (s.m > 11) { s.m = 0; s.y++; } render(); };
ACT['cal.today'] = el => { delete CAL[el.dataset.k]; render(); };
function calendarHtml(key, events, { onEvent } = {}) {
  const s = calState(key); const first = new Date(s.y, s.m, 1); const start = (first.getDay() + 6) % 7; const days = new Date(s.y, s.m + 1, 0).getDate(); const t = today();
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }); let cells = '';
  for (let i = 0; i < Math.ceil((start + days) / 7) * 7; i++) {
    const dn = i - start + 1; const inM = dn >= 1 && dn <= days; const d = new Date(s.y, s.m, dn); const iso = isoDate(d); const ev = events.filter(e => e.d === iso);
    cells += `<div class="d ${inM ? '' : 'o'} ${iso === t ? 't' : ''}"><div class="muted">${d.getDate()}</div>${ev.slice(0, 3).map(e => `<span class="e ${e.cls || ''}" ${e.act ? `data-act="${e.act}" data-id="${esc(e.id || '')}"` : ''} title="${esc(e.t)}">${esc(e.t)}</span>`).join('')}${ev.length > 3 ? `<span class="small muted">+${ev.length - 3} more</span>` : ''}</div>`;
  }
  return `<div class="row" style="margin-bottom:10px"><button class="btn sm" data-act="cal.nav" data-k="${key}" data-d="-1" aria-label="Previous month">${icon('chevl', 'sm')}</button><b style="font-weight:500;min-width:140px;text-align:center">${label}</b><button class="btn sm" data-act="cal.nav" data-k="${key}" data-d="1" aria-label="Next month">${icon('chevr', 'sm')}</button><button class="btn sm" data-act="cal.today" data-k="${key}">Today</button></div><div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(x => `<div class="h">${x}</div>`).join('')}${cells}</div>`;
}
