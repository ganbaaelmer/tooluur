# 🍺 Тооцоо — «Би хэдэн шил авсан бэ?»

Бар, пабд **юу, хэдийг, хэдэн цагт** авснаа гар утсан дээрээ нэг товшилтоор бүртгэдэг апп.
Тооцоо гаргах үед барын бичсэн дүнтэй тулгаж, **зөрүүг шууд харуулна**.

**Backend байхгүй. Нэвтрэх байхгүй. Дата зөвхөн таны утсан дээр.**
GitHub Pages дээр статикаар ажиллана, интернетгүй ч ажиллана (PWA).

👉 <https://tooluur.website>

---

## Яагаад ийм байдлаар зохиогдсон

Гол хэрэглэгч бол **согтуу хүн**. Тиймээс:

| Шийдвэр | Шалтгаан |
|---|---|
| Нэг товшилт = нэг бүртгэл | «Хэд авсан?» гэж хэзээ ч асуухгүй. Тоо оруулах talbar байхгүй. |
| Хавтан 175×118px | Согтуу хуруу онохын тулд. Apple-ийн 44px хамгийн бага хэмжээнээс 4 дахин том. |
| Харанхуй өнгө default | Бар харанхуй байдаг. Цайвар дэлгэц нүд өвтгөнө. |
| **Буцаах** товч доор үргэлж харагдана | Санамсаргүй дарсныг 1 товшилтоор буцаана. |
| Устгах бүрт «Буцаах» toast | Ямар ч үйлдэл эргэж болно. |
| Тэглэх/хаах = **удаан дарж** баталгаажуулах | Халаасанд, эсвэл согтуу гар санамсаргүй дарж устгахгүй. |
| Swipe/gesture байхгүй | Согтуу үед swipe хийхэд хэцүү. Зөвхөн том товч. |
| Бүртгэл бүр **цаг хугацаатай** | Барын тооцоотой тулгах үед энэ л хүчинтэй баримт. |
| Бүртгэсэн үеийн үнээ хадгална | Дараа цэсний үнэ солиход өмнөх түүх бузарлагдахгүй. |
| Login байхгүй | Согтуу хүн нэр/пароль оруулахгүй. Дата утсанд байх нь хамгийн хурдан. |

## Хэрхэн хэрэглэх (барандаа)

1. **Ороод** дээд талд газрын нэрээ бич (сонголттой).
2. Зөөгч юм тавих **болгонд** тэр хавтныг нэг дар. Болоо.
3. Найзуудаараа хуваах бол `＋ Хүн` дарж нэр нэмээд, юм нэмэхийн өмнө хэн болохыг сонго.
   Хэнийг ч сонгоогүй бол «Хамт» гэж бүртгэгдэнэ.
4. Тооцоо ирэхэд **Хуваах** таб → *Барын бичсэн дүн*-г оруул → зөрүү шууд гарна.
5. Зөрүү гарвал **Лог** таб дээрх цагийн бүртгэлээ харуул: `21:14 🍺 Драфт пиво 12,000₮`.
6. Гэртээ харих үед **Хуваах → Тооцоог найзууддаа илгээх** дарж Messenger-ээр тарааж болно.
7. Суулт дуусахад **Суултыг хааж түүхэнд хадгалах** — маргааш нь харж болно.

Нэмэлт:
- Хавтан дээр **удаан дарвал** тэр юмны нэр/үнийг засна.
- Цэс → **Апп болгож утсандаа хийх** дарвал home screen дээр гарч, интернетгүй ажиллана.
- Цэс → **Бүх датаг файлаар татах** — нөөцлөх, өөр утас руу зөөх.

---

## GitHub Pages дээр гаргах

### 1. Repo үүсгэж push хийх

```bash
cd ~/tooluur
git init -b main
git add .                 # .gitignore-ийн ачаар .env ОРОХГҮЙ
git commit -m "Тооцоо: bar tally PWA"
git remote add origin https://github.com/<ТАНЫ-USER>/tooluur.git
git push -u origin main
```

