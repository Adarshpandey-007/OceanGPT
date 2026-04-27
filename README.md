# FloatChat 🌊

Conversational Ocean Data Explorer MVP for ARGO float observations. This prototype demonstrates a unified chat + visualization interface (Map · Profile Plot · Table) backed by mock data and a lightweight intent router. It is architected to evolve into a full Retrieval-Augmented Generation (RAG) + NL2SQL platform using real NetCDF ingestion, PostgreSQL/PostGIS, and a vector store.

---
## ✨ Features (MVP)
- Landing page with animated wave aesthetic and feature highlights
- Chat panel with hint suggestions and intent classification (regex-based)
- Visualization workspace with three synchronized panels:
  - Map (Leaflet) – mock floats with popups
  - Plot (Plotly) – temperature & salinity vs depth (inverted axis)
  - Table – profile summaries (time, location, mean stats)
- Mock API routes: `/api/floats`, `/api/profiles`, `/api/query`
- Modular architecture prepared for future backend & RAG integration

---
## 🧭 Roadmap (Summary)
Lightweight snapshot. Full extended roadmap: `docs/roadmap-extended.md`.

| Phase | Name | Core Focus |
|-------|------|------------|
| MVP | Mock Explorer | Chat + basic visualization (done) |
| P1 | Cache Ingestion | Offline NetCDF -> JSON (partial) |
| P2 | Structured Storage | Postgres/PostGIS + loaders |
| P3 | Embeddings Layer | pgvector + profile summaries |
| P4 | Guarded NL2SQL | Safe SQL plan generation |
| P5 | RAG Answers | Retrieval + synthesis orchestration |
| P6 | Analytics Suite | Sections, anomalies, drift |
| P7 | Multi-Modal Fusion | Satellite overlays & tracks |
| P8 | Workspaces | Saved queries & pins |
| P9 | Public API | Token auth + usage metrics |

---
## 🏗 Architecture Overview

```
                ┌────────────────────┐
                │      User UI       │
                │  (Next.js / React) │
                └─────────┬──────────┘
                          │
                    Chat / Visual Tabs
                          │
                ┌─────────▼──────────┐
                │  API Routes (Mock) │
                │ /api/query         │
                │ /api/floats        │
                │ /api/profiles      │
                └─────────┬──────────┘
                          │ (Future real data path)
        ┌─────────────────▼──────────────────┐
        │   Python Ingestion Microservice    │
        │   - Download NetCDF (ARGO)         │
        │   - Parse w/ xarray                │
        │   - Normalize & QC                 │
        └─────────────────┬──────────────────┘
                          │
                ┌─────────▼──────────┐
                │ PostgreSQL/PostGIS │  <─── Spatial + relational
                └─────────┬──────────┘
                          │
                ┌─────────▼──────────┐
                │   Vector Store      │  <─── Embeddings (schema + profile summaries)
                └─────────┬──────────┘
                          │
                    ┌─────▼─────┐
                    │   RAG /   │  <─── NL2SQL + Retrieval + Synthesis
                    │  LLM Core │
                    └───────────┘
```

---
## 🗂 Data Model (Planned – Future Backend)

Relational tables:
- `floats(id, wmo_id, launch_date, last_observation, geom POINT, metadata_json)`
- `profiles(id, float_id, cycle_number, timestamp, latitude, longitude, position_geom, min_depth, max_depth, qc_status)`
- `measurements(id, profile_id, depth, temperature, salinity, oxygen, nitrate, chlorophyll, qc_flags)`
- `profile_stats(profile_id, mean_temp, mean_salinity, surface_temp, mixed_layer_depth)`
- `embeddings(object_type, object_id, embedding_vector, text)`

Indexes:
- GIST on geometry columns
- B-tree on timestamps
- Partial index on `qc_status='good'`

Vector summaries contain: location + time + variable ranges + derived stats.

---
## 🔍 Intent Classification (Current MVP)
Definition lives in `src/lib/intentRouter.ts`:
- Map intent: `/nearest|closest|map|location|where/`
- Plot intent: `/salinity|temperature|profile|depth|section/`
- Table intent: `/summary|table|list|stats|statistics/`
- Fallback: `unknown`

Extensible path:
1. Add lat/lon extraction (already stubbed)
2. Add fuzzy scoring / embeddings
3. Replace with LLM classifier via tool call

---
## 🚀 Quick Start

Prerequisites: Node 18+

```bash
git clone <repo-url>
cd FloatChat
cp .env.example .env.local
npm install
npm run dev
# open http://localhost:3000
```

Run tests:
```bash
npm test
```

Production build:
```bash
npm run build
npm start
```

