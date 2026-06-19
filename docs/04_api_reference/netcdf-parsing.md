# NetCDF Parsing Strategy (Draft)

## Goal
Incrementally expose real ARGO float profile content (temperature, salinity, depth arrays) without bloating the Next.js server bundle or blocking request latency.

## Options Considered
| Approach | Pros | Cons | Recommendation |
|----------|------|------|---------------|
| Pure Node (netcdfjs) | Single deployment, no extra service | Limited performance, streaming quirks, larger bundle | Prototype only |
| WASM decoders | Runs anywhere, sandboxed | Complexity, build overhead | Later optimization |
| Python FastAPI + xarray | Mature ecosystem, easy QC & transformations, can precompute stats | Extra service to deploy, network hop | Chosen path |

## Chosen Architecture
```
Next.js (UI & lightweight API)
   │ REST (JSON summaries)
   ▼
FastAPI Ingestion / Profile Service
   - xarray + netCDF4
   - Profile normalization
   - Derived metrics (stats, MLD, surface temp)
   - Summary text generation
   │
   ▼
PostgreSQL / PostGIS + (optional) object storage
```

## Data Flow
1. Discovery phase (implemented): list `.nc` files -> expose IDs.
2. Ingestion service reads NetCDF:
   - Extract metadata: cycle numbers, timestamps, lat/lon arrays
   - Extract variable arrays: TEMP, PSAL, PRES
   - Apply basic QC mask (ignore fill values & flagged points)
3. Store structured rows:
   - `profiles`: one per profile (cycle)
   - `measurements`: depth-indexed rows or compressed JSONB (phase decision)
   - `profile_stats`: aggregated metrics
4. Generate textual summary for embeddings & answer context.

## API (Ingestion Service) Sketch
| Method | Path | Description |
|--------|------|-------------|
| POST | /ingest/file | Force ingest of one NetCDF file |
| POST | /ingest/scan | Batch ingest directory diff |
| GET | /profiles | Filter by float, time, bbox |
| GET | /profiles/{id} | Return structured measurement arrays |
| GET | /profiles/{id}/plot | Pre-binned depth series for chart |

## Performance Notes
- Batch precompute stats instead of computing on each request.
- Consider caching compressed profile arrays in Redis.
- Convert large arrays to columnar Parquet for offline analytics.

## Quality Control (Initial)
- Drop values == `_FillValue` or outside sane bounds.
- Optionally flag density inversions or extreme spikes (phase 2).

## Embeddings Integration
- After ingestion, push per-profile summary text to embeddings worker for vector storage.

## Next Steps
1. Scaffold FastAPI service (separate repo or /services/ingestion). 
2. Implement `/profiles` using in-memory parsing for a small subset (prove shape) then persist.
3. Introduce queue for asynchronous large batch ingestion.
4. Add metrics and logging.

## Interim Offline Parser (Implemented)
While the dedicated FastAPI service is pending, a prototype offline parser is included:

Script: `scripts/ingest/parse_netcdf.py`

Usage Examples:
```
export ARGO_DATA_DIR=./ARGO-DATA
export PROFILE_CACHE_DIR=./data/derived/profiles
python scripts/ingest/parse_netcdf.py --float-id 5900001
python scripts/ingest/parse_netcdf.py --all --limit 3
```

Outputs one JSON file per float (e.g., `data/derived/profiles/5900001.json`) consumed by the Next.js API route:

- `GET /api/real/profiles` (lists available cached float IDs)
- `GET /api/real/profiles?floatId=5900001` (returns parsed profiles + measurements + stats)

Prototype Simplifications:
- Only temperature, salinity, pressure interpreted.
- Pressure treated as depth proxy (meters) for speed.
- QC flag filtering minimal (NaN / non-finite drop only).
- All measurements inlined (consider future compression or binning).

Migration Path:
- Replace offline script with FastAPI endpoints producing identical JSON schema initially.
- Gradually shift client from file-backed route to database-backed route without breaking contract.
- Introduce richer variables & QC once persistence in place.

---
Draft v0.1 – refine after first ingestion spike.
