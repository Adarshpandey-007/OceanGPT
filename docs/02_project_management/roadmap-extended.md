# FloatChat Extended Roadmap

This document expands the phased evolution of FloatChat from mock prototype to a production-grade conversational ocean data platform.

## Phase Overview
| Phase | Name | Core Deliverable | Key Risks | Success Metric |
|-------|------|------------------|-----------|----------------|
| 0 | MVP Mock | Chat + Map/Plot/Table (mock) | UI scope creep | Stable demo, <1s mock responses |
| 1 | Cache Ingestion | Offline NetCDF parse -> JSON cache -> Real profile UI | Parse variance across files | First real profile renders |
| 2 | Structured Storage | Postgres/PostGIS schema + loader | Data model shifts | 10k profiles loaded; spatial query <150ms |
| 3 | Embeddings Layer | pgvector + profile + schema embeddings | Cost & dimension choice | Top-5 semantic retrieval precision >70% |
| 4 | Guarded NL2SQL | LLM tool creating safe SQL plans | Query hallucination | 90% valid SQL w/out manual correction |
| 5 | RAG Answers | Retrieval + SQL + synthesis orchestration | Latency accumulation | <4s median answer round-trip |
| 6 | Analytics Suite | Sections, anomalies, MLD stats | Complex UX | 3 advanced visual tools adopted |
| 7 | Multi-Modal Fusion | Satellite overlays & trajectories | Data volume | Overlay load <2s |
| 8 | Workspaces | User saved queries, pins | Auth complexity | 40% returning users use saves |
| 9 | Public API | Token auth + usage metrics | Abuse & rate limiting | 99% uptime, rate guard incidents <5/mo |

## Detailed Milestones
### Phase 1 – Cache Ingestion
- Implement robust NetCDF variable detection
- QC filtering (drop fill values, unrealistic ranges)
- Derived stats (mean, surface temp, depth range)
- JSON contract freeze for UI integration

### Phase 2 – Structured Storage
- Bulk loader script (JSON -> DB)
- Geometry indexing & bounding box query endpoint
- Incremental ingest idempotency via checksum
- Measurement compression exploration (JSONB vs row model benchmarks)

### Phase 3 – Embeddings
- Profile summary generation template
- Chunking & embedding pipeline worker
- Vector similarity endpoint `/api/search/profiles` (semantic)
- Hybrid retrieval prototype (vector + SQL filter)

### Phase 4 – Guarded NL2SQL
- Schema introspection prompt builder
- Safety rails: allowed verbs, LIMIT enforcement, EXPLAIN dry-run
- Plan classification (rejects: DDL, multi-statement)
- Telemetry: success/failure taxonomy

### Phase 5 – RAG Synthesis
- Multi-source context (top vector hits + direct SQL stats)
- Structured context blocks (JSON -> text) for LLM
- Confidence scoring + fallback phrasing (avoid hallucinated precision)

### Phase 6 – Analytics Suite
- Vertical section generation (lat/long transect interpolation)
- Temporal drift charts per float (rolling mean anomalies)
- Mixed Layer Depth algorithm integration (threshold & density-based)

### Phase 7 – Multi-Modal Fusion
- Satellite SST/Chl overlays (tile server integration)
- Float trajectory polyline rendering
- Playhead control for time animation (profiles over time)

### Phase 8 – Workspaces
- Auth layer (token-based, minimal) + user profile table
- Saved queries & pinned floats
- Usage insights (session length, feature adoption metrics)

### Phase 9 – Public API
- API keys issuance + rate plans
- Observability dashboards (p95 latency, error rates)
- Billing hooks (future) / usage export

## Cross-Cutting Concerns
| Area | Strategy |
|------|----------|
| Observability | OpenTelemetry spans around LLM + DB + vector calls |
| Cost Control | Batch embedding + size-aware truncation |
| Latency | Early streaming of textual answer skeleton |
| Security | Principle of least privilege DB role; API key hashing |
| Testing | Contract tests for profile JSON + regression fixtures |
| Performance | Benchmark harness comparing JSONB vs row measurement model |

## De-Risking Backlog
- Write parser probes for 5 varied NetCDF files early (before full ingest)
- Decide embedding dimension & provider with small A/B retrieval test
- Build a “safe SQL linter” early to collect patterns before NL2SQL phase

## Sunset / Deprecation Plan
- JSON cache route deprecation announcement with two minor versions of overlap
- Remove legacy mock data after stable ingestion + retrieval validation

---
Version: 2025-09-30
