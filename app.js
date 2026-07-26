/* ══════════════════════════════════════════════════════════════════
   ТООЦОО — бар/пабд юу авснаа тоолох. Vanilla JS, backend байхгүй.
   Бүх дата зөвхөн таны төхөөрөмж дээр (localStorage). Нэвтрэх байхгүй.

   Дизайны шийдвэрүүд:
   • Нэг товшилт = нэг бүртгэл. Хэзээ ч "хэд?" гэж асуухгүй.
   • Бүртгэл бүр цаг хугацаатай хадгалагдана → бар хуурах боломжгүй.
   • Хассан үнэ нь бүртгэсэн үеийн үнэ (дараа цэс өөрчилсөн ч түүх бузарлагдахгүй).
   • Устгах үйлдэл бүр давхар хамгаалалттай (удаан дарж баталгаажуулах).
   ══════════════════════════════════════════════════════════════════ */
'use strict';

const KEY = 'tooluur.v1';
const APP_VER = '1.0.0';

/* ─────────────────────────── utils ─────────────────────────── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clone = o => JSON.parse(JSON.stringify(o));

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const nf = n => {
  const v = Math.round(Number(n) || 0);
  return (v < 0 ? '-' : '') + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const money = n => nf(n) + '₮';
const pad2 = n => String(n).padStart(2, '0');
const timeStr = ts => { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const dateStr = ts => { const d = new Date(ts); return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()); };
const sum = arr => arr.reduce((a, i) => a + (Number(i.price) || 0), 0);
const digits = s => String(s).replace(/[^\d]/g, '');

const PALETTE = ['#ffb020', '#f5d90a', '#8ab4ff', '#ff7ab8', '#c084fc',
                 '#ff6b6b', '#34d399', '#22d3ee', '#a3e635', '#fb923c'];
const EMOJIS = ['🍺','🍻','🥃','🍸','🍹','🍷','🍾','🥂','🧉','🥤','🧃','💧',
                '☕','🍟','🍕','🍗','🌭','🍜','🥗','🧊','🚬','🎤','🎱','🎲'];

/* Үндсэн цэс — үнэ нь Улаанбаатарын дундаж таамаг, тохиргоонд солино. */
const DEFAULT_MENU = [
  { id: 'draft',   emoji: '🍺', name: 'Драфт пиво',  price: 12000, color: PALETTE[0] },
  { id: 'bottle',  emoji: '🍻', name: 'Шилэн пиво',  price: 10000, color: PALETTE[1] },
  { id: 'shot',    emoji: '🥃', name: 'Архи 50мл',   price:  8000, color: PALETTE[2] },
  { id: 'cocktail',emoji: '🍹', name: 'Коктейл',     price: 18000, color: PALETTE[3] },
  { id: 'wine',    emoji: '🍷', name: 'Вино',        price: 15000, color: PALETTE[4] },
  { id: 'whisky',  emoji: '🥂', name: 'Виски',       price: 20000, color: PALETTE[5] },
  { id: 'soft',    emoji: '🥤', name: 'Ундаа',       price:  5000, color: PALETTE[6] },
  { id: 'water',   emoji: '💧', name: 'Ус',          price:  3000, color: PALETTE[7] },
  { id: 'snack',   emoji: '🍟', name: 'Зууш',        price: 15000, color: PALETTE[8] }
];

/* ─────────────────────────── state ─────────────────────────── */
function blankSession() {
  return { id: uid(), startedAt: Date.now(), place: '', items: [], claimed: 0, splitShared: true };
}
function fresh() {
  return {
    v: 1, menu: clone(DEFAULT_MENU), people: [], activePerson: null,
    session: blankSession(), archive: [],
    settings: { theme: 'dark', haptics: true, hintDone: false }
  };
}
function normalize(s) {
  const d = fresh();
  if (!s || typeof s !== 'object') return d;
  s.v = 1;
  s.menu = Array.isArray(s.menu) && s.menu.length ? s.menu : d.menu;
  s.menu.forEach((m, i) => {
    if (!m.id) m.id = uid();
    m.price = Number(m.price) || 0;
    if (!m.color) m.color = PALETTE[i % PALETTE.length];
    if (!m.emoji) m.emoji = '🍺';
    if (!m.name) m.name = 'Юм';
  });
  s.people = Array.isArray(s.people) ? s.people.filter(p => p && p.id && p.name) : [];
  s.archive = Array.isArray(s.archive) ? s.archive : [];
  s.settings = Object.assign(d.settings, s.settings || {});
  if (!s.session || !Array.isArray(s.session.items)) s.session = d.session;
  if (!s.session.id) s.session.id = uid();
  if (!s.session.startedAt) s.session.startedAt = Date.now();
  if (typeof s.session.place !== 'string') s.session.place = '';
  if (typeof s.session.claimed !== 'number') s.session.claimed = 0;
  if (typeof s.session.splitShared !== 'boolean') s.session.splitShared = true;
  s.session.items = s.session.items.filter(i => i && i.id).map(i => ({
    id: i.id, ts: Number(i.ts) || Date.now(), drinkId: i.drinkId || '',
    name: i.name || 'Юм', emoji: i.emoji || '🍺', price: Number(i.price) || 0,
    color: i.color || PALETTE[0],
    personId: i.personId || null, personName: i.personName || null
  }));
  if (s.activePerson && !s.people.some(p => p.id === s.activePerson)) s.activePerson = null;
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : fresh();
  } catch (e) { return fresh(); }
}
let S = load();
let saveWarned = false;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) {
    if (!saveWarned) { saveWarned = true; toast('⚠️ Хадгалж чадсангүй. Багтаамж дүүрсэн байж магадгүй.'); }
  }
}

/* ─────────────────────── derived values ─────────────────────── */
const items = () => S.session.items;
const total = () => sum(items());
const countOf = id => items().reduce((a, i) => a + (i.drinkId === id ? 1 : 0), 0);
const countFor = pid => items().reduce((a, i) => a + ((i.personId || null) === pid ? 1 : 0), 0);
const personById = id => S.people.find(p => p.id === id) || null;