> ⚠️ **`.env` файлыг хэзээ ч commit хийж болохгүй.** GitHub Pages бол нээлттэй сайт —
> commit хийсэн бол хэн ч `tooluur.website/.env` гэж татаж авах боломжтой болно.
> `.gitignore` үүнийг хааж байгаа. Хэрэв санамсаргүй push хийвэл дотор байсан
> бүх key-г **дарууй солих** хэрэгтэй (git history-с устгасан ч хуулбар үлддэг).

### 2. Pages-ыг залгах

**Settings → Pages → Build and deployment → Source: `Deploy from a branch`
→ Branch: `main`, folder: `/ (root)`**

Push хийх болгонд GitHub өөрөө шинэчилнэ. `.nojekyll` болон `CNAME` root-д
байгаа тул нэмэлт тохиргоо шаардахгүй.

<details>
<summary><b>GitHub Actions-аар deploy болгох (зөвлөж байна, token шинэчилсний дараа)</b></summary>

Branch deploy нь repo-д байгаа **бүх** файлыг web-д гаргадаг
(`tooluur.website/ARCHITECTURE%202.md` гэх мэт). Actions-аар deploy хийвэл
зөвхөн сайтын файл л гарна — илүү цэвэр, санамсаргүй leak-ээс хамгаална.

Үүнд `workflow` scope-той token хэрэгтэй (classic PAT-д `repo` дээр нэмж
`workflow` шалгана). Token шинэчлэхдээ тэрийг сонгоод:

```bash
mkdir -p .github/workflows
cp deploy/pages-workflow.yml.example .github/workflows/pages.yml
git add .github/workflows/pages.yml
git commit -m "ci: Pages deploy workflow"
git push
```

Дараа нь **Settings → Pages → Source: `GitHub Actions`** болгож сольвол болно.
(Эсвэл GitHub web UI-гаас `.github/workflows/pages.yml` файлыг шууд үүсгэж
болно — web UI-д token scope хамаарахгүй.)
</details>

### 3. Домэйн: `tooluur.website` (Namecheap)

**Namecheap → Domain List → tooluur.website → Advanced DNS**

**Устга** (одоо байгаа хоёр бичлэг GitHub-тай зөрчилдөнө):

| Type | Host | Value |
|---|---|---|
| ~~URL Redirect Record~~ | ~~@~~ | ~~http://www.tooluur.website/~~ |
| ~~CNAME Record~~ | ~~www~~ | ~~parkingpage.namecheap.com.~~ |

**Нэмэ** — `ADD NEW RECORD`, TTL нь `Automatic`:

| Type | Host | Value |
|---|---|---|
| A Record | `@` | `185.199.108.153` |
| A Record | `@` | `185.199.109.153` |
| A Record | `@` | `185.199.110.153` |
| A Record | `@` | `185.199.111.153` |
| CNAME Record | `www` | `<ТАНЫ-USER>.github.io.` |

IPv6-г хүсвэл нэмэлтээр (сонголттой):

| Type | Host | Value |
|---|---|---|
| AAAA Record | `@` | `2606:50c0:8000::153` |
| AAAA Record | `@` | `2606:50c0:8001::153` |
| AAAA Record | `@` | `2606:50c0:8002::153` |
| AAAA Record | `@` | `2606:50c0:8003::153` |

### 4. GitHub дээр домэйнээ бүртгэх + SSL

1. **Settings → Pages → Custom domain** → `tooluur.website` → **Save**.
   (Repo-д `CNAME` файл аль хэдийн байгаа — GitHub үүнийг уншина.)
2. GitHub «DNS check in progress» гэж шалгана. Namecheap-ийн DNS тархахад
   **10–30 минут** (хааяа 1 цаг хүртэл) шаардана.