---
## 🎤 Presentation Demo Runbook (15+ min)

### Pre-Demo Checklist
```bash
npm install
npm run lint
npm test -- --runInBand
npm run dev
```

Open these routes once before presenting:
- `/`
- `/app`
- `/upload`
- `/admin`
- `/about`

### Suggested Live Demo Flow
1. Introduce the landing page and architecture direction.
2. Go to `/app` and run a map-intent query: `nearest float at 12N 70W`.
3. Run a plot-intent query: `plot salinity profile`.
4. Switch to table view and show profile summary rows.
5. In Plot panel, switch to Real mode and load a known float ID (example: `5900001`).
6. Show `/admin` stats and close with roadmap highlights.

### Fallback Plan (If Real Data Fails)
- Use Mock mode in Plot panel and continue with `/api/profiles` data.
- Explain that real data path is cache-backed in current phase and DB integration is in progress.

### Demo Notes
- Keep one known working float ID ready.
- Avoid changing environment variables during the live demo.
- If map tiles are slow, continue using chart and table outputs first, then return to map.

---
## 🧪 Testing (Current & Planned)
Implemented:
- Intent router unit tests

Planned:
- Lat/lon extraction edge cases
- Component render smoke tests (ChatPanel, MapPanel)
- Data shape validation for future ingestion pipeline

---
## 📦 Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS + custom tokens |
| State | Zustand (chat + UI state) |
| Maps | react-leaflet + OpenStreetMap tiles |
| Charts | react-plotly.js |
| Testing | Jest + ts-jest |
| Future Backend | Python (xarray, FastAPI), Postgres/PostGIS, Chroma/FAISS |

---
## 🗄 Database Setup (PostgreSQL + PostGIS + pgvector)
An optional local database can now be started for upcoming ingestion & query features.

### Start Database
Requires Docker:
```
docker compose up -d db
```
Container exposes port `5433` → internal 5432.

### Environment
`.env.example` now includes:
```
DATABASE_URL=postgres://floatchat:floatchat_dev@localhost:5433/floatchat
```
Adjust credentials if you modified `docker-compose.yml`.

### Apply Migration
Simplest path (psql required):
```
psql "$DATABASE_URL" -f scripts/migrations/001_init.sql
```
This creates extensions (postgis, vector) and all tables / indexes.

### Verify
```
psql "$DATABASE_URL" -c "SELECT PostGIS_Version();"
psql "$DATABASE_URL" -c "\dt"   # list tables
```

### Node Connection Utility
`src/lib/db.ts` exports `query()` using `pg` Pool. Example usage inside an API route:
```ts
import { query } from '@/lib/db';
export async function GET() {
  const { rows } = await query('SELECT count(*) FROM profiles');
  return NextResponse.json({ profileCount: Number(rows[0].count) });
}
```

### Data Loading Strategy (Planned)
1. Offline parser (current) → JSON caches.
2. Temporary loader script to insert floats / profiles / measurements from JSON.
3. Full ingestion service writes directly into DB; Next.js consumes precomputed rows.

### Embeddings (Future)
When enabling pgvector ensure index build parameters match embedding dimension in `embeddings` table. Adjust `vector(768)` if using a different model.

### Housekeeping
- Consider periodic `VACUUM ANALYZE` after bulk loads.
- Partition `measurements` by `profile_id` range or time (advanced scalability phase).
- Limit API payload sizes (pagination & depth slicing) to avoid large result sets.

---
## 🔌 Real Profiles: UI vs Database Path
Current UI fetches real profile data (when used) from JSON cache via `/api/real/profiles`. Two parallel evolution tracks exist:

| Track | Near-Term Benefit | Migration Step Later |
|-------|-------------------|----------------------|
| JSON Cache → UI | Fast iteration, no DB dependency | Replace route internals with DB query preserving response schema |
| Direct DB → UI | Enables SQL filtering & pagination early | Skip cache layer; ingestion writes straight to tables |

Recommended Hybrid:
1. Keep JSON cache for rapid parsing experiments.
2. Build a loader that inserts a handful of cached profiles into `floats`, `profiles`, `measurements`, `profile_stats`.
3. Introduce a feature flag (env var) `REAL_PROFILE_SOURCE=db|cache` in the profiles route.
4. Once DB parity confirmed, deprecate cache branch for production.

API Contract Stability:
- Maintain the same outward JSON shape for `/api/real/profiles?floatId=...` so UI changes are minimal.
- When adding pagination, extend with `nextCursor` instead of changing existing fields.

Next Implementation Options:
1. Wire UI tab to display first real profile curve from cache → quick visual validation.
2. Implement DB loader script (`scripts/ingest/load_profiles_to_db.ts`) to seed a few profiles.
3. Add `/api/db/profileSummary?floatId=...` to benchmark query latency.

