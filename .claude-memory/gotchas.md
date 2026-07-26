# Gotchas — tooluur

## G-001 · Session эхлэхэд `.env` БА `ARCHITECTURE 2.md`-г уншина
Хэрэглэгч «уншаарай» гэж хэлсэн байхад Claude «үзэлгүй өнгөрөөрэй» гэж буруу
ойлгож, стандартын доктой танилцахгүйгээр vanilla JS-ээр бүтэн апп бариад
дараа нь зөрчил гарсан. **Ажил эхлэхээс өмнө `.claude-memory/` + `ARCHITECTURE 2.md`
уншина.**

## G-002 · Pages workflow-д бүтэн фолдерыг upload хийж болохгүй
`actions/upload-pages-artifact@v3` дээр `path: .` гэвэл `.env` хамт public сайт руу
гарна (`tooluur.website/.env` гэж хэн ч татна). Тиймээс `pages.yml` нь хэрэгтэй
файлыг **нэрээр нь** `_site/` руу хуулдаг allowlist хэлбэрээр бичигдсэн.

## G-003 · `pkill -f "http.server 8731"` нь өөрийгөө устгана
Bash-ийн командын мөрөнд тэр текст байгаа тул `pkill -f` нь ажиллаж байгаа
shell-ээ өөрөө таарч алж, exit 144 буцаасан. `pkill -f 'http[.]server 87'` шиг
bracket хийж бич.

## G-004 · Firefox snap дээр headless screenshot ажиллахгүй
`firefox --headless --screenshot out.png URL` нь exit 0 буцаагаад файл үүсгэдэггүй
(snap mount namespace / confinement). Fresh profile-тай оролдоход мөн л зогсдог.
Layout-ыг харах бол гараар хөтөч дээр нээх.

## G-005 · `gjs`-ээр browser JS-ийг тестлэх боломжтой
Node суугаагүй ч `gjs` (SpiderMonkey) байдаг. `document`/`localStorage`/`navigator`
stub бичээд `new Function(SHIM + APP + TESTS)()` гэж ажиллуулбал `app.js`-ийн бүх
логикийг тестэлж болно. `document.addEventListener`-ийг барьж авбал синтетик
click dispatch хийж бодит tap flow-г турших боломжтой.
Скрипт: `scratchpad/smoke.js`.

## G-006 · `.tile__count` нь товчийг хааж байсан
Хавтангийн тоо (`span`) нь `.tile__add` товчны дээр absolute байрладаг тул
`pointer-events:none` тавихгүй бол дээд-баруун булан дарахад юу ч болдоггүй.

## G-007 · Sheet дотор menu объектыг шууд засаж болохгүй
`S.menu.find(...)`-ыг шууд өгвөл emoji/нэр сонгосон даруйд memory дээр
өөрчлөгдөж, sheet-ийг цуцалсан ч дараагийн `save()` дээр хадгалагдана.
`clone(orig)` дээр ажиллаад `saveDrink`-д `Object.assign` хийнэ.

## G-008 · Long-press дараах гэнэтийн click
Long-press нь sheet онгойлгосны дараа `pointerup` дээр click үүсээд дараагийн
товшилтыг залгидаг. `suppressClick` flag-ыг **дараагийн `pointerdown`-д
capture phase-д** тэглэж шийдсэн.

## G-009 · `color-mix()` хуучин Safari-д ажиллахгүй
`background:color-mix(...)` invalid бол declaration унаж, appbar/tabbar
**бүрэн тунгалаг** болно. Тэр бүрийн өмнө хатуу өнгөөр fallback declaration бичсэн.

## G-010 · Mongolian-д `toLocaleTimeString('mn-MN')` тогтворгүй
Платформоос хамаарч 12/24 цаг, формат зөрдөг. `pad2(getHours())` гэж гараар
бичсэн. Тоог `Intl`-ээр бус `replace(/\B(?=(\d{3})+(?!\d))/g, ',')`-аар форматласан.
