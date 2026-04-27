# Ingestion Service Design (NetCDF → Postgres/PostGIS)

## Goals
Provide a reliable, idempotent pipeline to acquire ARGO float profile NetCDF files, extract structured measurements & metadata, apply quality control, and persist into a relational + spatial database with derivative stats and vector-ready textual summaries.

## Scope (Phase M1)
- Fetch global/daily index of available profiles (GDAC / Ifremer mirror)
- Incremental download of new profiles only
- Parse physical & (later) biogeochemical variables (temp, salinity; later oxygen, nitrate, chlorophyll)
- Persist floats, profiles, measurements, and profile_stats
- Generate lightweight textual summary per profile for embeddings

## Non-Goals (M1)
- Advanced ML anomaly detection
- Reprocessing historical backfill beyond initial baseline import
- Real-time streaming (batch + periodic is fine initially)

## High-Level Flow
```
Scheduler (cron / queue)
   └── fetch_index -> diff -> enqueue new profile tasks
                          └── worker(download .nc -> parse -> QC -> transform -> upsert DB -> derive stats -> summarize)
```

## Components
| Component | Tech | Notes |
|----------|------|-------|
| Orchestrator | Python (FastAPI + APScheduler / Celery optional) | REST + scheduled jobs |
| Downloader | aiohttp / requests | Support retries & checksum validation |
| Parser | xarray + netCDF4 | Memory-efficient chunking where possible |
| QC Module | numpy/pandas rules | Flagging questionable values (range, spike) |
| DB Layer | SQLAlchemy async + Postgres/PostGIS | Upserts + spatial indexing |
| Stats Generator | numpy/pandas | Derived metrics (mean, surface temp, MLD heuristic) |
| Summarizer | Templated text | Input to future embedding pipeline |

## Data Sources
- ARGO GDAC ftp/http: global index file (e.g., `ar_index_global_meta.txt`, profile lists)
- Individual profile NetCDF files: path pattern includes WMO + cycle

## Database Tables (Draft)
See `schema.md` (to be created). Key references:
- floats (1:N) profiles
- profiles (1:N) measurements
- profile_stats (1:1) profiles

## Idempotency Strategy
- Maintain `profiles` unique constraint on (float_id, cycle_number)
- Store source file checksum (MD5) and skip if unchanged
- Use staging table for bulk insert → move to final tables transactionally

## Quality Control (Initial Rules)
| Variable | Basic Range | Notes |
|----------|-------------|-------|
| temperature (°C) | -5 to 40 | Hard bounds |
| salinity (PSU) | 0 to 50 | Hard bounds |
| depth (dbar) | >=0 | Convert negative to abs + flag |

Flag categories: `good`, `out_of_range`, `missing`, `spike`. Implement simple gradient check for spikes.

## Derived Metrics (profile_stats)
- mean_temp, mean_salinity
- surface_temp (average of top 10 dbar)
- mixed_layer_depth (threshold method: delta T > 0.5°C from surface)
- depth_range (min/max depth)

## Textual Summary Template
```
Profile {profile_id} (Float {wmo_id}) at {timestamp_iso} near ({lat:.2f}, {lon:.2f}). Depth range {min_depth}-{max_depth} dbar. Mean T={mean_temp:.2f}°C, mean S={mean_salinity:.2f} PSU. Surface T={surface_temp:.2f}°C. MLD≈{mld:.0f} dbar.
```

## API Endpoints (FastAPI)
| Method | Path | Purpose |
|--------|------|---------|
| POST | /ingest/scan | Trigger index fetch + enqueue new profiles |
| POST | /ingest/profile | Manual ingest of single profile (URL/body) |
| GET | /floats | Paginated float metadata + last observation |
| GET | /profiles | Filter by float_id, time range, bbox |
| GET | /profiles/{id} | Detailed measurements (paginated or sliced) |
| GET | /profiles/{id}/summary | Stats + textual summary |
| GET | /health | Liveness/readiness checks |

## Scheduling
- Cron every 6h: scan global index
- Backfill job: initial historical load (bounded window)
- Future: event-driven (webhook) if upstream notifies

## Error Handling & Retries
- Exponential backoff on network errors
- Dead-letter queue (Poison messages) for repeated parse failures
- Capture failure reason & source URL in `ingest_errors` table (future)

## Observability
- Structured logs (JSON) with correlation IDs per profile ingest
- Metrics: profiles_ingested_total, ingest_duration_seconds, qc_flag_counts
- Optional: OpenTelemetry traces around parse + DB transaction

## Performance Considerations
- Batch inserts of measurements (COPY where viable)
- Use numeric compression (FLOAT4) where acceptable
- Evaluate parquet archival of raw NetCDF extracts for reprocessing

## Security & Compliance
- Validate URLs (whitelist host)
- Limit file size & enforce content-type
- Sanitize textual summaries (no PII expected)

## Future Enhancements
- Parallel downloads with bounded concurrency
- Geospatial trajectory reconstruction endpoints
- Advanced QC (gradient, climatology comparison)
- Streaming partial ingestion progress events (WebSocket)

## Open Questions
- Exact upstream index format variants (regional subsets?)
- Handling of delayed-mode adjustments vs real-time data
- Retention policy for raw NetCDF (local disk vs object storage)

---
*Draft v0.1 – iterate after schema finalization.*