/* ───────────────────────── feedback ───────────────────────── */
function haptic(ms) {
  if (!S.settings.haptics || !navigator.vibrate) return;
  try { navigator.vibrate(ms); } catch (e) {}
}
let toastT = null, toastAction = null;
function toast(text, actionLabel, cb) {
  const el = $('#toast');
  toastAction = cb || null;
  el.innerHTML = '<span class="toast__t">' + esc(text) + '</span>' +
    (actionLabel ? '<button class="toast__a" data-act="toastAction">' + esc(actionLabel) + '</button>' : '');
  el.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(hideToast, actionLabel ? 5200 : 1700);
}
function hideToast() { $('#toast').classList.remove('is-on'); toastAction = null; }

/* ───────────────────────── actions ───────────────────────── */
function addDrink(drinkId) {
  const d = S.menu.find(m => m.id === drinkId);
  if (!d) return;
  const p = personById(S.activePerson);
  items().push({
    id: uid(), ts: Date.now(), drinkId: d.id, name: d.name, emoji: d.emoji,
    price: Number(d.price) || 0, color: d.color,
    personId: p ? p.id : null, personName: p ? p.name : null
  });
  save(); haptic(14);
  toast(d.emoji + ' ' + d.name + ' +1' + (p ? ' · ' + p.name : ''));
  paint(drinkId);
}
function removeItem(id, silent) {
  const idx = items().findIndex(i => i.id === id);
  if (idx < 0) return;
  const it = items().splice(idx, 1)[0];
  save(); haptic(24);
  if (!silent) {
    toast(it.emoji + ' ' + it.name + ' хасагдлаа', 'Буцаах', () => {
      const at = Math.min(idx, items().length);
      items().splice(at, 0, it); save(); haptic(14); refresh();
    });
  }
  refresh();
  return it;
}
function removeLastOf(drinkId) {
  for (let i = items().length - 1; i >= 0; i--) if (items()[i].drinkId === drinkId) return removeItem(items()[i].id);
  return null;
}
function undoLast() {
  if (!items().length) { toast('Буцаах юм байхгүй'); return; }
  removeItem(items()[items().length - 1].id);
}
function endSession(keepPlace) {
  const s = S.session;
  if (s.items.length) {
    S.archive.unshift({
      id: s.id, startedAt: s.startedAt, endedAt: Date.now(), place: s.place,
      claimed: s.claimed, splitShared: s.splitShared,
      items: s.items, people: clone(S.people)
    });
    if (S.archive.length > 60) S.archive.length = 60;
  }
  S.session = blankSession();
  if (keepPlace) S.session.place = s.place;
  save(); refresh();
}

