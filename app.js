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
const APP_VER = '2.2.0';

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
/* Үнэ 0 бол «—» — зөвхөн тоо тоолохыг хүсвэл үнэ тавихгүй байж болно */
const priceTxt = p => Number(p) ? money(p) : '—';
const pad2 = n => String(n).padStart(2, '0');
const timeStr = ts => { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); };
const dateStr = ts => { const d = new Date(ts); return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()); };
const sum = arr => arr.reduce((a, i) => a + (Number(i.price) || 0), 0);
const digits = s => String(s).replace(/[^\d]/g, '');

const PALETTE = ['#ffb020', '#f5d90a', '#8ab4ff', '#ff7ab8', '#c084fc',
                 '#ff6b6b', '#34d399', '#22d3ee', '#a3e635', '#fb923c'];
const EMOJIS = ['🍺','🍻','🥃','🍸','🍹','🍷','🍾','🥂','🧉','🥤','🧃','💧',
                '☕','🍟','🍕','🍗','🌭','🍜','🥗','🧊','🚬','🎤','🎱','🎲'];

/* Шинэ юм нэмэхэд нэрийг бичихгүйгээр шууд дарах — хүмүүс өөр өөр төрлийн
   пиво захиалдаг тул хамгийн их таардаг нэрсийг бэлэн болгосон. */
