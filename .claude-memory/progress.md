# Progress — tooluur

Сүүлд шинэчилсэн: **2026-07-26**

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

**Тест:** `gjs`-ээр DOM stub хийж app.js-ийг ажиллуулсан **83/83 өнгөрсөн**
(тоолох/undo/toast-restore/хуваалт/зөрүү/localStorage round-trip/эвдэрсэн дата/
sheet цуцлах/суулт хаах). 34 `data-act` бүрт handler байгаа cross-check хийсэн.

## Дуусаагүй / шалгагдаагүй ⏳

- **Хөтөч дээр нүдээрээ шалгаагүй** — Firefox нь snap учраас headless screenshot
  ажиллаагүй. Layout-ыг зөвхөн CSS-ээр нь дүгнэсэн. `python3 -m http.server 8000`
  гэж нэг хараах шаардлагатай.
- **Deploy хийгдээгүй** — git repo хүртэл init хийгдээгүй. Namecheap DNS одоо
  parkingpage + URL redirect дээр байгаа (README-д яг юу солихыг бичсэн).
- **Стандартын зөрчил шийдэгдээгүй** — `decisions.md`-ийн D-003, D-004-ыг үз.

## Дараагийн алхам

1. ⏳ **Хэрэглэгчийн шийдвэр:** vanilla үлдэх / React+TS+Vite+Tailwind руу шилжих /
   бүтэн FastAPI+Postgres stack (жинхэнэ backend hosting шаардана).
2. Secret rotate: `.env` дотор байсан `ghp_…` token + sudo пароль.
3. Repo үүсгэж push, Pages залгах, Namecheap DNS солих, Enforce HTTPS.
4. Цэсний default үнийг бодит барын үнээр тааруулах (одоогийнх нь таамаг).