/* ───────────────────── view switching ───────────────────── */
let view = 'count';
function setView(v) {
  view = v;
  $$('.view').forEach(el => { el.hidden = el.dataset.view !== v; });
  $$('.tab').forEach(el => {
    const on = el.dataset.tab === v;
    el.classList.toggle('is-on', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  $('#totalbar').hidden = (v === 'menu');
  $('#views').scrollTop = 0;
  window.scrollTo(0, 0);
  refresh();
}

/* ───────────────────────── render ───────────────────────── */
function refresh() {
  renderAppbar();
  renderTotalbar();
  if (view === 'count') renderCount();
  else if (view === 'log') renderLog();
  else if (view === 'split') renderSplit();
  else renderMenu();
}

function renderAppbar() {
  const el = $('#placeName');
  el.textContent = S.session.place || 'Газар нэмэх';
  el.classList.toggle('is-empty', !S.session.place);
  const st = S.session.startedAt;
  const mins = Math.max(0, Math.floor((Date.now() - st) / 60000));
  const h = Math.floor(mins / 60), m = mins % 60;
  $('#sessMeta').innerHTML = timeStr(st) + '-с хойш<br>' + (h ? h + 'ц ' : '') + m + 'м';
}

function renderTotalbar() {
  const n = items().length;
  $('#tbCount').textContent = n;
  $('#tbSum').textContent = money(total());
  $('#undoBtn').disabled = n === 0;
  const b = $('#tabLogBadge');
  b.hidden = n === 0; b.textContent = n;
}

/* ── Тоолох ── */
let gridSig = '';
function renderCount() {
  renderWho();
  const sig = S.menu.map(m => [m.id, m.emoji, m.name, m.price, m.color].join('')).join('');
  if (sig !== gridSig) { gridSig = sig; buildGrid(); }
  syncGrid();
  $('#hint').hidden = !!S.settings.hintDone || items().length > 0;
}
function buildGrid() {
  $('#grid').innerHTML = S.menu.map(m =>
    '<div class="tile" data-id="' + esc(m.id) + '" style="--c:' + esc(m.color) + '">' +
      '<button class="tile__add" data-act="add" data-long="drink" data-id="' + esc(m.id) + '" ' +
              'aria-label="' + esc(m.name) + ' нэмэх">' +
        '<span class="tile__emoji" aria-hidden="true">' + esc(m.emoji) + '</span>' +
        '<span class="tile__txt">' +
          '<span class="tile__name">' + esc(m.name) + '</span>' +
          '<span class="tile__price">' + money(m.price) + '</span>' +
        '</span>' +
      '</button>' +
      '<span class="tile__count" aria-hidden="true">0</span>' +
      '<button class="tile__minus" data-act="dec" data-id="' + esc(m.id) + '" ' +
              'aria-label="' + esc(m.name) + ' хасах">−</button>' +
    '</div>'
  ).join('');
}
function syncGrid() {
  $$('#grid .tile').forEach(t => {
    const n = countOf(t.dataset.id);
    t.classList.toggle('has', n > 0);
    const c = $('.tile__count', t);
    if (c.textContent !== String(n)) c.textContent = n;
  });
}
function paint(drinkId) {
  syncGrid(); syncWho(); renderTotalbar();
  const t = $('#grid .tile[data-id="' + CSS.escape(drinkId) + '"]');
  if (!t) return;
  t.classList.remove('pop');
  void t.offsetWidth;
  t.classList.add('pop');
}
/* Chip-ийн тоог DOM-оо дахин барихгүйгээр шинэчилдэг болгосон —
   ингэснээр товших болгонд хэвтээ scroll нь буцаж үсэрдэггүй. */
const pidOf = c => c.dataset.pid === '-' ? null : c.dataset.pid;
function renderWho() {
  const cur = S.activePerson || null;
  const chip = (id, label) =>
    '<button class="chip' + (cur === id ? ' is-on' : '') + '" data-act="who" ' +
    'data-id="' + esc(id || '') + '" data-pid="' + esc(id || '-') + '">' + label +
    '<span class="chip__n">' + (countFor(id) || '') + '</span></button>';
  $('#who').innerHTML =
    chip(null, '🍻 Хамт') +
    S.people.map(p => chip(p.id, esc(p.name))).join('') +
    '<button class="chip chip--add" data-act="addPerson">＋ Хүн</button>';
}
function syncWho() {
  $$('#who .chip[data-pid]').forEach(c => {
    const s = $('.chip__n', c);
    const n = String(countFor(pidOf(c)) || '');
    if (s && s.textContent !== n) s.textContent = n;
  });
}

/* ── Лог ── */
function renderLog() {
  const its = items();
  if (!its.length) {
    $('#logWrap').innerHTML = emptyBox('🧾', 'Бүртгэл хоосон.<br>«Тоолох» таб дээр юм нэмэхэд<br>цаг хугацаатайгаа энд бичигдэнэ.');
    return;
  }
  const rows = its.slice().reverse().map((i, k) =>
    '<div class="row">' +
      '<span class="emoji-lg" aria-hidden="true">' + esc(i.emoji) + '</span>' +
      '<div class="row__main">' +
        '<div class="row__t">' + esc(i.name) + '</div>' +
        '<div class="row__s">' + timeStr(i.ts) + ' · #' + (its.length - k) +
          (i.personId ? ' · ' + esc((personById(i.personId) || {}).name || i.personName || '') : '') +
        '</div>' +
      '</div>' +
      '<span class="row__v">' + money(i.price) + '</span>' +
      '<button class="row__x" data-act="delItem" data-id="' + esc(i.id) + '" aria-label="Устгах">✕</button>' +
    '</div>'
  ).join('');
  $('#logWrap').innerHTML =
    '<p class="sub">Хамгийн шинэ нь дээрээ. Энэ бүртгэл нь цаг хугацаатай учраас барын тооцоотой тулгахад хүчинтэй.</p>' +
    '<div class="card">' + rows + '</div>' +
    '<button class="btn btn--ghost" data-act="shareDetail"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 15v4h14v-4"/></svg>Цагийн бүртгэлийг хуулах</button>';
}
function emptyBox(e, html) {
  return '<div class="empty"><span class="empty__e">' + e + '</span><p>' + html + '</p></div>';
}

/* ── Хуваах ── */
function splitData() {
  const per = S.people.map(p => ({ id: p.id, name: p.name, n: 0, sum: 0 }));
  let sharedN = 0, sharedSum = 0;
  items().forEach(i => {
    const p = i.personId ? per.find(x => x.id === i.personId) : null;
    if (p) { p.n++; p.sum += Number(i.price) || 0; }
    else { sharedN++; sharedSum += Number(i.price) || 0; }
  });
  const heads = per.length;
  const share = (S.session.splitShared && heads) ? sharedSum / heads : 0;
  return { per, sharedN, sharedSum, share, heads, total: total() };
}
function renderSplit() {
  const d = splitData();
  if (!items().length) {
    $('#splitWrap').innerHTML = emptyBox('🧮', 'Тооцоо хоосон байна.<br>Эхлээд юм нэмээрэй.');
    return;
  }
  let h = '<div class="big"><div class="big__l">Бидний тоолсон</div>' +
          '<div class="big__v">' + money(d.total) + '</div>' +
          '<div class="big__s">' + items().length + ' юм · ' + timeStr(S.session.startedAt) + '–' +
          timeStr(items()[items().length - 1].ts) + '</div></div>';

  h += '<div class="card"><div class="card__h">Барын тооцоотой тулгах</div><div class="card__b">' +
       '<div class="field"><label class="field__l" for="claimed">Тэдний бичсэн дүн</label>' +
       '<input class="inp inp--num" id="claimed" inputmode="numeric" autocomplete="off" ' +
       'placeholder="0" value="' + (S.session.claimed ? nf(S.session.claimed) : '') + '"></div>' +
       '<div id="diffBox">' + diffHtml() + '</div></div></div>';

  if (d.heads) {
    h += '<div class="card"><div class="card__h">Хүн тус бүр</div>';
    h += d.per.map(p =>
      '<div class="row"><div class="row__main"><div class="row__t">' + esc(p.name) + '</div>' +
      '<div class="row__s">' + p.n + ' юм' + (d.share ? ' + хамтын ' + money(d.share) : '') + '</div></div>' +
      '<span class="row__v">' + money(p.sum + d.share) + '</span></div>'
    ).join('');
    if (d.sharedN) {
      h += '<div class="row"><div class="row__main"><div class="row__t">🍻 Хамтын</div>' +
           '<div class="row__s">' + d.sharedN + ' юм' +
           (S.session.splitShared ? ' · ' + d.heads + ' хүнд тэнцүү хуваасан' : ' · хуваагаагүй') +
           '</div></div><span class="row__v">' + money(d.sharedSum) + '</span></div>';
      h += '<div class="switch' + (S.session.splitShared ? ' is-on' : '') + '" data-act="toggleSplit">' +
           '<div class="switch__main"><div class="row__t">Хамтын юмыг тэнцүү хуваах</div>' +
           '<div class="row__s">' + d.heads + ' хүнд ' + money(d.sharedSum / d.heads) + ' тус бүр</div></div>' +
           '<span class="switch__box"></span></div>';
    }
    h += '</div>';
  } else {
    h += '<div class="card"><div class="card__b"><p class="sub" style="margin:0">Хүнээр хуваах бол «Тоолох» таб дээрх <b>＋ Хүн</b> дарж найзуудаа нэмээд, юм нэмэхийн өмнө хэн болохыг сонго.</p></div></div>';
  }

  h += '<div class="card"><div class="card__h">Тооцоогоор</div>';
  const groups = groupItems(items());
  h += groups.map(g =>
    '<div class="row"><span class="emoji-lg" aria-hidden="true">' + esc(g.emoji) + '</span>' +
    '<div class="row__main"><div class="row__t">' + esc(g.name) + '</div>' +
    '<div class="row__s">' + money(g.price) + ' × ' + g.n + '</div></div>' +
    '<span class="row__v">' + money(g.price * g.n) + '</span></div>'
  ).join('') + '</div>';

  h += '<button class="btn btn--primary" data-act="share">' +
       '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 15v4h14v-4"/></svg>' +
       'Тооцоог найзууддаа илгээх</button>';
  h += '<button class="btn hold" data-act="endSession" data-hold="1400">Суултыг хааж түүхэнд хадгалах</button>' +
       '<p class="hold__hint">Удаан дар (1.5 сек)</p>';

  $('#splitWrap').innerHTML = h;
}
function diffHtml() {
  const c = Number(S.session.claimed) || 0;
  if (!c) return '<p class="sub" style="margin:0">Барнаас гарсан дүнг бичихэд зөрүүг харуулна.</p>';
  const diff = c - total();
  if (diff === 0) return '<div class="big big--ok" style="margin:0"><div class="big__l">Зөрүү</div>' +
    '<div class="big__v">Таарч байна ✓</div><div class="big__s">Тэдний дүн бидний тоололттой ижил</div></div>';
  const over = diff > 0;
  return '<div class="big ' + (over ? 'big--bad' : 'big--ok') + '" style="margin:0">' +
    '<div class="big__l">Зөрүү</div>' +
    '<div class="big__v">' + (over ? '+' : '−') + money(Math.abs(diff)) + '</div>' +
    '<div class="big__s">' + (over
      ? 'Бар <b>' + money(Math.abs(diff)) + '</b>-өөр илүү бичсэн байна.<br>«Лог» таб дээрх цагийн бүртгэлээ харуул.'
      : 'Бар ' + money(Math.abs(diff)) + '-өөр дутуу бичсэн байна.') + '</div></div>';
}
function groupItems(its) {
  const m = new Map();
  its.forEach(i => {
    const k = i.drinkId + '' + i.name + '' + i.price;
    const g = m.get(k) || { emoji: i.emoji, name: i.name, price: Number(i.price) || 0, n: 0 };
    g.n++; m.set(k, g);
  });
  return Array.from(m.values()).sort((a, b) => b.n * b.price - a.n * a.price);
}

/* ── Цэс / тохиргоо ── */
function renderMenu() {
  let h = '';

  h += '<div class="card"><div class="card__h">Суулт</div>' +
    '<div class="row row--tap" data-act="editPlace"><div class="row__main">' +
      '<div class="row__t">' + (S.session.place ? esc(S.session.place) : 'Газрын нэр') + '</div>' +
      '<div class="row__s">' + dateStr(S.session.startedAt) + ' ' + timeStr(S.session.startedAt) + '-с эхэлсэн</div>' +
    '</div><span class="row__v">✎</span></div>' +
    '<div class="row"><div class="row__main"><div class="row__t">Одоогийн тооцоо</div>' +
      '<div class="row__s">' + items().length + ' юм</div></div>' +
      '<span class="row__v">' + money(total()) + '</span></div>' +
    '</div>';

  h += '<div class="card"><div class="card__h">Цэс ба үнэ</div>' +
    S.menu.map(m =>
      '<div class="row row--tap" data-act="editDrink" data-id="' + esc(m.id) + '">' +
      '<span class="emoji-lg" aria-hidden="true">' + esc(m.emoji) + '</span>' +
      '<div class="row__main"><div class="row__t">' + esc(m.name) + '</div>' +
      '<div class="row__s">' + (countOf(m.id) ? countOf(m.id) + ' авсан' : 'аваагүй') + '</div></div>' +
      '<span class="row__v">' + money(m.price) + '</span><span class="row__x">✎</span></div>'
    ).join('') +
    '<div class="row row--tap" data-act="newDrink"><span class="emoji-lg">＋</span>' +
    '<div class="row__main"><div class="row__t">Шинэ юм нэмэх</div>' +
    '<div class="row__s">Хуушуур, цай, дуу — юу ч болно</div></div></div></div>';

  h += '<div class="card"><div class="card__h">Хүмүүс</div>' +
    (S.people.length ? S.people.map(p =>
      '<div class="row"><div class="row__main"><div class="row__t">' + esc(p.name) + '</div>' +
      '<div class="row__s">' + countFor(p.id) + ' юм · ' + money(sum(items().filter(i => i.personId === p.id))) + '</div></div>' +
      '<button class="row__x" data-act="delPerson" data-id="' + esc(p.id) + '" aria-label="Устгах">✕</button></div>'
    ).join('') : '<div class="row"><div class="row__main"><div class="row__s">Хүн нэмээгүй. Бүх юм «Хамт» гэж бүртгэгдэнэ.</div></div></div>') +
    '<div class="row row--tap" data-act="addPerson"><span class="emoji-lg">＋</span>' +
    '<div class="row__main"><div class="row__t">Хүн нэмэх</div></div></div></div>';

  h += '<div class="card"><div class="card__h">Тохиргоо</div>' +
    '<div class="card__b"><span class="field__l">Өнгө</span>' +
    '<div class="seg">' +
      ['dark:Харанхуй', 'light:Цайвар', 'auto:Автомат'].map(x => {
        const [v, l] = x.split(':');
        return '<button data-act="theme" data-v="' + v + '"' + (S.settings.theme === v ? ' class="is-on"' : '') + '>' + l + '</button>';
      }).join('') +
    '</div></div>' +
    '<div class="switch' + (S.settings.haptics ? ' is-on' : '') + '" data-act="toggleHaptics">' +
      '<div class="switch__main"><div class="row__t">Доргих (haptic)</div>' +
      '<div class="row__s">Дарах болгонд мэдрэгдэнэ</div></div><span class="switch__box"></span></div>' +
    '</div>';

  h += '<div class="card"><div class="card__h">Түүх</div>' +
    '<div class="row row--tap" data-act="history"><span class="emoji-lg">🗂</span>' +
    '<div class="row__main"><div class="row__t">Өмнөх суултууд</div>' +
    '<div class="row__s">' + (S.archive.length ? S.archive.length + ' суулт хадгалагдсан' : 'Хоосон') + '</div></div>' +
    '<span class="row__v">›</span></div>' +
    '<div class="row row--tap" data-act="exportJson"><span class="emoji-lg">⤓</span>' +
    '<div class="row__main"><div class="row__t">Бүх датаг файлаар татах</div>' +
    '<div class="row__s">Нөөцлөх / өөр төхөөрөмж рүү зөөх</div></div></div>' +
    '<div class="row row--tap" data-act="importJson"><span class="emoji-lg">⤒</span>' +
    '<div class="row__main"><div class="row__t">Файлаас буцааж оруулах</div></div></div></div>';

  h += '<div class="card"><div class="card__b">' +
    '<button class="btn hold" data-act="clearSession" data-hold="1600">Одоогийн тоог тэглэх</button>' +
    '<p class="hold__hint">Удаан дар — санамсаргүй дарагдахаас хамгаалсан</p></div></div>';

  if (installPrompt) {
    h += '<div class="card"><div class="card__b">' +
      '<button class="btn btn--primary" data-act="install">📲 Апп болгож утсандаа хийх</button>' +
      '<p class="hold__hint">Дараа нь интернетгүй ч ажиллана</p></div></div>';
  } else if (isIOS() && !isStandalone()) {
    h += '<div class="card"><div class="card__b"><p class="sub" style="margin:0">' +
      '<b>iPhone дээр апп болгох:</b> Safari-ийн доод «Хуваалцах» ⤴ товч → <b>«Home Screen-д нэмэх»</b>.' +
      '</p></div></div>';
  }

  h += '<p class="ver">Тооцоо v' + APP_VER + ' · <b>' + (navigator.onLine ? 'Онлайн' : 'Офлайн') + '</b> · ' +
       'дата зөвхөн энэ төхөөрөмж дээр</p>';

  $('#menuWrap').innerHTML = h;
}

/* ────────────────────── sheet (bottom modal) ────────────────────── */
let sheetCtx = null;
function openSheet(title, html, ctx) {
  sheetCtx = ctx || null;
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = html;
  const sh = $('#sheet');
  sh.hidden = false;
  requestAnimationFrame(() => sh.classList.add('is-on'));
}
function closeSheet() {
  const sh = $('#sheet');
  sh.classList.remove('is-on');
  setTimeout(() => { if (!sh.classList.contains('is-on')) { sh.hidden = true; $('#sheetBody').innerHTML = ''; } }, 260);
  sheetCtx = null;
}

function sheetEditDrink(id) {
  const orig = id ? S.menu.find(x => x.id === id) : null;
  if (id && !orig) return;
  const isNew = !orig;
  /* Хуулбар дээр ажиллана → sheet-ийг хаахад өөрчлөлт хүчингүй болно */
  const m = isNew
    ? { id: uid(), emoji: '🍺', name: '', price: 10000, color: PALETTE[S.menu.length % PALETTE.length] }
    : clone(orig);
  const html =
    '<div class="emorow" id="emoRow">' + EMOJIS.map(e =>
      '<button data-act="pickEmoji" data-v="' + e + '"' + (e === m.emoji ? ' class="is-on"' : '') + '>' + e + '</button>'
    ).join('') + '</div>' +
    '<div class="field"><label class="field__l" for="dName">Нэр</label>' +
    '<input class="inp" id="dName" value="' + esc(m.name) + '" placeholder="Драфт пиво" autocomplete="off"></div>' +
    '<div class="field"><label class="field__l" for="dPrice">Үнэ (₮)</label>' +
    '<div class="stepper"><button data-act="priceStep" data-v="-1000">−1000</button>' +
    '<input class="inp inp--num" id="dPrice" inputmode="numeric" autocomplete="off" value="' + nf(m.price) + '">' +
    '<button data-act="priceStep" data-v="1000">+1000</button></div></div>' +
    '<button class="btn btn--primary" data-act="saveDrink">Болсон</button>' +
    (isNew ? '' :
      '<button class="btn hold btn--danger" data-act="delDrink" data-hold="1200">Цэснээс устгах</button>' +
      '<p class="hold__hint">Удаан дар. Бүртгэсэн түүх нь хэвээр хадгалагдана.</p>');
  openSheet(isNew ? 'Шинэ юм' : 'Засах', html, { drink: m, isNew });
  setTimeout(() => { if (isNew) $('#dName') && $('#dName').focus(); }, 320);
}

function sheetPerson() {
  openSheet('Хүн нэмэх',
    '<div class="field"><label class="field__l" for="pName">Нэр</label>' +
    '<input class="inp" id="pName" placeholder="Батаа" autocomplete="off" enterkeyhint="done"></div>' +
    '<button class="btn btn--primary" data-act="savePerson">Нэмэх</button>');
  setTimeout(() => $('#pName') && $('#pName').focus(), 320);
}

function sheetPlace() {
  openSheet('Хаана байна?',
    '<div class="field"><label class="field__l" for="plName">Газрын нэр</label>' +
    '<input class="inp" id="plName" value="' + esc(S.session.place) + '" placeholder="Гранд Хаан, Сүхбаатар" autocomplete="off" enterkeyhint="done"></div>' +
    '<button class="btn btn--primary" data-act="savePlace">Болсон</button>');
  setTimeout(() => $('#plName') && $('#plName').focus(), 320);
}

function sheetHistory() {
  const html = S.archive.length
    ? '<div class="card">' + S.archive.map(a =>
        '<div class="row row--tap" data-act="openArchive" data-id="' + esc(a.id) + '">' +
        '<div class="row__main"><div class="row__t">' + (a.place ? esc(a.place) : 'Нэргүй газар') + '</div>' +
        '<div class="row__s">' + dateStr(a.startedAt) + ' · ' + timeStr(a.startedAt) + '–' + timeStr(a.endedAt) +
        ' · ' + a.items.length + ' юм</div></div>' +
        '<span class="row__v">' + money(sum(a.items)) + '</span><span class="row__x">›</span></div>'
      ).join('') + '</div>'
    : emptyBox('🗂', 'Түүх хоосон.<br>Суулт хаах үед энд хадгалагдана.');
  openSheet('Өмнөх суултууд', html);
}
function sheetArchive(id) {
  const a = S.archive.find(x => x.id === id);
  if (!a) return;
  const g = groupItems(a.items);
  const html =
    '<div class="big"><div class="big__l">' + (a.place ? esc(a.place) : 'Нэргүй газар') + '</div>' +
    '<div class="big__v">' + money(sum(a.items)) + '</div>' +
    '<div class="big__s">' + dateStr(a.startedAt) + ' · ' + timeStr(a.startedAt) + '–' + timeStr(a.endedAt) +
    ' · ' + a.items.length + ' юм</div></div>' +
    '<div class="card">' + g.map(x =>
      '<div class="row"><span class="emoji-lg">' + esc(x.emoji) + '</span>' +
      '<div class="row__main"><div class="row__t">' + esc(x.name) + '</div>' +
      '<div class="row__s">' + money(x.price) + ' × ' + x.n + '</div></div>' +
      '<span class="row__v">' + money(x.price * x.n) + '</span></div>').join('') + '</div>' +
    '<button class="btn btn--primary" data-act="shareArchive" data-id="' + esc(a.id) + '">Хуваалцах</button>' +
    '<button class="btn hold btn--danger" data-act="delArchive" data-id="' + esc(a.id) + '" data-hold="1400">Түүхээс устгах</button>' +
    '<p class="hold__hint">Удаан дар</p>';
  openSheet('Суулт', html);
}

function sheetStale(lastTs) {
  openSheet('Өмнөх тооцоо',
    '<p class="sub">Сүүлд <b>' + dateStr(lastTs) + ' ' + timeStr(lastTs) + '</b>-д бүртгэсэн ' +
    items().length + ' юм (' + money(total()) + ') хэвээр байна. Шинээр эхлэх үү?</p>' +
    '<button class="btn btn--primary" data-act="staleNew">Шинээр эхлэх</button>' +
    '<button class="btn btn--ghost" data-act="closeSheet">Үргэлжлүүлэх</button>' +
    '<p class="hold__hint">«Шинээр эхлэх» дарвал өмнөх тооцоо түүхэнд хадгалагдана — устахгүй.</p>');
}

/* ────────────────────── share / export ────────────────────── */
function summaryText(sess, people) {
  const its = sess.items;
  const L = [];
  L.push('🧾 ТООЦОО' + (sess.place ? ' — ' + sess.place : ''));
  L.push(dateStr(sess.startedAt) + '  ' + timeStr(sess.startedAt) + '–' +
         timeStr(its.length ? its[its.length - 1].ts : sess.startedAt));
  L.push('');
  groupItems(its).forEach(g => L.push(g.emoji + ' ' + g.name + ' × ' + g.n + ' = ' + money(g.n * g.price)));
  L.push('─────────────');
  L.push('НИЙТ: ' + its.length + ' юм · ' + money(sum(its)));
  const ppl = people || [];
  if (ppl.length) {
    const per = ppl.map(p => ({ name: p.name, id: p.id, sum: sum(its.filter(i => i.personId === p.id)), n: its.filter(i => i.personId === p.id).length }));
    const sharedSum = sum(its.filter(i => !i.personId));
    const share = sess.splitShared && ppl.length ? sharedSum / ppl.length : 0;
    if (per.some(p => p.n) || sharedSum) {
      L.push('');
      L.push('👥 Хүнээр:');
      per.forEach(p => L.push('  ' + p.name + ': ' + money(p.sum + share) + (p.n ? ' (' + p.n + ' юм)' : '')));
      if (sharedSum) L.push('  Хамтын: ' + money(sharedSum) + (share ? ' → ' + money(share) + ' тус бүр' : ''));
    }
  }
  if (sess.claimed) {
    const d = sess.claimed - sum(its);
    L.push('');
    L.push('Барын дүн: ' + money(sess.claimed));
    L.push('Зөрүү: ' + (d > 0 ? '+' : d < 0 ? '−' : '') + money(Math.abs(d)) + (d > 0 ? ' ⚠️ илүү бичсэн' : d < 0 ? ' дутуу' : ' ✓'));
  }
  return L.join('\n');
}
function detailText(sess) {
  const L = [summaryText(sess, S.people), '', '⏱ ЦАГИЙН БҮРТГЭЛ:'];
  sess.items.forEach((i, k) => L.push('  ' + timeStr(i.ts) + '  ' + i.emoji + ' ' + i.name +
    '  ' + money(i.price) + (i.personId ? '  (' + ((personById(i.personId) || {}).name || i.personName || '') + ')' : '')));
  return L.join('\n');
}
async function shareText(text) {
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text); toast('📋 Хуулагдлаа — хаана ч зууж болно'); return; } catch (e) {}
  openSheet('Хуулах',
    '<div class="field"><textarea class="inp" readonly ' +
    'style="min-height:230px;padding:12px;line-height:1.45;font-size:16px;font-weight:400">' +
    esc(text) + '</textarea></div>' +
    '<p class="sub">Хуулж авах: текст дээр удаан дарж «Select All» → «Copy».</p>' +
    '<button class="btn" data-act="closeSheet">Хаах</button>');
}
function download(name, text, type) {
  const b = new Blob([text], { type: type || 'application/json' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}

/* ────────────────────────── actions map ────────────────────────── */
const ACT = {
  /* tally */
  add: el => addDrink(el.dataset.id),
  dec: el => removeLastOf(el.dataset.id),
  undo: () => undoLast(),
  delItem: el => removeItem(el.dataset.id),
  who: el => {
    S.activePerson = el.dataset.id || null; save(); haptic(10);
    $$('#who .chip[data-pid]').forEach(c => c.classList.toggle('is-on', pidOf(c) === S.activePerson));
  },

  /* people */
  addPerson: () => sheetPerson(),
  savePerson: () => {
    const v = ($('#pName') && $('#pName').value || '').trim();
    if (!v) { toast('Нэр бичээрэй'); return; }
    const p = { id: uid(), name: v.slice(0, 24) };
    S.people.push(p); S.activePerson = p.id; save(); closeSheet(); refresh();
    toast('👤 ' + p.name + ' нэмэгдлээ — одоо түүний юмыг тоолж болно');
  },
  delPerson: el => {
    const p = personById(el.dataset.id); if (!p) return;
    items().forEach(i => { if (i.personId === p.id) { i.personId = null; i.personName = null; } });
    S.people = S.people.filter(x => x.id !== p.id);
    if (S.activePerson === p.id) S.activePerson = null;
    save(); refresh(); toast(p.name + ' хасагдлаа. Түүний юм «Хамт» болов.');
  },

  /* place */
  editPlace: () => sheetPlace(),
  savePlace: () => {
    S.session.place = (($('#plName') && $('#plName').value) || '').trim().slice(0, 40);
    save(); closeSheet(); refresh();
  },

  /* menu editing */
  editDrink: el => sheetEditDrink(el.dataset.id),
  newDrink: () => sheetEditDrink(null),
  pickEmoji: el => {
    if (!sheetCtx || !sheetCtx.drink) return;
    sheetCtx.drink.emoji = el.dataset.v;
    $$('#emoRow button').forEach(b => b.classList.toggle('is-on', b === el));
    haptic(8);
  },
  priceStep: el => {
    const inp = $('#dPrice'); if (!inp) return;
    const v = Math.max(0, (Number(digits(inp.value)) || 0) + Number(el.dataset.v));
    inp.value = nf(v); haptic(8);
  },
  saveDrink: () => {
    if (!sheetCtx || !sheetCtx.drink) return;
    const m = sheetCtx.drink;
    const name = (($('#dName') && $('#dName').value) || '').trim();
    m.name = (name || m.name || 'Юм').slice(0, 28);
    m.price = Number(digits(($('#dPrice') && $('#dPrice').value) || '0')) || 0;
    const t = sheetCtx.isNew ? null : S.menu.find(x => x.id === m.id);
    if (t) Object.assign(t, m); else S.menu.push(m);
    save(); closeSheet(); refresh();
  },
  delDrink: el => {
    if (!sheetCtx || !sheetCtx.drink) return;
    const id = sheetCtx.drink.id;
    if (S.menu.length <= 1) { toast('Дор хаяж нэг юм байх ёстой'); return; }
    S.menu = S.menu.filter(m => m.id !== id);
    save(); closeSheet(); refresh(); toast('Цэснээс устлаа');
  },

  /* split */
  toggleSplit: () => { S.session.splitShared = !S.session.splitShared; save(); haptic(10); renderSplit(); },
  share: () => shareText(summaryText(S.session, S.people)),
  shareDetail: () => shareText(detailText(S.session)),

  /* session */
  endSession: () => {
    if (!items().length) { toast('Тооцоо хоосон байна'); return; }
    const t = money(total()), n = items().length;
    endSession(true);
    toast('✅ ' + n + ' юм · ' + t + ' түүхэнд хадгалагдлаа');
    setView('count');
  },
  clearSession: () => {
    if (!items().length) { toast('Аль хэдийн хоосон'); return; }
    const backup = items().slice();
    S.session.items = []; S.session.claimed = 0; save(); refresh();
    toast('Тэглэгдлээ', 'Буцаах', () => { S.session.items = backup; save(); refresh(); });
  },
  staleNew: () => { endSession(false); closeSheet(); toast('Шинэ тооцоо. Өмнөх нь түүхэнд байна.'); },

  /* history */
  history: () => sheetHistory(),
  openArchive: el => sheetArchive(el.dataset.id),
  shareArchive: el => {
    const a = S.archive.find(x => x.id === el.dataset.id); if (!a) return;
    shareText(summaryText(a, a.people || []));
  },
  delArchive: el => {
    S.archive = S.archive.filter(x => x.id !== el.dataset.id);
    save(); closeSheet(); refresh(); toast('Устлаа');
  },

  /* settings */
  theme: el => { S.settings.theme = el.dataset.v; save(); applyTheme(); renderMenu(); haptic(8); },
  toggleHaptics: () => { S.settings.haptics = !S.settings.haptics; save(); haptic(20); renderMenu(); },
  hideHint: () => { S.settings.hintDone = true; save(); $('#hint').hidden = true; },

  /* data */
  exportJson: () => {
    download('tooluur-' + dateStr(Date.now()).replace(/\./g, '') + '.json', JSON.stringify(S, null, 2));
    toast('⤓ Файл татагдлаа');
  },
  importJson: () => $('#fileIn').click(),

  /* pwa */
  install: async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt = null;
    renderMenu();
  },

  /* chrome */
  closeSheet: () => closeSheet(),
  toastAction: () => { const cb = toastAction; hideToast(); if (cb) cb(); }
};

/* ────────────────────────── events ────────────────────────── */
let suppressClick = false;
const hit = (t, sel) => (t && t.closest) ? t.closest(sel) : null;

/* Шинэ товшилт эхлэх үед хуучин suppress-ийг цэвэрлэнэ (capture → бусдаас өмнө) */
document.addEventListener('pointerdown', () => { suppressClick = false; },
  { capture: true, passive: true });

document.addEventListener('click', e => {
  const el = hit(e.target, '[data-act]');
  if (!el) return;
  if (el.hasAttribute('data-hold')) return;          /* удаан дарж баталгаажуулах товч */
  if (suppressClick) { suppressClick = false; return; }
  e.preventDefault();
  const fn = ACT[el.dataset.act];
  if (fn) fn(el, e);
});

$('#tabbar').addEventListener('click', e => {
  const t = hit(e.target, '.tab');
  if (t) { haptic(8); setView(t.dataset.tab); }
});

/* Enter → submit (sheet-үүд) */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#sheet').hidden) { closeSheet(); return; }
  if (e.key !== 'Enter') return;
  const id = e.target && e.target.id;
  if (id === 'pName') ACT.savePerson();
  else if (id === 'plName') ACT.savePlace();
  else if (id === 'dName' || id === 'dPrice') { e.target.blur(); ACT.saveDrink(); }
});

