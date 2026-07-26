# Project: <NER>

## Зорилго
<1-2 өгүүлбэрээр төслийн зорилго>

## Архитектур (ерөнхий)
- **Backend ба Frontend бүрэн тусдаа** — тусдаа folder, тусдаа container, тусдаа build pipeline
- Backend: FastAPI REST API (`/api/v1/...`) — зөвхөн JSON, template render ХИЙХГҮЙ
- Frontend: React SPA — backend-тэй зөвхөн HTTP API-аар харилцана
- Хоёр талын гэрээ = **OpenAPI schema** (FastAPI-ийн `/openapi.json` нь single source of truth)

## Tech Stack (заавал)

### Backend
- Python 3.12+, type hints бүх кодод
- FastAPI (async/await бүх I/O route), Pydantic BaseSettings
- Polars (Pandas зөвхөн ML шаардсан үед)
- PostgreSQL + SQLAlchemy 2.0 (async) + Alembic
- Apache Airflow (хэрэв ETL/orchestration байгаа бол)
- MLflow autolog + Model Registry (хэрэв ML байгаа бол)
- Redis (cache / rate limit / background queue)
- pytest (unit + integration + E2E)
- ruff (lint + format), mypy (strict)

### Frontend
- React 18+ + **TypeScript (strict mode)** + Vite
- Tailwind CSS (styling)
- **TanStack Query** (server state — бүх API дуудлага үүгээр, `useEffect`+`fetch` ХОРИОТОЙ)
- Zustand (client state — зөвхөн UI state, server data-г давхардуулж хадгалахгүй)
- React Router (routing)
- **sonner** (toast notification — доорх Notification хэсгийг үз)
- react-hook-form + zod (form + validation; zod schema = OpenAPI-тай нийцсэн)
- ESLint + Prettier, Vitest + React Testing Library, Playwright (E2E)
- Production-д Nginx-ээр serve (тусдаа container)

### Common
- Docker + docker-compose (бүх services контейнержсэн)

## Заавал дагах дүрэм
- **Database = single source of truth.** Аливаа state (config, cache, in-memory dict, JSON file) DB-г давхардуулж, эсвэл орлож болохгүй. Үнэн зөв нь зөвхөн DB-д байна.
- Secrets зөвхөн .env-ээс, hardcode ХОРИОТОЙ
- DB-д INSERT биш **UPSERT** (idempotency)
- `print` биш `logging` (DEBUG/INFO/WARNING/ERROR)
- API route-ууд `/api/v1/...`, `/health` endpoint заавал
- CORS `["*"]` production-д ХОРИОТОЙ
- Multi-stage Dockerfile, `.dockerignore` заавал
- ML: `random_state=42`, sklearn `Pipeline`, MLflow log бүх run-д
- Airflow: `catchup=False`, heavy import зөвхөн task дотор, top-level код DB/API дуудаж болохгүй

## Frontend (React) дүрэм
- **Feature-based folder structure** (`features/<feature>/{components,hooks,api,types}.ts`) — type-based (`components/`, `hooks/` гэж бүгдийг овоолох) ХОРИОТОЙ
- **API client нэг газар**: `lib/api-client.ts` — base URL, auth header, error handling бүгд энд. Component дотор шууд `fetch`/`axios` ХОРИОТОЙ
- API type-уудыг `openapi-typescript`-ээр `/openapi.json`-оос generate хий — гараар давхар бичихгүй
- Env config зөвхөн `VITE_`-prefix (`import.meta.env.VITE_API_URL`) — secret frontend-д ХЭЗЭЭ Ч байрлахгүй (bundle-д ил гардаг)
- **Error Boundary** root болон feature түвшинд — цагаан дэлгэц (white screen) гаргахгүй, fallback UI + "Дахин оролдох" товч
- Бүх async үйлдэлд 3 төлөв заавал: **loading** (skeleton/spinner), **error** (toast + inline), **empty** (хоосон үед тайлбартай placeholder)
- Auth token: httpOnly cookie (илүү аюулгүй) эсвэл memory — `localStorage`-д access token ХОРИОТОЙ (XSS)
- Route-based code splitting (`React.lazy` + `Suspense`)
- Accessibility: семантик HTML, товч бүр `aria-label`, keyboard navigation ажилладаг байх
- Component 200 мөрөөс урт бол задал; business logic-ийг custom hook руу гарга