Choose (1) if goal is visible progress; choose (2) if preparing for RAG & NL2SQL foundation.

---

---
## ☁️ Deployment (Vercel)
The project is optimized for Vercel (serverless / edge-friendly). A `vercel.json` is included for deterministic builds.

### Minimal Deploy Steps
1. Push repo to GitHub (or GitLab/Bitbucket supported by Vercel)
2. In Vercel: New Project → Import
3. Framework auto-detect: Next.js (leave defaults)
4. (Optional) Add env vars:
  - `NEXT_PUBLIC_API_BASE` (omit to use same-origin)
5. Deploy → wait for build → open URL

### Health Check
`/api/health` returns `{ "status": "ok", "timestamp": <iso> }` for uptime probes.

### Local Production Preview
```bash
npm install
npm run build
npm start
```

### Common Adjustments
| Need | How |
|------|-----|
| Custom domain | Add in Vercel Domains tab |
| Increase function timeout | Edit `functions` in `vercel.json` |
| Enable source maps | Already enabled via NODE_OPTIONS |
| Future image domains | Add to `next.config.mjs` images config |

### Architecture Note
Heavy ingestion & processing (NetCDF parsing, embeddings generation) should live off-platform (e.g. FastAPI service + queue) and write into Postgres / object storage; the Next.js app then consumes prepared data.

### Post-Deploy Checklist
- [ ] Landing page renders
- [ ] `/app` chat works
- [ ] Map markers visible (network OK)
- [ ] Plot & Table toggle
- [ ] `/api/health` 200 OK
- [ ] No console errors

Add deployment URL here when live:

`LIVE_URL: https://<deployment>.vercel.app`

---
## 🤖 LLM Integration (Gemini)
Optional dynamic answer augmentation uses Google Gemini.

### Enable
1. Obtain API key from Google AI Studio.
2. Add to `.env.local`:
```
GEMINI_API_KEY=your_key_here
```
3. Restart dev server / redeploy.

### Behavior
- `/api/query` classifies intent (map/plot/table/unknown) using rule-based router.
- If `GEMINI_API_KEY` present, it calls Gemini (`gemini-1.5-flash`) with a concise system preamble and includes the classified intent as lightweight context.
- Response JSON includes `llmUsed: true` when the model responded; otherwise falls back to deterministic placeholder message.

### Security Notes
- Never commit real keys—only placeholders in `.env.example`.
- Rotate keys if a secret was exposed (the sample provided earlier in chat should be revoked and replaced).
- Add rate limiting before exposing LLM endpoints publicly.

### Future Enhancements
- Provide richer context (top profile summaries) before synthesis.
- Add cost / latency metrics instrumentation.
- Implement streaming responses.

### Rate Limiting
- `/api/query` now enforces a simple in-memory 30 requests / minute per IP limit (token bucket). Returns HTTP 429 with `retryAfterMs` field.
- For production deploy replace with Redis or edge KV to ensure consistency across instances.

### Coordinate-Based Nearest Float (New)
You can now ask for the nearest float to a coordinate in the chat, e.g.:
```
nearest float at 12N 70W
closest float 10.5N 62.3W
map 8N 55W
```
The system:
1. Extracts latitude/longitude in the form `<lat><N|S> <lon><E|W>` (decimals allowed).
2. Computes great-circle (haversine) distances over the mock float set.
3. Returns the closest float id and re-centers the map (zoom ~6) with a highlighted marker.
4. Provides a descriptive message: `Nearest float XYZ at (12.10, -70.00) ≈ 24.3 km.`

Limitations (MVP):
- Only one coordinate pattern per query is parsed.
- Requires explicit hemisphere letters (e.g., `N`, `S`, `E`, `W`).
- Uses mock dataset; real ingestion will replace source.

Planned Enhancements:
- Support signed numeric coordinates without hemisphere letters.
- Bounding box queries (e.g., `floats between 10N 60W and 12N 58W`).
- Multi-result listing when no single nearest is requested.

### Real ARGO Data – Phase 0 (Discovery Only)
The repository now includes an initial bridge toward real dataset integration without parsing NetCDF content yet.

Implemented:
- Environment variable `ARGO_DATA_DIR` (set this in `.env.local`) pointing to a local directory containing raw ARGO NetCDF (`.nc`) files.
- Discovery utility `src/lib/argo/discovery.ts` that:
  - Scans the directory recursively for `.nc` files
  - Caches lightweight metadata (id, filename, size bytes, last modified ISO timestamp)
  - Derives a float identifier from filename stem