/* «Барын дүн» input — фокус алдахгүйн тулд зөвхөн зөрүүг дахин зурна */
document.addEventListener('input', e => {
  if (e.target.id !== 'claimed') return;
  const v = Number(digits(e.target.value)) || 0;
  S.session.claimed = v;
  const c = e.target.selectionStart, was = e.target.value;
  const shown = v ? nf(v) : '';
  if (shown !== was) {
    e.target.value = shown;
    const d = shown.length - was.length;
    try { e.target.setSelectionRange(Math.max(0, c + d), Math.max(0, c + d)); } catch (err) {}
  }
  save();
  const box = $('#diffBox'); if (box) box.innerHTML = diffHtml();
});

/* ── удаан дарах: хавтангийн үнэ засах ── */
let lp = { timer: null, el: null, x: 0, y: 0 };
function lpClear() {
  clearTimeout(lp.timer); lp.timer = null;
  if (lp.el) { const t = lp.el.closest('.tile'); if (t) t.classList.remove('longing'); }
  lp.el = null;
}
document.addEventListener('pointerdown', e => {
  const el = hit(e.target, '[data-long]');
  if (!el) return;
  lp.el = el; lp.x = e.clientX; lp.y = e.clientY;
  const t = el.closest('.tile'); if (t) t.classList.add('longing');
  lp.timer = setTimeout(() => {
    const target = lp.el; lpClear();
    if (!target) return;
    suppressClick = true;
    haptic(35);
    sheetEditDrink(target.dataset.id);
  }, 470);
}, { passive: true });
document.addEventListener('pointermove', e => {
  if (!lp.el) return;
  if (Math.abs(e.clientX - lp.x) > 12 || Math.abs(e.clientY - lp.y) > 12) lpClear();
}, { passive: true });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
  document.addEventListener(ev, lpClear, { passive: true }));