3. Шалгалт өнгөрөнгүүт GitHub **Let's Encrypt сертификатыг өөрөө** авна.
   Дараа нь **☑ Enforce HTTPS** товчийг дар — `http://` бүх хүсэлт `https://` болж хувирна.
4. Дууссан. `https://tooluur.website` болон `https://www.tooluur.website`
   (www нь apex руу автоматаар redirect болно) ажиллана.

**Шалгах:**

```bash
dig +short tooluur.website          # 4 GitHub IP гарах ёстой
dig +short www.tooluur.website      # <USER>.github.io гарах ёстой
```

**Хэрэв «Enforce HTTPS» сонгох боломжгүй бол:** Custom domain-ыг устгаад,
хадгалаад, дахин `tooluur.website` гэж бичээд Save дар — сертификат
шинээр гаргах процесс дахин эхэлнэ. DNS зөв тархсаны дараа хийх.

> Namecheap-ийн өөрийн PositiveSSL / Redirect-ыг **залгах шаардлагагүй**.
> Сертификатыг GitHub үнэгүй гаргаж, өөрөө шинэчилдэг.

**Домэйн хамгаалалт (сонголттой, зөвлөж байна):** GitHub → Settings → Pages →
Custom domain-ийн доор **Verify domain**. Тэндээс өгсөн `TXT` бичлэгийг
(`_github-pages-challenge-<USER>`) Namecheap-д нэмбэл, домэйныг өөр хүн
өөр repo-д залгах эрсдэл хаагдана.

---

## Локалд туршихад

```bash
cd ~/tooluur
python3 -m http.server 8000
# → http://localhost:8000
```

`localhost` дээр service worker болон PWA install ажиллана. LAN дээрх
өөр утаснаас `http://192.168.x.x:8000` гэж үзвэл апп ажиллах ч, HTTPS
биш учраас install/офлайн хэсэг ажиллахгүй — тэр хоёрыг бодит домэйн дээр турша.

## Файлын бүтэц

```
index.html               аппын бүтэн бүрхүүл (нэг хуудас, 4 таб)
app.css                  бүх стиль — dark/light, safe-area, native мэдрэмж
app.js                   бүх логик: state, render, undo, хуваалт, share
sw.js                    service worker — офлайн cache
manifest.webmanifest     PWA манифест (standalone, portrait)
icons/                   icon.svg + 192/512/180/maskable PNG
CNAME                    tooluur.website  ← GitHub Pages домэйн
.nojekyll                Jekyll-ийг хаана
deploy/                  Actions deploy workflow (бэлэн, залгахад л үлдсэн)
.claude-memory/          шийдвэр, progress, gotcha, schema (багт хуваалцана)
.env.example             .env-ийн placeholder — бодит .env commit ХИЙХГҮЙ
```

Dependency, build step, npm байхгүй. `index.html`-ийг хөтөч дээр нээхэд шууд ажиллана.

## Хөгжүүлэхэд анхаарах

- **Цэсний default үнэ** — `app.js`-ийн `DEFAULT_MENU` дотор. Одоогийн үнэ нь
  Улаанбаатарын дундаж **таамаг** учраас өөрсдийн барын үнээр тааруулж болно
  (эсвэл апп дотроос Цэс → үнэ дарж засна).
- **Дата бүтэц** нь `localStorage['tooluur.v1']`. Бүтцээ солих бол `normalize()`-д
  хөрвүүлэлт нэмэх — хуучин датаг эвдэхгүйн тулд.
- **`sw.js` дотрох `VERSION`**-ыг ямар нэг файл засах болгондоо ахиулбал
  хэрэглэгчид шинэ хувилбарыг шууд авна (эс тэгвэл дараагийн нэг удаагийн
  нээлтэд шинэчлэгдэнэ).
- Бүртгэлийн `price`-ыг **хэзээ ч эргүүлж бичиж болохгүй** — тэр нь баримтын
  үнэ цэнийг хамгаалж байгаа гол зарчим.