- API routes:
  - `GET /api/real/floats` → returns an array of discovered files with counts
  - `GET /api/real/floats/[id]` → returns metadata for a single file (404 if absent)

Not Yet Implemented (Next Phases):
- Parsing NetCDF profiles (temperature, salinity, pressure) via xarray or a Node adapter
- Quality control flag filtering & derived stats computation
- Persistence to PostgreSQL/PostGIS and generation of aggregated `profile_stats`
- Embedding generation of profile summaries for retrieval augmentation

Usage Notes:
1. Place a subset of ARGO `.nc` files into the directory you set for `ARGO_DATA_DIR` (keep it small initially for faster indexing).
2. Restart dev server after changing the path so the discovery cache resets.
3. Call `/api/real/floats` in the browser or via `fetch` to inspect metadata.

Design Rationale:
- Keeps the Next.js server functions I/O-light (metadata only) until a separate ingestion microservice (Python/FastAPI + xarray) is introduced.
- Avoids large binary parsing and memory pressure inside Vercel/edge environments.

Planned Immediate Next Step:
- Prototype a minimal ingestion endpoint (`/api/real/profiles?floatId=...`) backed by a pre-parsed JSON cache produced offline by a Python script.

Environment Variables (addition):
```
ARGO_DATA_DIR=./ARGO-DATA
```
If not set, discovery routes return an empty list with a warning field.

### Offline Parsing Prototype (New)
An interim Python parser script (`scripts/ingest/parse_netcdf.py`) can generate cached JSON profile bundles consumed by the Next.js route:

Usage (example):
```
export ARGO_DATA_DIR=./ARGO-DATA
export PROFILE_CACHE_DIR=./data/derived/profiles
python scripts/ingest/parse_netcdf.py --float-id 5900001
python scripts/ingest/parse_netcdf.py --all --limit 3
```
Outputs per-float JSON: `PROFILE_CACHE_DIR/<floatId>.json` with keys: `floatId`, `profiles[]`, `generatedAt`, `sourceFileCount`.

Profiles API:
- `GET /api/real/profiles` → `{ floats: string[], total, cacheDir }`
- `GET /api/real/profiles?floatId=5900001` → full profile payload (temperature, salinity, depth, stats)

Added Env Var:
```
PROFILE_CACHE_DIR=./data/derived/profiles
```

### Real Profile UI (Experimental)
In the Plot panel you can switch between Mock and Real modes:
1. Enter a known float ID (e.g. `5900001` if a cache JSON exists)
2. Click "Real" then "Reload" (or initial Load Real button if empty)
3. The first profile in the cached JSON is plotted (Temperature & Salinity vs Depth)

Error states are shown inline; switching back to Mock reloads the original sample profile from `/api/profiles`.


### Tests
- `queryRoute.fallback.test.ts` – no LLM key fallback.
- `queryRoute.llm.test.ts` – LLM path with mocked Gemini.
- `rateLimit.test.ts` – verifies 429 after quota exhaustion.

---
## 🔄 Extension Roadmap (Detailed)
- NetCDF Ingestion: asynchronous downloader, idempotent cycle detection, QC filtering.
- PostGIS Integration: spatial proximity queries, trajectory reconstruction.
- RAG Layer: embeddings for schema & profile summaries; hybrid vector + SQL filtering.
- NL2SQL: guarded query generation (limit injection, EXPLAIN pre-check).
- Advanced Visualizations: depth-time sections, float comparisons, anomaly overlays.
- Security: API keys / JWT, rate limiting, audit logging.

---
## 🧱 Directory Layout
```
src/
  app/            # Next.js routes (/ , /app , /about , /api/* )
  components/     # UI + visualization panels
  data/mock/      # Mock JSON data for floats & profiles
  lib/            # Intent router & utilities
  store/          # Zustand state stores
  tests/          # Jest test files
```

---
## 🔐 Environment Variables
See `.env.example`.
- `NEXT_PUBLIC_API_BASE` – allows swapping base URL when real backend arrives.

Future:
- `DATABASE_URL`, `VECTOR_STORE_PATH`, model provider keys.

---
## 🛡 License
Placeholder – MIT-style intended.

---
## 🤝 Contributing
Issues & feature suggestions welcome. Please propose schema or API shape changes via discussion before PR.

---
## 🗺 Backlog Snapshot
- Satellite data fusion (SST overlays)
- BGC variable expansion (oxygen, nitrate, chlorophyll)
- Anomaly detection (mixed layer depth deviation)
- User workspaces & saved queries
- Time-series drift diagnostics

---
## 📬 Contact / Attribution
Built for the SIH Problem Statement 25040 – FloatChat prototype.
