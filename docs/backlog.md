# Future Extensions Backlog

A curated, living backlog of enhancements beyond the current MVP and near-term ingestion/RAG milestones. Grouped by theme with indicative priority (H/M/L) and complexity estimates.

## Legend
- Priority: H (High), M (Medium), L (Low)
- Complexity: S (Small), M (Medium), L (Large), XL (Epic)

## 1. Data & Ingestion
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Delayed-mode adjustments handling | H | M | Incorporate corrected salinity/temperature after QC release |
| Parallel segmented downloader | M | M | Concurrency with adaptive rate limiting |
| Raw NetCDF object storage archival | M | M | S3 / Azure Blob + retention policy |
| Backfill automation CLI | L | M | Command to reprocess a date/window |

## 2. Geospatial & Analytics
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Trajectory reconstruction API | H | M | Build line geometry per float; caching layer |
| Bounding box + variable threshold queries | H | S | Extend profile filter endpoint |
| Section extraction (lat/lon transects) | M | L | Interpolation along great circle path |
| Climatology anomaly detection | M | L | Compare to WOA or historical median |
| Mixed layer depth anomaly alerts | M | M | Stats distribution & z-score flags |

## 3. RAG & Intelligence
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Hybrid MMR ranking | M | S | Diversify similar profile summaries |
| Temporal trend summarizer | M | M | Aggregate stats over sliding windows |
| Profile clustering (k-means on stats) | L | M | Provide cluster labels in summaries |
| Multi-hop query interpretation | L | L | Chain-of-thought assist for compound requests |

## 4. Visualization
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Depth-time heatmaps | H | M | 2D section (time vs depth) for temp/salinity |
| Multi-float comparison overlay | M | M | Chart overlay by cycle alignment |
| Interactive trajectory playback | M | M | Time slider controlling map positions |
| Export to CSV / NetCDF slice | M | S | User triggered export of filtered profiles |
| Satellite SST overlay | L | L | WMTS layer addition (sourced externally) |

## 5. User Experience & Collaboration
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Saved queries / dashboards | M | M | Persist normalized NL queries |
| User workspaces & roles | M | L | Basic auth + ownership of saved items |
| Shareable deep links (state in URL) | H | S | Encode active tab & selection |
| Dark mode toggle | L | S | Tailwind theme variant |

## 6. Performance & Ops
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Async job queue (Celery / RQ) | H | M | Offload heavy ingestion steps |
| Observability dashboard (Grafana) | M | S | Metrics + logs + traces panels |
| Vector cache warmup job | M | S | Pre-embed popular schema queries |
| Horizontal sharding strategy doc | L | L | Outline approach for >100M measurements |

## 7. Security & Governance
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Rate limiting middleware | H | S | Protect API endpoints (ingress) |
| Audit log for admin actions | M | M | DB table + structured events |
| Query safety fuzz tests | M | S | NL2SQL injection attempts harness |
| Fine-grained API tokens | L | M | Scoped access (read / ingest / admin) |

## 8. Evaluation & Quality
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| NL2SQL benchmark suite | H | M | Gold set of Q/A + expected SQL |
| Embedding similarity drift monitor | M | S | Track mean cosine similarity distribution |
| Synthetic profile generator | L | M | Create test data edge cases |

## 9. Advanced Science Features
| Item | Priority | Complexity | Notes |
|------|----------|------------|-------|
| Bio-geochemical variable support | H | L | Oxygen, nitrate, chlorophyll ingestion |
| Derived density / sigma-t | M | S | Compute from T/S for plots |
| Mixed layer depth algorithms comparison | M | M | Multiple criteria side by side |
| Anomaly scoring service | L | L | Rolling statistical baseline |

## Sequencing Suggestions
1. Stabilize ingestion + schema (M1)
2. Baseline embeddings & simple RAG (R1)
3. NL2SQL guardrails + evaluation harness
4. Advanced visualization (depth-time, trajectories)
5. Performance & observability hardening

## Acceptance Criteria Examples
- Trajectory API: Returns GeoJSON LineString with ordered profile timestamps.
- NL2SQL Guardrails: 0 successful injection attempts over 200 curated adversarial prompts.
- Embedding Search Latency: p95 < 150ms for k=50 after metadata pre-filter.

---
*Backlog v0.1 – refine as usage insights emerge.*