## Notification / Toast (заавал)
Системд ямар нэгэн үйл явдал (амжилт, алдаа, анхааруулга) болоход хэрэглэгчид **дэлгэрэнгүй текстээр, өнгөөр ялгасан toast** заавал харуулна. Сан: **sonner** (`<Toaster richColors position="top-right" />` root-д нэг удаа).

### Өнгө / төрөл
| Төрөл | Функц | Өнгө | Хэрэглээ |
|---|---|---|---|
| Амжилт | `toast.success()` | ногоон | Хадгалах, устгах, илгээх амжилттай |
| Алдаа | `toast.error()` | улаан | API 4xx/5xx, validation, network алдаа |
| Анхааруулга | `toast.warning()` | шар | Эрсдэлтэй үйлдэл, хугацаа дуусах гэх мэт |
| Мэдээлэл | `toast.info()` | цэнхэр | Background ажил эхэлсэн/дууссан гэх мэт |
| Хүлээлт | `toast.promise()` | — | Удаан үйлдэлд loading → success/error автоматаар |

### Агуулгын дүрэм
- **Title + description хоёулаа заавал**: title = юу болсон (богино), description = яагаад + одоо юу хийх
  ```ts
  toast.error("Захиалга хадгалагдсангүй", {
    description: "Сервертэй холбогдож чадсангүй (timeout). Интернэтээ шалгаад дахин оролдоно уу.",
    action: { label: "Дахин оролдох", onClick: () => retry() },
  });
  ```
- Алдааны toast-д **request ID** (`X-Request-ID`) хавсарга — support/debug-д хэрэгтэй
- "Алдаа гарлаа" гэх мэт ерөнхий текст ХОРИОТОЙ — backend-ийн error response-оос тодорхой шалтгааныг харуул
- Backend error format стандарт: `{ "error": { "code": "...", "message": "...", "request_id": "..." } }` — frontend үүнийг шууд toast-д ашиглана
- API client-ийн нэг interceptor дээр бүх алдааг барьж toast харуул — component бүрт давтахгүй
- Duration: success 4s, error 8s (эсвэл гараар хаах), устгах үйлдэлд `action`-тай undo toast
- Toast spam болохоос сэргийл: ижил алдааг dedupe (sonner `id` параметр), success toast зөвхөн хэрэглэгчийн эхлүүлсэн үйлдэлд
- Form validation алдааг toast-оор БИШ inline (талбарын доор) харуул — toast зөвхөн submit бүхэлдээ бүтэлгүйтсэн үед

## Observability (заавал)
- **Structured JSON logging** (`structlog` эсвэл `python-json-logger`)
- Бүх request-д `X-Request-ID` header → log-д correlation ID болгож хавсаргана
- Prometheus metrics endpoint `/metrics` (FastAPI: `prometheus-fastapi-instrumentator`)
- OpenTelemetry tracing (хэрэв distributed system бол)
- Sentry (эсвэл ижил төстэй) production алдааг хүлээж авна — `SENTRY_DSN` .env-д
- Slow query log: 500ms-аас удаан SQL-ийг WARNING түвшинд лог

## Security (заавал)
- Auth: JWT (short-lived access + refresh) эсвэл OAuth2; route-уудад `Depends(get_current_user)`
- Rate limiting: `slowapi` эсвэл Redis-ээр (login, public endpoint-д заавал)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`
- CORS: тодорхой origin жагсаалт (production-д `["*"]` ХОРИОТОЙ)
- Pydantic-аар бүх input validate — raw `request.json()` шууд DB руу ХОРИОТОЙ
- SQL зөвхөн SQLAlchemy ORM эсвэл parameterized query — string concat ХОРИОТОЙ
- Dependency scan: `pip-audit` эсвэл `safety` CI-д
- Container: `USER appuser` (root биш), minimal base image (`python:3.12-slim`)
- `.env` git-д commit ХОРИОТОЙ — `.env.example` placeholder-тэй committed
- Password: `argon2` эсвэл `bcrypt`, plain text ХОРИОТОЙ

## Reliability
- **Liveness** (`/health`) ба **readiness** (`/ready` — DB/Redis ping шалгана) тусад нь
- Graceful shutdown: SIGTERM-д in-flight request дуустал хүлээнэ (FastAPI `lifespan`)
- DB connection pool: `pool_size`, `max_overflow`, `pool_pre_ping=True`, `pool_recycle=3600`
- External API call: `tenacity`-ээр retry (exponential backoff + jitter), timeout заавал
- Idempotency key: write endpoint-уудад дэмжинэ
- Background task: Celery/ARQ/Dramatiq — long-running ажлыг request-ээс гадуур

## Performance
- Pagination бүх list endpoint-д (`limit` + `cursor`, эсвэл `offset` зөвхөн жижиг table-д)
- N+1 query-ээс зайлс: `selectinload` / `joinedload`
- Cache: Redis-д TTL-тэй (cache invalidation стратегитай)
- Том response-д gzip middleware
- Polars memory: lazy frame (`scan_csv` / `scan_parquet`) том dataset-д

## Database (PostgreSQL)
- Alembic migration бүх schema өөрчлөлтөд — `autogenerate` дараа ХҮНЭЭР шалга
- Migration файлд `downgrade()` бичнэ
- Index: foreign key, frequently-filtered column-д заавал
- `created_at` / `updated_at` timestamp бүх table-д (`server_default=func.now()`)
- Soft delete `deleted_at` (хэрэв шаардлагатай бол) — hard delete-ийн оронд
- Backup стратеги README-д тэмдэглэгдсэн (pg_dump cron / WAL archiving)
- Connection string зөвхөн `asyncpg` driver-тэй

## Docker дүрэм
- **Rebuild болгонд хуучин image-ийг ЗААВАЛ устгана.** Жишээ:
```bash
  docker compose down --rmi local --remove-orphans
  docker compose build --no-cache
  docker image prune -f
