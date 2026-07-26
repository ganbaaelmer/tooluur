# Schema — tooluur

**Одоогийн байдал: PostgreSQL БАЙХГҮЙ.** Backend байхгүй (`decisions.md` D-001/D-003).
Бүх state нь хөтчийн `localStorage`-д, нэг key дор:

    localStorage['tooluur.v1']  →  JSON

Хувилбар key-ийн нэрэнд шигтгэгдсэн (`.v1`). Бүтэц солих бол `app.js`-ийн
`normalize()`-д хөрвүүлэлт нэмнэ — хуучин датаг эвдэхгүйн тулд.

## Root

| Талбар | Төрөл | Тайлбар |
|---|---|---|
| `v` | `1` | schema version |
| `menu` | `Drink[]` | цэс (үнэ засагддаг) |
| `people` | `Person[]` | суулт хооронд үлддэг найзууд |
| `activePerson` | `string \| null` | `null` = «Хамт» |
| `session` | `Session` | одоогийн суулт |
| `archive` | `Session[]` | хаагдсан суултууд, шинэ нь эхэндээ, max 60 |
| `settings` | `Settings` | `{theme:'dark'\|'light'\|'auto', haptics:bool, hintDone:bool}` |

## Drink
`{ id, emoji, name, price:number, color }` — `id` нь `uid()` эсвэл default slug
(`draft`, `bottle`, `shot`, `cocktail`, `wine`, `whisky`, `soft`, `water`, `snack`).

## Session
`{ id, startedAt:ms, endedAt?:ms, place:string, items:Item[], claimed:number,
   splitShared:boolean, people?:Person[] }`

- `claimed` — барын бичсэн дүн (0 = оруулаагүй). Зөрүү = `claimed - Σ items.price`.
- `splitShared` — хамтын юмыг хүн тоогоор тэнцүү хуваах эсэх.
- `people` зөвхөн `archive`-д — хаах үеийн snapshot.

## Item  ⚠️ append-only баримт
`{ id, ts:ms, drinkId, name, emoji, price:number, color,
   personId:string|null, personName:string|null }`

**Нэг товшилт = нэг Item.** `qty` талбар байхгүй — тоо нь Item-уудыг group хийж
гардаг. `name`/`emoji`/`price` нь бүртгэгдэх үеийн хуулбар (D-005): цэсний үнэ
дараа сольсон ч түүх хөдлөхгүй. **`price`-ыг эргүүлж бичихгүй.**
`personId` нь `null` бол «Хамтын».

## Person
`{ id, name }` — устгахад түүний Item-ууд `personId=null` (хамтын) болж хувирна,
дүн алдагдахгүй.

## Хэрэв backend нэмэх бол (хийгдээгүй)
`sessions` (1) → `items` (N) → `people` (N:M) гэсэн 3 table хүрэлцэнэ.
`items` дээр `session_id` FK + index, `created_at`/`updated_at` `server_default=func.now()`.
Многотөхөөрөмжийн sync хийхэд `items.id` нь client-ээс гаралтай ID байх тул
INSERT биш **UPSERT** (стандартын дүрэм) — idempotency өөрөө шийдэгдэнэ.