/* ── удаан дарж баталгаажуулах (устгах үйлдлүүд) ── */
let hold = { el: null, raf: 0, t0: 0, ms: 0 };
function holdStop(done) {
  if (hold.raf) cancelAnimationFrame(hold.raf);
  if (hold.el) { hold.el.style.setProperty('--p', 0); hold.el.removeAttribute('data-holding'); }
  const el = hold.el;
  hold = { el: null, raf: 0, t0: 0, ms: 0 };
  if (done && el) {
    suppressClick = true;
    haptic([25, 45, 25]);
    const fn = ACT[el.dataset.act];
    if (fn) fn(el);
  }
}
document.addEventListener('pointerdown', e => {
  const el = hit(e.target, '[data-hold]');
  if (!el) return;
  hold.el = el; hold.ms = Number(el.dataset.hold) || 1400; hold.t0 = performance.now();
  el.setAttribute('data-holding', '');
  const step = now => {
    if (!hold.el) return;
    const p = Math.min(1, (now - hold.t0) / hold.ms);
    hold.el.style.setProperty('--p', p);
    if (p >= 1) { holdStop(true); return; }
    hold.raf = requestAnimationFrame(step);
  };
  hold.raf = requestAnimationFrame(step);
}, { passive: true });
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
  document.addEventListener(ev, () => holdStop(false), { passive: true }));