```
- One-off контейнер дандаа `--rm` flag-тай
- Build дууссаны дараа `docker system prune -f`
- Multi-stage build, `.dockerignore`-оор image хөнгөн байлга
- `HEALTHCHECK` instruction Dockerfile-д заавал
- Non-root user (`USER appuser`)
- Pin base image version (`python:3.12.7-slim`, `latest` ХОРИОТОЙ)
- `docker-compose.yml`-д `restart: unless-stopped`, `depends_on` healthcheck-тэй

## Error handling
- Global exception handler — бүх unhandled exception JSON response буцаана
- Custom exception class hierarchy (`AppException` → `NotFoundError`, `ValidationError` гэх мэт)
- 4xx vs 5xx ялгаж лог (client алдаа INFO, server алдаа ERROR)
- Stack trace production response-д ОРУУЛАХГҮЙ — зөвхөн log-д
- Request body том алдаанд лог-д бүү бичих (PII)

## CI/CD (заавал)
- `.pre-commit-config.yaml`: ruff, mypy, detect-secrets, end-of-file-fixer
- GitHub Actions (эсвэл GitLab CI) — backend/frontend тусдаа job (path filter-тэй):
  - Backend: ruff → mypy → pytest → build image → push registry → deploy
  - Frontend: eslint → `tsc --noEmit` → vitest → playwright → build image → push → deploy
  - PR-д бүх тест ажиллана
  - `main` branch протекшэнтэй, шууд push ХОРИОТОЙ
- Semantic versioning, `CHANGELOG.md` хөтлөгдсөн
- Docker image registry-д tag-тай push (`v1.2.3`, `latest` биш)

## Testing
- Coverage **>80%** core логикт
- pytest: unit + integration + E2E тусад нь folder-т
- `pytest-asyncio` async test-д
- DB тест: `testcontainers-postgres` эсвэл tmp DB — production DB ХӨНДӨЖ БОЛОХГҮЙ
- FastAPI: `TestClient` / `httpx.AsyncClient`
- Airflow DAG: import test + structure test
- ML: data schema, output shape, prediction range, edge case
- Snapshot test том response-д
- Frontend: Vitest + React Testing Library (component/hook), Playwright (E2E — гол user flow бүрд)
- Frontend E2E-д toast харагдаж байгааг шалгах assertion оруул (амжилт/алдааны scenario хоёулаа)
- API contract: frontend-ийн generated types backend-ийн `/openapi.json`-тэй зөрөхгүй байх CI шалгалт

## Memory (.claude-memory/)
- Repo root-д `.claude-memory/` folder үүсгэ
- Session бүрийн төгсгөлд дараах файлуудыг шинэчилж явна:
  - `decisions.md` — гаргасан архитектурын шийдвэр, шалтгаан
  - `progress.md` — юу хийгдсэн, юу үлдсэн, дараагийн алхам
  - `gotchas.md` — таарсан bug, шийдэл, дахин таарвал зайлсхийх зүйлс
  - `schema.md` — DB schema-ийн одоогийн төлөв
- `.gitignore`-д **бүү ор** — багт хуваалцана
- Шинэ session эхлэхэд эхлээд `.claude-memory/`-г уншиж context аваад дараа нь ажил эхэл

## Folder layout (monorepo: backend + frontend тусдаа)
```
project/
├── .claude-memory/
│   ├── decisions.md
│   ├── progress.md
│   ├── gotchas.md
│   └── schema.md
├── .github/workflows/{ci.yml,deploy.yml}
├── backend/
│   ├── src/<pkg>/
│   │   ├── api/v1/<feature>/{router,schemas,models,service}.py
│   │   ├── core/{config,logging,db,security,exceptions}.py
│   │   ├── middleware/{request_id,metrics,error_handler}.py
│   │   └── main.py
│   ├── tests/{unit,integration,e2e}/
│   ├── alembic/versions/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── .env.example
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── features/<feature>/{components,hooks,api,types}/
│   │   ├── components/ui/          # shared UI (Button, Toast wrapper г.м.)
│   │   ├── lib/{api-client,query-client,utils}.ts
│   │   ├── types/api.generated.ts  # openapi-typescript output
│   │   ├── routes/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/                      # Vitest + RTL
│   ├── e2e/                        # Playwright
│   ├── Dockerfile                  # multi-stage: node build → nginx serve
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── .dockerignore
├── scripts/{backup.sh,migrate.sh}
├── docker-compose.yml
├── docker-compose.prod.yml
├── .pre-commit-config.yaml
├── CHANGELOG.md
└── README.md
```
- `docker-compose.yml`-д `backend`, `frontend`, `db`, `redis` тусдаа service
- Dev горимд Vite dev server → `VITE_API_URL`-аар backend руу; production-д Nginx static serve + `/api` reverse proxy

## Pre-deploy checklist
Production deploy-аас өмнө дараах зүйлсийг ЗААВАЛ шалгана:
- [ ] Бүх тест ногоон (lint + type + unit + integration + E2E)
- [ ] `.env.example` шинэ хувьсагчдын хамт шинэчлэгдсэн
- [ ] Alembic migration ажиллаж байгаа, `downgrade()` шалгасан
- [ ] `/health`, `/ready`, `/metrics` хариу буцааж байгаа
- [ ] Rate limit, CORS, security header идэвхтэй
- [ ] Sentry DSN суусан, лог JSON форматтай
- [ ] Container non-root user-тэй ажиллаж байгаа
- [ ] `pip-audit` + `npm audit` алдаагүй
- [ ] DB backup график тохируулагдсан
- [ ] Frontend production build (`vite build`) амжилттай, bundle size шалгасан
- [ ] `VITE_API_URL` production утгатай, frontend-д secret алга
- [ ] Toast notification амжилт/алдаа/анхааруулгын scenario-д зөв өнгө, дэлгэрэнгүй текстээр гарч байгаа
- [ ] Error Boundary ажиллаж байгаа (санаатай алдаа хаяж шалгасан)
- [ ] README-д run/deploy/troubleshoot заавар

## Workflow
1. Эхлээд `.claude-memory/`-г уншина (хэрэв байгаа бол)
2. Бүтэн folder layout болон боловсорхой файлуудыг үүсгэ
3. `pyproject.toml`, `package.json`, Dockerfile-ууд, `docker-compose.yml`, `.env.example`-ууд, `.pre-commit-config.yaml` эхэнд бэлдэ
4. Backend `core/` (config, logging, db, security, exceptions) + frontend `lib/` (api-client, query-client, Toaster setup) дараагаар нь
5. Нэг feature-ийг бүтэн vertical slice-аар (backend router → schema → service → test → frontend feature → test) дуусгаад дараагийнх руу ор
6. Үе шат бүрд би шалгах хүртэл commit бүү хий
7. Session төгсгөлд `.claude-memory/`-г шинэчил
8. Тодорхой биш зүйл байвал асуу, өөрөө битгий тааж бод

## Хязгаарлалт
- Pandas ашиглах гэж байгаа бол шалтгааныг тайлбарлаж зөвшөөрөл асуу
- Шинэ dependency нэмэх бол яагаад гэдгийг тайлбарла
- DB-ийн оронд in-memory cache/JSON ашиглах гэж байгаа бол ЗААВАЛ асуу
- Security/auth логик бичих бол алхам тус бүрд асуу
- Миний preferences-тэй зөрчилдөх шийдвэр гаргах болж байвал ЗААВАЛ асуу

Эхлээд `.claude-memory/`-г шалгаад, folder layout-аа харуулаад дараа нь файлаар явъя.