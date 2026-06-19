# RAG & NL2SQL Plan (v0.1)

## Objectives
Enable natural language questions about ARGO float data to produce:
1. Structured answers (statistics, locations, trends) through safe SQL generation (NL2SQL)
2. Contextual explanations sourced from embedded profile summaries + schema documentation

## Retrieval Layers
| Layer | Purpose | Source |
|-------|---------|--------|
| Schema Embeddings | Teach model table/column semantics | Hand-authored schema docs + per-column descriptions |
| Profile Summaries | Semantic similarity for profile queries (e.g. "recent warm surface anomalies") | Generated text in `profile_stats`/embeddings |
| Float Metadata | Filter by region / time before similarity to reduce noise | SQL pre-filter |

## Embedding Strategy
- Model Options:
  - Open source: `sentence-transformers/all-MiniLM-L12-v2` (768 dim) – fast baseline
  - Higher quality (optional): `text-embedding-3-small` (OpenAI) or `nomic-embed-text`
- Dimension chosen: 768 (portable, good size/perf trade-off)
- Storage: `embeddings` table using pgvector (`vector(768)`) + IVFFlat index
- Refresh cadence: on profile ingestion (upsert summary -> embed)

## Profile Summary Generation
Template (see ingestion design). Add optional anomaly descriptors later:
```
Profile {id} at {timestamp} ({lat:.2f},{lon:.2f}) depth {min}-{max} dbar mean T={mean_temp:.2f}C mean S={mean_salinity:.2f} PSU MLD {mld:.0f} dbar.
```

## Retrieval Pipeline (Query Time)
1. Intent Routing (existing heuristic -> future classifier): classify map/plot/table vs analytic question.
2. If analytic / descriptive:
   a. Extract geo/time filters (regex / geocoder) → produce SQL WHERE skeleton.
   b. Build embedding query text (original user prompt minus filter tokens).
   c. Perform semantic search over profile summaries (k=50) within filtered candidate set.
   d. Rank & cluster (optional) to diversify results.
   e. Gather top N summaries + structured stats from DB.
3. Construct context block:
   - Top K summary texts
   - Schema spec snippet (only needed tables/columns)
   - Guardrails instructions (safe SQL constraints)
4. LLM call for answer synthesis OR SQL generation depending on mode.

## NL2SQL Guardrails
- Generate SQL with explicit whitelist of tables/columns.
- Reject queries containing: DDL, DML (other than SELECT), semicolons, comments.
- Enforce LIMIT (e.g. 200 rows) if absent.
- Pre-run `EXPLAIN` – abort if seq scan on large table without WHERE (unless small dataset).
- Apply bounding boxes & temporal windows from extracted filters if user references geography/time.

## Safety & Validation
| Risk | Mitigation |
|------|------------|
| Prompt Injection | Strip/ignore instructions outside allowed system template |
| Data Exfiltration | Restrict accessible columns list |
| Runaway Costs | Cache embedding vectors & LLM outputs (per normalized prompt) |
| Latency | Early SQL filter → smaller embedding candidate pool |

## Example Flow
User: "Show temperature profiles near 10N 60W last week with shallow mixed layers"
1. Extract lat=10, lon=-60, time window=now()-7d
2. Pre-filter `profiles` by ST_DWithin(position_geom, point(-60,10), 250000) + timestamp range
3. For remaining profile_ids compute vector similarity with embedding of reduced prompt: "temperature profiles shallow mixed layers"
4. Take top 20, fetch stats, feed to synthesis prompt: "Summarize mixed layer depths and temperatures.".

## Prompt Skeletons
### SQL Generation System Prompt (excerpt)
```
You are a strict SQL generator. Only output a single SELECT statement.
Allowed tables: floats, profiles, profile_stats, measurements.
Disallowed: INSERT, UPDATE, DELETE, ALTER, DROP, joins not using documented foreign keys.
Always apply a LIMIT <= 200.
```

### Answer Synthesis Prompt
```
Context Profiles (summaries):
<profiles>
{{top_profile_summaries}}
</profiles>
Question: {{user_query}}
Provide: concise answer + numeric highlights + if relevant a suggestion for a follow-up query.
```

## Tool / MCP Plan (Later)
- `run_sql(query)` – executes validated SQL and returns JSON rows
- `vector_search(query_text, k, filters)` – returns profile summary IDs + scores
- `get_profile_plot(profile_id)` – returns URL or JSON for plotting

## Caching
- Redis / in-memory for: embedding of identical normalized text, recent SQL results
- Cache key normalization: lowercase, trimmed, numeric canonicalization of lat/lon/time

## Metrics
- query_latency_seconds (end-to-end)
- vector_candidates_count
- sql_queries_generated_total
- guardrail_rejections_total

## Phased Implementation
| Phase | Deliverable |
|-------|-------------|
| R1 | Embed schema doc + simple similarity over profile summaries |
| R2 | NL2SQL baseline with guardrails + evaluation harness |
| R3 | Hybrid retrieval (metadata filter + vector) |
| R4 | Advanced ranking (MMR / clustering) |
| R5 | Observability dashboards + caching layer |

## Open Questions
- Which LLM provider(s) best for constrained SQL tasks (open vs proprietary)
- Evaluate cost vs accuracy of local embedding models vs API
- Handling extremely deep profiles (truncation strategy for text summary)

---
*Draft v0.1 – iterate after initial embedding prototype.*