/* ── файл импорт ── */
const fileIn = document.createElement('input');
fileIn.type = 'file'; fileIn.accept = '.json,application/json'; fileIn.id = 'fileIn';
fileIn.style.display = 'none';
document.body.appendChild(fileIn);
fileIn.addEventListener('change', () => {
  const f = fileIn.files && fileIn.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = normalize(JSON.parse(String(r.result)));
      S = s; save(); gridSig = ''; applyTheme(); refresh();
      toast('✅ Дата орлоо');
    } catch (e) { toast('⚠️ Файлыг уншиж чадсангүй'); }
    fileIn.value = '';
  };
  r.readAsText(f);
});

/* ── theme ── */
function applyTheme() {
  document.documentElement.dataset.theme = S.settings.theme;
  const light = S.settings.theme === 'light' ||
    (S.settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);
  $('#metaTheme').setAttribute('content', light ? '#f4f6fa' : '#0a0c10');
}
const mqLight = window.matchMedia('(prefers-color-scheme: light)');
if (mqLight.addEventListener) mqLight.addEventListener('change', applyTheme);
else if (mqLight.addListener) mqLight.addListener(applyTheme);   /* хуучин Safari */

/* ── PWA ── */
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); installPrompt = e;
  if (view === 'menu') renderMenu();
});
window.addEventListener('appinstalled', () => { installPrompt = null; toast('📲 Апп нэмэгдлээ'); });
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

if ('serviceWorker' in navigator) {
  /* Анхны суулгалт дээр reload хийхгүй — зөвхөн шинэ хувилбар гарахад */
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
  });
}
window.addEventListener('online', () => { if (view === 'menu') renderMenu(); });
window.addEventListener('offline', () => { if (view === 'menu') renderMenu(); });

/* ── өөр таб дээр өөрчлөгдвөл дагаж шинэчлэх ── */
window.addEventListener('storage', e => {
  if (e.key !== KEY) return;
  S = load(); gridSig = ''; applyTheme(); refresh();
});

/* ── цагийн заагчийг шинэчлэх ── */
setInterval(() => { if (!document.hidden) renderAppbar(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAppbar(); });

/* ── boot ── */
applyTheme();
setView('count');
(function checkStale() {
  const its = items();
  if (!its.length) return;
  const last = its[its.length - 1].ts;
  if (Date.now() - last > 6 * 3600 * 1000) sheetStale(last);
})();