const QUICK = [
  ['🍺','Сэнгүр'], ['🍺','Боргио'], ['🍺','Хархорум'], ['🍺','Нийслэл'],
  ['🍺','Tiger'], ['🍺','Heineken'], ['🍺','Corona'], ['🍺','Асахи'],
  ['🥃','Чингис'], ['🥃','Соёмбо'], ['🍟','Хуушуур'], ['🥗','Салат']
];

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
  return {
    id: uid(), startedAt: Date.now(), place: '', items: [], claimed: 0,
    mode: 'even',        /* 'even' = шэрлэж тэнцүү хуваах (түгээмэл) | 'each' = хүн тус бүрээр */
    heads: 0,            /* шэрлэх үед хэдүүлээ байгаа (0 = сонгоогүй) */
    splitShared: true    /* 'each' үед хамтын юмыг тэнцүү хуваах эсэх */
  };
}
function fresh() {
  return {
    v: 1, menu: clone(DEFAULT_MENU), people: [], activePerson: null,
    recent: [],          /* өмнө бичсэн нэрс — дараа дарахад л болно */
    session: blankSession(), archive: [],
    settings: { theme: 'dark', haptics: true, pricesSet: false }
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
  s.recent = Array.isArray(s.recent)
    ? s.recent.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim().slice(0, 16)).slice(0, 12)
    : [];
  s.archive = Array.isArray(s.archive) ? s.archive : [];
  s.settings = Object.assign(d.settings, s.settings || {});
  if (!s.session || !Array.isArray(s.session.items)) s.session = d.session;
  if (!s.session.id) s.session.id = uid();
  if (!s.session.startedAt) s.session.startedAt = Date.now();
  if (typeof s.session.place !== 'string') s.session.place = '';
  if (typeof s.session.claimed !== 'number') s.session.claimed = 0;
  if (typeof s.session.splitShared !== 'boolean') s.session.splitShared = true;
  s.session.mode = s.session.mode === 'each' ? 'each' : 'even';
  s.session.heads = Math.max(0, Math.min(99, Math.floor(Number(s.session.heads) || 0)));
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

/* Дүн солигдоход тоог урсгаж харуулна — юм нэмэгдсэн нь мэдрэгдэнэ.
   rAF байхгүй/боломжгүй үед ч эцсийн утга нь эхлээд шууд бичигдэнэ. */
let sumShown = 0, sumRaf = 0;
function renderTotalbar() {
  const n = items().length;
  const t = total();
  const el = $('#tbSum');
  $('#tbCount').textContent = n;
  el.textContent = (n && !t) ? '—' : money(t);
  $('#undoBtn').disabled = n === 0;
  const b = $('#tabLogBadge');
  b.hidden = n === 0; b.textContent = n;

  const from = sumShown;
  sumShown = t;
  if (from === t || !t || (n && !t)) return;
  if (typeof requestAnimationFrame !== 'function') return;
  const bar = $('#totalbar');
  if (bar) { bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump'); }
  const t0 = performance.now(), dur = 280;
  cancelAnimationFrame(sumRaf);
  const step = now => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = money(Math.round(from + (t - from) * e));
    if (p < 1) sumRaf = requestAnimationFrame(step);
    else el.textContent = money(t);
  };
  sumRaf = requestAnimationFrame(step);
}

/* ── Тоолох ── */
/* Хоёр төлбөрийн хэлбэрийг сонгох карт — hero болон «Хуваах» таб хоёуланд
   ижил компонентоор гарна. Карт бол ЖИНХЭНЭ товч: дарвал хэлбэр солигдоно.
   (v1.2-д зөвхөн зураг байсан тул дарахад юу ч болдоггүй байв.) */
function modeCardsHtml() {
  const m = S.session.mode === 'each' ? 'each' : 'even';
  const card = (v, e, t, s) =>
    '<button class="way' + (m === v ? ' is-on' : '') + '" data-act="setMode" data-v="' + v + '">' +
      '<span class="way__e">' + e + '</span>' +
      '<span class="way__t">' + t + '</span>' +
      '<span class="way__s">' + s + '</span>' +
      '<span class="way__tick">✓</span>' +
    '</button>';
  return '<div class="ways">' +
    card('even', '🤝', 'Шэрлэх', 'Нийт дүнг хүний тоонд тэнцүү хуваана') +
    card('each', '🙋', 'Хүн тус бүрээр', 'Хэн юу авсныг тусад нь тооцно') +
  '</div>';
}

/* Хэдүүлээ байгааг нэг товшилтоор — hero болон «Хуваах» таб хоёуланд */
function headsPickHtml() {
  const n = headCount();
  let h = '<div class="heads">' +
    [2,3,4,5,6,7,8].map(k =>
      '<button data-act="setHeads" data-v="' + k + '"' + (n === k ? ' class="is-on"' : '') + '>' +
      k + '</button>').join('') +
    (n > 8 ? '<button class="is-on" data-act="headsStep" data-v="0">' + n + '</button>'
           : '<button data-act="setHeads" data-v="9" aria-label="Илүү">9+</button>') +
  '</div>';
  if (n > 8) {
    h += '<div class="stepper2">' +
      '<button data-act="headsStep" data-v="-1" aria-label="Хасах">−</button>' +
      '<span class="stepper2__v">' + n + ' хүн</span>' +
      '<button data-act="headsStep" data-v="1" aria-label="Нэмэх">＋</button></div>';
  }
  return h;
}

function heroHtml() {
  const even = S.session.mode !== 'each';
  return '<section class="hero">' +
    '<h1 class="hero__t">Юу захиалж авснаа<br>мартдаг шүүдээ 🍻</h1>' +
    '<p class="hero__p">Бар, пабд сууж байхад юу авсан нь мартагддаг. ' +
      'Захиалга ирэх болгонд <b>доорхоос нэг дараад л яв</b> — хялбархан бүртгэгдээд ' +
      'байна. Дахиж тооцоо дээр толгой өвдөхгүй.</p>' +
    '<p class="hero__lead">Доорх 2 төрлөөр тооцоогоо бодож болно:</p>' +
    modeCardsHtml() +
    (even
      ? '<div class="setup"><span class="setup__l">Хэдүүлээ байна?</span>' +
        headsPickHtml() +
        (headCount() ? '<p class="setup__ok">✓ ' + headCount() +
            ' хүнд тэнцүү хуваана. Одоо тоолж эхэл.</p>'
          : '<p class="setup__s">Одоо дарж болно, дараа ч болно.</p>') +
        '</div>'
      : '<div class="setup"><span class="setup__l">Хэн хэн байна?</span>' +
        (S.people.length
          ? '<div class="pchips">' + S.people.map(p =>
              '<span class="pchip pchip--ro"><span class="pchip__a" style="--c:' +
              esc(avaColor(p.id)) + '">' + esc(initial(p.name)) + '</span>' +
              esc(p.name) + '</span>').join('') + '</div>' +
            '<p class="setup__s">Юм авахын өмнө <b>хэн болохыг дар</b>. Мартсан ч болно — ' +
            '«Лог» таб дээрээс дараа нь тэмдэглэж болно.</p>'
          : '<p class="setup__s">Нэр нэмээд л явцгаая. Бичсэн нэрийг санаж авах тул ' +
            'дараагийн удаа дарахад л болно.</p>') +
        '<button class="btn' + (S.people.length ? '' : ' btn--primary') +
        '" data-act="addPerson">＋ Хүн нэмэх</button>' +
        '</div>') +
  '</section>';
}

let headEmpty = null;                    /* hero-г шаардлагагүйд дахин барихгүйн тулд */
function renderHead() {
  headEmpty = !items().length;
  let h = items().length ? '' : heroHtml();
  if (!S.settings.pricesSet) {
    h += '<div class="warn warn--slim">' +
      '<button class="warn__go" data-act="setupPrices">⚠️ Үнэ нь таамаг — ' +
      '<b>үнэ дээр дараад</b> засаарай</button>' +
      '<button class="warn__x" data-act="pricesOk" aria-label="Хаах">✕</button>' +
    '</div>';
  }
  $('#hint').innerHTML = h;
}

/* Сонгосон хэлбэр + үнэ засах товч НЭГ зурваст — хоёр мөр эзлэхгүй.
   Hero харагдаж байхад хэлбэр нь тэнд аль хэдийн байгаа тул давхардуулахгүй. */
/* Сонгосон хэлбэрийг тоолж байхад сануулах нимгэн зурвас */
function renderEditbar() {
  if (!items().length) { $('#editbar').innerHTML = ''; return; }
  const mode = S.session.mode === 'each'
    ? '🙋 Хүн тус бүрээр'
    : '🤝 Шэрлэх' + (headCount() ? ' · ' + headCount() + ' хүн' : '');
  $('#editbar').innerHTML =
    '<button class="bar2__mode" data-act="goSplit"><em>' + mode + '</em>›</button>';
}

let gridSig = '';
function renderCount() {
  renderHead();
  renderWho();
  renderEditbar();
  const sig = S.menu.map(m => [m.id, m.emoji, m.name, m.price, m.color].join('')).join('');
  if (sig !== gridSig) { gridSig = sig; buildGrid(); }
  syncGrid();
}
function buildGrid() {
  /* Хавтан 3 тусдаа даралтын талбартай:
       · том хэсэг  → +1 (тоолох)
       · үнэ        → үнийг ШУУД засах (тусдаа режим шаардахгүй)
       · −          → 1 хасах (зөвхөн тоо байхад)
     Үнэ нь жижиг, хүрээтэй, харандаатай тул тоолохоор дарж байгаа хуруу
     оногдохоос хол — гэхдээ хажуугаар нь харагдаж, нэг товшилтоор нээгдэнэ. */
  const hint = S.settings.pricesSet ? '' : ' is-hint';
  $('#grid').innerHTML = S.menu.map((m, k) =>
    '<div class="tile" data-id="' + esc(m.id) + '" style="--i:' + k + '">' +
      '<button class="tile__add" data-act="add" data-long="drink" data-id="' + esc(m.id) + '" ' +
              'aria-label="' + esc(m.name) + ' нэмэх">' +
        '<span class="tile__emoji" aria-hidden="true">' + esc(m.emoji) + '</span>' +
        '<span class="tile__name">' + esc(m.name) + '</span>' +
      '</button>' +
      '<span class="tile__count" aria-hidden="true">0</span>' +
      '<button class="tile__price' + (m.price ? '' : ' is-empty') + hint + '" ' +
              'data-act="editDrink" data-id="' + esc(m.id) + '" ' +
              'aria-label="' + esc(m.name) + '-ийн үнэ засах">' +
        (m.price ? money(m.price) : 'Үнэ?') + '<i aria-hidden="true">✎</i>' +
      '</button>' +
      '<button class="tile__minus" data-act="dec" data-id="' + esc(m.id) + '" ' +
              'aria-label="' + esc(m.name) + ' хасах">−</button>' +
    '</div>'
  ).join('') +
  '<div class="tile tile--new" style="--i:' + S.menu.length + '">' +
    '<button class="tile__add" data-act="newDrink" aria-label="Шинэ төрөл нэмэх">' +
      '<span class="tile__emoji" aria-hidden="true">＋</span>' +
      '<span class="tile__name">Шинэ төрөл</span>' +
    '</button>' +
  '</div>';
}
function syncGrid() {
  $$('#grid .tile[data-id]').forEach(t => {
    const n = countOf(t.dataset.id);
    t.classList.toggle('has', n > 0);
    const c = $('.tile__count', t);
    if (c && c.textContent !== String(n)) c.textContent = n;
  });
}
function paint(drinkId) {
  syncGrid(); syncWho(); renderTotalbar();
  /* Эхний юм нэмэгдмэгц hero нь замаас гарч, оронд нь хэлбэрийн зурвас
     орно (эсрэгээр нь ч мөн). Хоёулаа хоосон/хоосон биш төлвөөс хамаарна. */
  if (headEmpty !== !items().length) { renderHead(); renderEditbar(); }
  const t = $('#grid .tile[data-id="' + CSS.escape(drinkId) + '"]');
  if (!t) return;
  t.classList.remove('pop');
  void t.offsetWidth;
  t.classList.add('pop');
}
/* Хүний зурвас зөвхөн «хүн тус бүрээр» хэлбэрт л гарна — шэрлэх үед нэр
   хэрэггүй тул тоолох дэлгэц цэвэр байна.
   Chip-ийн тоог DOM-оо дахин барихгүйгээр шинэчилдэг — товших болгонд
   хэвтээ scroll буцаж үсэрдэггүй. */
const pidOf = c => c.dataset.pid === '-' ? null : c.dataset.pid;
function renderWho() {
  const box = $('#who');
  if (S.session.mode !== 'each') { box.innerHTML = ''; box.hidden = true; return; }
  box.hidden = false;
  const cur = S.activePerson || null;
  const chip = (id, label, ava, color) =>
    '<button class="chip' + (cur === id ? ' is-on' : '') + '" data-act="who" ' +
    'data-id="' + esc(id || '') + '" data-pid="' + esc(id || '-') + '">' +
    '<span class="chip__a" style="--c:' + esc(color) + '">' + ava + '</span>' +
    '<span class="chip__l">' + label + '</span>' +
    '<span class="chip__n">' + (countFor(id) || '') + '</span></button>';
  box.innerHTML =
    chip(null, 'Хамт', '🤝', 'var(--dimmer)') +
    S.people.map(p => chip(p.id, esc(p.name), esc(initial(p.name)), avaColor(p.id))).join('') +
    '<button class="chip chip--add" data-act="addPerson" aria-label="Хүн нэмэх">＋</button>';
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
  const each = S.session.mode === 'each';
  const rows = its.slice().reverse().map((i, k) => {
    const who = i.personId ? (personById(i.personId) || { name: i.personName || '?' }) : null;
    const tag = each
      ? '<button class="lchip' + (who ? ' is-on' : '') + '" data-act="cyclePerson" ' +
        'data-id="' + esc(i.id) + '">' +
        (who ? '<span class="lchip__a" style="--c:' + esc(avaColor(i.personId)) + '">' +
                 esc(initial(who.name)) + '</span>' + esc(who.name)
             : '🤝 Хамтын') + ' ⇄</button>'
      : (who ? '<span class="lchip is-static">' + esc(who.name) + '</span>' : '');
    return '<div class="row">' +
      '<span class="emoji-lg" aria-hidden="true">' + esc(i.emoji) + '</span>' +
      '<div class="row__main">' +
        '<div class="row__t">' + esc(i.name) + '</div>' +
        '<div class="row__s">' + timeStr(i.ts) + ' · #' + (its.length - k) + '</div>' +
        (tag ? '<div class="row__tag">' + tag + '</div>' : '') +
      '</div>' +
      '<span class="row__v">' + priceTxt(i.price) + '</span>' +
      '<button class="row__x" data-act="delItem" data-id="' + esc(i.id) + '" aria-label="Устгах">✕</button>' +
    '</div>';
  }).join('');

  $('#logWrap').innerHTML =
    '<p class="sub">' + (each
      ? 'Хэн авсныг тэмдэглэхийн тулд <b>нэрэн дээр дар</b> — дарах тоолонд дараагийн хүн болно.'
      : 'Хамгийн шинэ нь дээрээ. Бүртгэл цаг хугацаатай учраас барын тооцоотой тулгахад хүчинтэй.') +
    '</p>' +
    '<div class="card">' + rows + '</div>' +
    '<button class="btn btn--ghost" data-act="shareDetail"><svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 15v4h14v-4"/></svg>Цагийн бүртгэлийг хуулах</button>';
}
function emptyBox(e, html) {
  return '<div class="empty"><span class="empty__e">' + e + '</span><p>' + html + '</p></div>';
}

/* ── Хуваах ──
   Хоёр хэрэгцээ:
     1) ШЭРЛЭХ (түгээмэл) — нийт дүнг хүний тоонд тэнцүү хуваана. Нэр хэрэггүй,
        зөвхөн «хэдүүлээ» гэдэг тоо. Нэг товшилтоор сонгоно.
     2) ХҮН ТУС БҮРЭЭР (хааяа) — хэн юу авсныг тусад нь тооцно.
   Тиймээс default нь шэрлэх, хүний нэр зөвхөн 2-р хэлбэрт л гарна. */
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

/* Шэрлэх үед хэдүүлээ байгаа тоо */
function headCount() {
  const h = Number(S.session.heads) || 0;
  return h > 0 ? h : 0;
}

function renderSplit() {
  const n = items().length;
  const t = total();
  const mode = S.session.mode === 'each' ? 'each' : 'even';
  let h = '';

  if (n) {
    h += '<div class="big big--hero"><div class="big__l">Нийт</div>' +
         '<div class="big__v">' + (t ? money(t) : '—') + '</div>' +
         '<div class="big__s">' + n + ' юм · ' + timeStr(S.session.startedAt) + '–' +
         timeStr(items()[n - 1].ts) + '</div></div>';
  } else {
    h += '<div class="big big--hero"><div class="big__l">Нийт</div>' +
         '<div class="big__v dimmer">0₮</div>' +
         '<div class="big__s">Юм тоолоогүй байна — доор тохируулаад ор</div></div>';
  }

  /* Хэлбэр сонгох нь ҮРГЭЛЖ харагдана (юм тоолоогүй ч) */
  h += '<p class="card__h card__h--free">Тооцоог хэрхэн бодох вэ?</p>';
  h += modeCardsHtml();

  h += mode === 'even' ? splitEvenHtml(t, n) : splitEachHtml(n);

  if (n) {
    h += '<div class="card"><div class="card__h">Барын тооцоотой тулгах</div><div class="card__b">' +
         '<div class="field"><label class="field__l" for="claimed">Тэдний бичсэн дүн</label>' +
         '<input class="inp inp--num" id="claimed" inputmode="numeric" autocomplete="off" ' +
         'placeholder="0" value="' + (S.session.claimed ? nf(S.session.claimed) : '') + '"></div>' +
         '<div id="diffBox">' + diffHtml() + '</div></div></div>';

    h += '<button class="btn btn--primary" data-act="share">' +
         '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 15v4h14v-4"/></svg>' +
         'Тооцоог найзууддаа илгээх</button>';
    h += '<button class="btn hold" data-act="endSession" data-hold="1400">Суултыг хааж хадгалах</button>' +
         '<p class="hold__hint">Удаан дар (1.5 сек)</p>';
  } else {
    h += '<button class="btn btn--primary" data-act="goCount">🍺 Тоолж эхлэх</button>';
  }

  $('#splitWrap').innerHTML = h;
}

/* ── 1. Шэрлэх ── */
function splitEvenHtml(t, n) {
  const heads = headCount();
  let h = '<div class="card"><div class="card__h">Хэдүүлээ байна?</div><div class="card__b">' +
    headsPickHtml() + '</div></div>';

  if (!heads) {
    h += '<p class="sub sub--c">Хэдүүлээ байгааг дарвал хүн тутамд хэдэн төгрөг ' +
         'болохыг шууд гаргана.</p>';
    return h;
  }
  if (!n || !t) {
    h += '<div class="big big--pay"><div class="big__l">Хүн тутамд</div>' +
         '<div class="big__v dimmer">—</div>' +
         '<div class="big__s">' + heads + ' хүнд тэнцүү хуваахад бэлэн. ' +
         'Юм тоолмогц дүн гарна.</div></div>';
    return h;
  }
  const each = Math.ceil((t / heads) / 100) * 100;      /* 100₮ дээш бөөрөнхийлнө */
  h += '<div class="big big--pay"><div class="big__l">Хүн тутамд</div>' +
       '<div class="big__v">' + money(each) + '</div>' +
       '<div class="big__s">' + heads + ' × ' + money(each) + ' = ' + money(each * heads) +
       (each * heads !== t ? ' <span class="dimmer">(' + money(each * heads - t) + ' үлдэнэ)</span>' : '') +
       '</div></div>';
  return h;
}

/* ── 2. Хүн тус бүрээр ── */
function splitEachHtml(n) {
  const d = splitData();
  if (!d.heads) {
    return '<div class="card"><div class="card__b">' +
      '<p class="sub">Хэн хэн байгааг нэмээд, «Тоолох» таб дээр юм авахын өмнө ' +
      'хэн болохыг дараарай. Мартсан ч болно — «Лог» таб дээрээс дараа нь хуваарилж болно.</p>' +
      '<button class="btn btn--primary" data-act="addPerson">＋ Хүн нэмэх</button></div></div>';
  }
  let h = '<div class="card"><div class="card__h">Хэн хэдийг төлөх</div>';
  h += d.per.map(p =>
    '<div class="row"><span class="ava" style="--c:' + esc(avaColor(p.id)) + '">' +
      esc(initial(p.name)) + '</span>' +
    '<div class="row__main"><button class="row__t row__t--tap" data-act="renamePerson" data-id="' +
      esc(p.id) + '">' + esc(p.name) + ' ✎</button>' +
    '<div class="row__s">' + p.n + ' юм' +
      (d.share ? ' + хамтын ' + money(d.share) : '') + '</div></div>' +
    '<span class="row__v">' + money(p.sum + d.share) + '</span>' +
    '<button class="row__x" data-act="delPerson" data-id="' + esc(p.id) + '" ' +
      'aria-label="Хасах">✕</button></div>'
  ).join('');
  h += '<div class="row row--tap" data-act="addPerson"><span class="ava ava--add">＋</span>' +
       '<div class="row__main"><div class="row__t">Хүн нэмэх</div></div></div>';
  if (d.sharedN) {
    h += '<div class="row"><span class="ava ava--all">🤝</span>' +
      '<div class="row__main"><div class="row__t">Хамтын</div>' +
      '<div class="row__s">' + d.sharedN + ' юм · ' +
      (S.session.splitShared ? d.heads + ' хүнд тэнцүү' : 'хуваагаагүй') + '</div></div>' +
      '<span class="row__v">' + money(d.sharedSum) + '</span></div>';
    h += '<div class="switch' + (S.session.splitShared ? ' is-on' : '') + '" data-act="toggleSplit">' +
      '<div class="switch__main"><div class="row__t">Хамтын юмыг тэнцүү хуваах</div>' +
      '<div class="row__s">' + money(d.sharedSum / d.heads) + ' тус бүр</div></div>' +
      '<span class="switch__box"></span></div>';
  }
  h += '</div>';

  if (!n) {
    h += '<p class="sub sub--c">Хүнээ нэмээд «Тоолох» таб дээр юм авахын өмнө ' +
         'хэн болохыг дар.</p>';
  } else if (!d.per.reduce((a, p) => a + p.sum, 0) && d.sharedSum) {
    h += '<p class="sub sub--c">Бүх юм «Хамтын» болж байна. «Лог» таб дээр бүртгэлийн ' +
         'нэрэн дээр дарж хэн авсныг тэмдэглэ.</p>';
  }
  return h;
}

const AVA = ['#ffb020','#8ab4ff','#ff7ab8','#34d399','#c084fc','#fb923c','#22d3ee','#f5d90a'];
function avaColor(id) {
  const i = S.people.findIndex(p => p.id === id);
  return AVA[(i < 0 ? 0 : i) % AVA.length];
}
function initial(name) {
  return String(name || '?').trim().charAt(0).toUpperCase() || '?';
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
      '<span class="row__v">' + priceTxt(m.price) + '</span><span class="row__x">✎</span></div>'
    ).join('') +
    '<div class="row row--tap" data-act="newDrink"><span class="emoji-lg">＋</span>' +
    '<div class="row__main"><div class="row__t">Шинэ төрөл нэмэх</div>' +
    '<div class="row__s">Сэнгүр, Tiger, хуушуур — юу ч болно</div></div></div>' +
    '<div class="row row--tap" data-act="setupPrices"><span class="emoji-lg">✎</span>' +
    '<div class="row__main"><div class="row__t">Бүх үнийг дараалуулж тохируулах</div>' +
    '<div class="row__s">Барынхаараа нэг нэгээр тааруулна</div></div></div></div>';

  h += '<div class="card"><div class="card__h">Хүмүүс</div>' +
    (S.people.length ? S.people.map(p =>
      '<div class="row row--tap" data-act="renamePerson" data-id="' + esc(p.id) + '">' +
      '<span class="ava" style="--c:' + esc(avaColor(p.id)) + '">' + esc(initial(p.name)) + '</span>' +
      '<div class="row__main"><div class="row__t">' + esc(p.name) + ' ✎</div>' +
      '<div class="row__s">' + countFor(p.id) + ' юм · ' +
      money(sum(items().filter(i => i.personId === p.id))) + '</div></div>' +
      '<button class="row__x" data-act="delPerson" data-id="' + esc(p.id) + '" aria-label="Хасах">✕</button></div>'
    ).join('')
    : '<div class="row"><div class="row__main"><div class="row__s">Хүн нэмээгүй. ' +
      'Шэрлэж хуваахад хүний нэр хэрэггүй — «Хуваах» таб дээр хэдүүлээ байгааг л дарна.' +
      '</div></div></div>') +
    '<div class="row row--tap" data-act="addPerson"><span class="ava ava--add">＋</span>' +
    '<div class="row__main"><div class="row__t">Хүн нэмэх</div>' +
    '<div class="row__s">Хүн тус бүрээр тооцох бол</div></div></div></div>';

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
       'дата зөвхөн энэ төхөөрөмж дээр</p>' +
       '<p class="madeby">Developed with <span class="madeby__h">♥</span> by Ganbaa</p>';

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

/* Үнэ бичих keypad. Утасны гар биш өөрийн товчнууд — том, зум хийхгүй,
   компьютер дээр ч ижил ажиллана. Эхний цифр дарахад хуучин үнийг дардаг
   (калькулятор шиг) тул «цэвэрлэх» товч шаардахгүй. */
function padHtml(price) {
  const key = (k, txt, cls) =>
    '<button class="' + (cls || '') + '" data-act="padKey" data-k="' + k + '">' + (txt || k) + '</button>';
  return '<div class="padval" id="padVal">' + priceTxt(price) + '</div>' +
    '<div class="pad">' +
      [1,2,3,4,5,6,7,8,9].map(n => key(n)).join('') +
      key('000', '000', 'pad--sm') + key(0) + key('del', '⌫', 'pad--sm') +
    '</div>';
}

function sheetEditDrink(id, chain) {
  const orig = id ? S.menu.find(x => x.id === id) : null;
  if (id && !orig) return;
  const isNew = !orig;
  /* Хуулбар дээр ажиллана → sheet-ийг хаахад өөрчлөлт хүчингүй болно */
  const m = isNew
    ? { id: uid(), emoji: '🍺', name: '', price: 0, color: PALETTE[S.menu.length % PALETTE.length] }
    : clone(orig);
  const idx = S.menu.findIndex(x => x.id === m.id);
  const hasNext = !!chain && idx >= 0 && idx < S.menu.length - 1;

  const quick = '<div class="quick">' + QUICK.map(q =>
    '<button data-act="quickName" data-v="' + esc(q[1]) + '" data-e="' + esc(q[0]) + '">' +
    q[0] + ' ' + esc(q[1]) + '</button>').join('') + '</div>';

  const nameBlock =
    '<div class="field"><label class="field__l" for="dName">Нэр</label>' +
    '<input class="inp" id="dName" value="' + esc(m.name) + '" placeholder="Сэнгүр" ' +
    'autocomplete="off" enterkeyhint="done"></div>';

  const emoBlock = '<div class="field"><span class="field__l">Зураг</span>' +
    '<div class="emorow" id="emoRow">' + EMOJIS.map(e =>
      '<button data-act="pickEmoji" data-v="' + e + '"' + (e === m.emoji ? ' class="is-on"' : '') + '>' +
      e + '</button>').join('') + '</div></div>';

  const actions =
    (hasNext ? '<button class="btn btn--primary" data-act="nextDrink">Дараах →</button>' : '') +
    '<button class="btn' + (hasNext ? '' : ' btn--primary') + '" data-act="saveDrink">' +
      (isNew ? 'Нэмэх' : chain ? 'Дууссан' : 'Болсон') + '</button>';

  const del = isNew ? '' :
    '<button class="btn hold btn--danger" data-act="delDrink" data-hold="1200">Цэснээс устгах</button>' +
    '<p class="hold__hint">Удаан дар. Бүртгэсэн түүх нь хэвээр хадгалагдана.</p>';

  const html = isNew
    ? '<p class="sub">Юу авав? Дарж сонго, эсвэл бичээд үнээ хий.</p>' +
      quick + nameBlock + padHtml(m.price) + actions + emoBlock
    : padHtml(m.price) + actions +
      '<details class="more"><summary>Нэр, зураг, устгах</summary>' +
      nameBlock + emoBlock + del + '</details>';

  openSheet(isNew ? 'Шинэ төрөл' : m.emoji + ' ' + m.name, html,
    { drink: m, isNew, priceStr: String(m.price || ''), padFresh: true, chain: !!chain });
}

/* sheetCtx-ийн хуулбарыг цэс руу буулгана */
function commitDrink() {
  if (!sheetCtx || !sheetCtx.drink) return false;
  const m = sheetCtx.drink;
  const nameEl = $('#dName');
  if (nameEl) m.name = (nameEl.value || '').trim().slice(0, 28) || m.name;
  if (!m.name) { toast('Нэрээ бичээрэй'); return false; }
  m.price = Number(sheetCtx.priceStr || 0) || 0;
  const t = sheetCtx.isNew ? null : S.menu.find(x => x.id === m.id);
  if (t) Object.assign(t, m); else S.menu.push(m);
  S.settings.pricesSet = true;
  save();
  return true;
}

/* Хүн нэмэх — нэрийг бичээд Enter дарахад ШУУД нэмэгдэж, гар хаагдалгүй
   дараагийнхыг бичиж болно. 3 найзыг нэмэхэд 3 удаа модал онгойлгож хаах
   шаардлагагүй. Өмнө нь нэмсэн нэрс «хурдан нэмэх» болж хадгалагдах тул
   хоёр дахь удаагаас бичих шаардлагагүй — зөвхөн дарна. */
function sheetPeople() {
  openSheet('Хэн хэн байна?',
    '<p class="sub">Нэрийг бичээд <b>Enter</b> дар. Гар хаагдахгүй — дараагийнхыг ' +
    'шууд бичээд л явна.</p>' +
    '<div class="addrow">' +
      '<input class="inp" id="pAdd" placeholder="Батаа" autocomplete="off" ' +
      'autocapitalize="words" enterkeyhint="done" maxlength="16">' +
      '<button data-act="addPersonName" aria-label="Нэмэх">＋</button>' +
    '</div>' +
    '<div id="pList"></div>' +
    '<div id="pRecent"></div>' +
    '<button class="btn btn--primary" data-act="closeSheet">Болсон</button>');
  renderPeopleSheet();
  setTimeout(() => { const el = $('#pAdd'); if (el) el.focus(); }, 330);
}

function renderPeopleSheet() {
  const list = $('#pList');
  if (list) {
    list.innerHTML = S.people.length
      ? '<p class="field__l">' + S.people.length + ' хүн</p><div class="pchips">' +
        S.people.map(p =>
          '<button class="pchip" data-act="rmPerson" data-id="' + esc(p.id) + '">' +
          '<span class="pchip__a" style="--c:' + esc(avaColor(p.id)) + '">' +
          esc(initial(p.name)) + '</span>' + esc(p.name) + '<i>✕</i></button>').join('') +
        '</div>'
      : '';
  }
  const rec = $('#pRecent');
  if (rec) {
    const have = S.people.map(p => p.name.toLowerCase());
    const opts = ['Би'].concat(S.recent || [])
      .filter((n, i, a) => a.indexOf(n) === i && have.indexOf(n.toLowerCase()) < 0)
      .slice(0, 10);
    rec.innerHTML = opts.length
      ? '<p class="field__l">Хурдан нэмэх</p><div class="quick">' +
        opts.map(n => '<button data-act="addRecent" data-v="' + esc(n) + '">＋ ' +
        esc(n) + '</button>').join('') + '</div>'
      : '';
  }
}

/* Бичсэн нэрийг санаж, дараагийн шөнө дарахад л болдог болгоно */
function rememberName(n) {
  const r = (S.recent || []).filter(x => x.toLowerCase() !== n.toLowerCase());
  r.unshift(n);
  S.recent = r.slice(0, 12);
}

function addPersonNamed(name) {
  const v = String(name || '').trim().slice(0, 16);
  if (!v) return null;
  if (S.people.length >= 12) { toast('12 хүнээс их болохгүй'); return null; }
  if (S.people.some(p => p.name.toLowerCase() === v.toLowerCase())) {
    toast(v + ' аль хэдийн байна'); return null;
  }
  const p = { id: uid(), name: v };
  S.people.push(p);
  if (!S.activePerson) S.activePerson = p.id;
  S.session.mode = 'each';
  rememberName(v);
  save(); haptic(12);
  return p;
}

function removePerson(id) {
  const p = personById(id);
  if (!p) return null;
  items().forEach(i => { if (i.personId === p.id) { i.personId = null; i.personName = null; } });
  S.people = S.people.filter(x => x.id !== p.id);
  if (S.activePerson === p.id) S.activePerson = S.people.length ? S.people[0].id : null;
  save();
  return p;
}

function sheetPerson(id) {
  const p = personById(id);
  if (!p) return;
  openSheet('Нэрийг солих',
    '<div class="field"><input class="inp" id="pName" value="' + esc(p.name) + '" ' +
    'placeholder="Батаа" autocomplete="off" enterkeyhint="done" maxlength="16"></div>' +
    '<button class="btn btn--primary" data-act="savePerson">Болсон</button>' +
    '<button class="btn hold btn--danger" data-act="delPerson" data-id="' + esc(p.id) + '" ' +
    'data-hold="1200">Хасах</button>' +
    '<p class="hold__hint">Удаан дар. Түүний авсан юм «Хамтын» болно, дүн алдагдахгүй.</p>',
    { personId: p.id });
  setTimeout(() => {
    const el = $('#pName');
    if (el) { el.focus(); if (el.select) el.select(); }
  }, 320);
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
  if (sess.mode === 'each' && ppl.length) {
    const per = ppl.map(p => ({
      name: p.name, id: p.id,
      sum: sum(its.filter(i => i.personId === p.id)),
      n: its.filter(i => i.personId === p.id).length
    }));
    const sharedSum = sum(its.filter(i => !i.personId));
    const share = sess.splitShared ? sharedSum / ppl.length : 0;
    L.push('');
    L.push('🙋 Хүн тус бүрээр:');
    per.forEach(p => L.push('  ' + p.name + ': ' + money(p.sum + share) + (p.n ? ' (' + p.n + ' юм)' : '')));
    if (sharedSum) L.push('  🤝 Хамтын: ' + money(sharedSum) +
      (share ? ' → ' + money(share) + ' тус бүр' : ''));
  } else {
    const n = Math.max(0, Math.min(99, Math.floor(Number(sess.heads) || 0)));
    if (n > 1) {
      const each = Math.ceil((sum(its) / n) / 100) * 100;
      L.push('');
      L.push('🤝 ' + n + ' хүн шэрлэвэл: ' + money(each) + ' тус бүр');
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
  setupPrices: () => { if (S.menu.length) sheetEditDrink(S.menu[0].id, true); },
  pricesOk: () => { S.settings.pricesSet = true; save(); renderHead(); },
  dec: el => removeLastOf(el.dataset.id),
  undo: () => undoLast(),
  delItem: el => removeItem(el.dataset.id),
  who: el => {
    S.activePerson = el.dataset.id || null; save(); haptic(10);
    $$('#who .chip[data-pid]').forEach(c => c.classList.toggle('is-on', pidOf(c) === S.activePerson));
  },

  /* people */
  addPerson: () => sheetPeople(),
  addPersonName: () => {
    const el = $('#pAdd');
    if (!el) return;
    const p = addPersonNamed(el.value);
    el.value = '';
    if (p) { refresh(); renderPeopleSheet(); }
    if (el.focus) el.focus();          /* гар хаагдалгүй дараагийнхыг бичнэ */
  },
  addRecent: el => {
    if (addPersonNamed(el.dataset.v)) { refresh(); renderPeopleSheet(); }
    const i = $('#pAdd'); if (i && i.focus) i.focus();
  },
  rmPerson: el => {
    const p = removePerson(el.dataset.id);
    if (p) { refresh(); renderPeopleSheet(); }
  },
  renamePerson: el => sheetPerson(el.dataset.id),
  savePerson: () => {
    const v = (($('#pName') && $('#pName').value) || '').trim().slice(0, 16);
    if (!v) { toast('Нэр бичээрэй'); return; }
    const p = personById(sheetCtx && sheetCtx.personId);
    if (p) {
      p.name = v;
      items().forEach(i => { if (i.personId === p.id) i.personName = v; });
    }
    save(); closeSheet(); refresh();
  },
  delPerson: el => {
    const p = removePerson(el.dataset.id);
    if (!p) return;
    closeSheet(); refresh();
    toast(p.name + ' хасагдлаа. Түүний юм «Хамтын» болов.');
  },

  /* хуваах хэлбэр */
  setMode: el => {
    const v = el.dataset.v === 'each' ? 'each' : 'even';
    S.session.mode = v;
    /* Шэрлэх үед хүний зурвас нуугддаг тул сонголт нь үзэгдэхгүй хэвээр
       үлдэж, юм нь нэг хүн дээр далд бичигдэхээс сэргийлнэ. */
    if (v === 'even') S.activePerson = null;
    /* Хэн ч сонгогдоогүй бол товшилт «Хамтын» болж хэлбэр нь утгагүй болно */
    if (v === 'each' && !S.activePerson && S.people.length) S.activePerson = S.people[0].id;
    save(); haptic(14); refresh();
    if (v === 'each' && !S.people.length) { sheetPeople(); return; }
    toast(v === 'even'
      ? '🤝 Шэрлэх — хэдүүлээ байгааг дараарай'
      : '🙋 Хүн тус бүрээр — юм авахын өмнө хэнийг дар');
  },
  setHeads: el => {
    S.session.heads = Math.max(0, Math.min(99, Number(el.dataset.v) || 0));
    save(); haptic(14);
    if (view === 'count') renderHead(); else renderSplit();
  },
  headsStep: el => {
    S.session.heads = Math.max(0, Math.min(99, headCount() + Number(el.dataset.v)));
    save(); haptic(10);
    if (view === 'count') renderHead(); else renderSplit();
  },
  goSplit: () => setView('split'),
  goCount: () => setView('count'),
  /* Лог дээр нэр дарахад дараагийн хүн болно — модалгүй, нэг товшилт */
  cyclePerson: el => {
    const it = items().find(i => i.id === el.dataset.id);
    if (!it) return;
    const order = [null].concat(S.people.map(p => p.id));
    const nx = order[(order.indexOf(it.personId || null) + 1) % order.length];
    it.personId = nx;
    it.personName = nx ? ((personById(nx) || {}).name || null) : null;
    save(); haptic(10);
    renderLog(); renderTotalbar();
  },

  /* place */
  editPlace: () => sheetPlace(),
  savePlace: () => {
    S.session.place = (($('#plName') && $('#plName').value) || '').trim().slice(0, 40);
    save(); closeSheet(); refresh();
  },

  /* menu editing */
  editDrink: el => sheetEditDrink(el.dataset.id, true),   /* «Дараах →»-ээр бусдыг ч засна */
  newDrink: () => sheetEditDrink(null),
  pickEmoji: el => {
    if (!sheetCtx || !sheetCtx.drink) return;
    sheetCtx.drink.emoji = el.dataset.v;
    $$('#emoRow button').forEach(b => b.classList.toggle('is-on', b === el));
    haptic(8);
  },
  quickName: el => {
    if (!sheetCtx || !sheetCtx.drink) return;
    const inp = $('#dName'); if (inp) inp.value = el.dataset.v;
    sheetCtx.drink.emoji = el.dataset.e;
    $$('.quick button').forEach(b => b.classList.toggle('is-on', b === el));
    $$('#emoRow button').forEach(b => b.classList.toggle('is-on', b.dataset.v === el.dataset.e));
    haptic(10);
  },
  padKey: el => {
    if (!sheetCtx) return;
    const k = el.dataset.k;
    let s = sheetCtx.priceStr || '';
    if (k === 'del') { sheetCtx.padFresh = false; s = s.slice(0, -1); }
    else {
      if (sheetCtx.padFresh) { s = ''; sheetCtx.padFresh = false; }
      s = (s + k).replace(/^0+(?=\d)/, '').slice(0, 9);
    }
    sheetCtx.priceStr = s;
    const v = $('#padVal'); if (v) v.textContent = priceTxt(Number(s) || 0);
    haptic(7);
  },
  saveDrink: () => {
    if (!commitDrink()) return;
    closeSheet(); refresh();
  },
  nextDrink: () => {
    if (!sheetCtx || !commitDrink()) return;
    const cur = sheetCtx.drink.id;
    const nx = S.menu[S.menu.findIndex(x => x.id === cur) + 1];
    refresh();
    if (nx) { haptic(10); sheetEditDrink(nx.id, true); }
    else { closeSheet(); refresh(); toast('✅ Үнэ бүгд тохирлоо'); }
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
  if (id === 'pAdd') { ACT.addPersonName(); return; }   /* Enter → шууд нэмнэ */
  if (id === 'pName') ACT.savePerson();
  else if (id === 'plName') ACT.savePlace();
  else if (id === 'dName') e.target.blur();   /* үнийг keypad-аар бичнэ */
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
  $('#metaTheme').setAttribute('content', light ? '#FBF8F3' : '#0B0A09');
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
