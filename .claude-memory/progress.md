# Progress — tooluur

Сүүлд шинэчилсэн: **2026-07-26** · v1.1.0

## Хийгдсэн ✅

Бүрэн ажиллагаатай статик PWA (vanilla JS, dependency 0, build step 0):

| Файл | Тайлбар |
|---|---|
| `index.html` | 4 табтай нэг хуудас: Тоолох · Лог · Хуваах · Цэс |
| `app.css` | dark/light theme, safe-area, native мэдрэмж, hold-to-confirm |
| `app.js` | state, undo, хүнээр хуваалт, барын дүнтэй тулгалт, share, PWA |
| `sw.js` | офлайн cache (HTML network-first, asset SWR) |
| `manifest.webmanifest`, `icons/` | PWA манифест + 192/512/180/maskable icon (PIL-ээр generate) |
| `CNAME`, `.nojekyll` | `tooluur.website` |
| `.github/workflows/pages.yml` | Pages deploy — зөвхөн сайтын файлыг allowlist-ээр ачаална |
| `.gitignore`, `.env.example` | `.env` хамгаалалт |
| `README.md` | Хэрэглэх заавар + Namecheap DNS + GitHub SSL заавар |

**Функцүүд:** хавтан дарж тоолох · хүн тус бүрээр бүртгэх · хамтын юмыг тэнцүү хуваах ·
цаг хугацаат лог · барын дүнтэй тулгаж зөрүү харуулах · undo/restore хаа сайгүй ·
цэс/үнэ засах · суулт хааж түүхэнд хадгалах · Messenger-т share · JSON export/import ·
офлайн + home screen install.

### v1.1.0 — үнэ засахыг хялбарчилсан
- **✎ Үнэ засах режим** гридэн дээр + том keypad (58px товч, калькулятор шиг)
- **«Дараах →»** — бүх цэсний үнийг дараалуулж ~30 секундэд тохируулна
- **⚠️ Үнэ таамаг** анхааруулга — тааруулах хүртэл харагдана
- **＋ Шинэ төрөл** хавтан гридэн дээр + хурдан нэрс (Сэнгүр, Tiger, Heineken…)
- Үнэ 0 бол «—» — үнэ мэдэхгүй бол зөвхөн тоолж болно
- Hero (тооцоо хоосон үед) + `Developed with ♥ by Ganbaa` footer

**Тест:** `gjs`-ээр DOM stub хийж app.js-ийг ажиллуулсан **121/121 өнгөрсөн**
(тоолох/undo/toast-restore/хуваалт/зөрүү/localStorage round-trip/эвдэрсэн дата/
sheet цуцлах/суулт хаах/keypad/үнэ засах режим/дараалсан тохиргоо/шинэ төрөл/hero).
38 `data-act` бүрт handler байгаа, орхигдсон код үлдээгүйг cross-check хийсэн.

## Deploy ✅ — 2026-07-26-нд амьдарлаа

**Live: <https://tooluur.website>** · <https://github.com/ganbaaelmer/tooluur> (public)

| Юу | Төлөв |
|---|---|
| Repo + push | ✅ |
| Pages source | ✅ GitHub Actions (run #1 success) |
| Custom domain + A record × 4 | ✅ |
| SSL + Enforce HTTPS | ✅ `http://` → 301 `https://` |
| Дотоод файл web-д гарахгүй | ✅ `.env`, `ARCHITECTURE 2.md`, `.claude-memory/` → 404 |
| `CNAME www` | ⬜ **үлдсэн** — Namecheap-д `www → ganbaaelmer.github.io.` |

## Дуусаагүй / шалгагдаагүй ⏳

- **`CNAME www`** — Namecheap дээр нэмэх (README-д заавар).
- **Домэйн verification (TXT)** — сонголттой, домэйн хулгайлагдахаас хамгаална.
- **Хөтөч дээр нүдээрээ шалгаагүй** — Firefox нь snap учраас headless screenshot
  ажиллаагүй (`gotchas.md` G-004). Логик 121/121 тестээр батлагдсан ч layout-ыг
  бодит утсан дээр нэг харах шаардлагатай.
- **Цэсний default үнэ таамаг хэвээр** — гэхдээ одоо апп өөрөө анхааруулж, 30 секундэд тааруулдаг болсон (D-009).

## Дараагийн алхам

1. ⚠️ **Хуучин `ghp_…` token-ыг revoke хийх** (сессийн эхэнд `.env`-д plaintext
   байсан). Шинэ token нь `.env`-д `token2_ganbaagiin_gert` нэрээр байна.
2. `sudo_password`-ыг `.env`-с бүрмөсөн авах — системийн credential тэнд байрлах ёсгүй.
3. `CNAME www` нэмэх.
4. Барандаа нэг шөнө туршиж, хавтангийн хэмжээ/үнэ/дараалал таарч байгаа эсэхийг үзэх.
