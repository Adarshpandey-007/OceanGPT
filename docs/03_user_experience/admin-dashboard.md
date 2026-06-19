# Admin Dashboard

_Last updated: 2025-10-02_

## 1. Purpose
Provide an internal-only overview panel for operational insight and feature flag inspection without needing external monitoring tools (pre-SaaS observability). Designed to evolve toward a secure control surface once auth is implemented.

## 2. Scope (Current MVP)
Read-only informational widgets:
- Basic health ping display (`/api/health`)
- Feature/environment flags snapshot (e.g., `REAL_PROFILE_SOURCE`, presence of `GEMINI_API_KEY`, `ARGO_DATA_DIR`, `PROFILE_CACHE_DIR`)
- Real dataset discovery counts (floats discovered, cached profile bundles)
- Query rate limit status (if surfaced via a lightweight internal call)
- Version/build metadata (package version, Node runtime)

_No mutation endpoints (no delete / reprocess / flush) until authentication & audit logs exist._

## 3. Layout Structure
| Section | Component | Notes |
|---------|-----------|-------|
| Header | Title + warning badge | Emphasize internal use only |
| System Status | Stat cards (Health, LLM, Real Data Mode) | Color-coded state tokens |
| Data Discovery | Table/List for floats & caches | Lazy loaded to avoid blocking |
| Environment Flags | Key/value grid | Redact secrets (show boolean only) |
| Roadmap / Next Ops | Static list | Links to docs (`api-contract.md`) |

## 4. Component Guidelines
- **Stat Card**: Minimal glass style (reuse design system panel pattern). Color accents for state (green=ok, amber=warn, red=error).
- **Async Fetch**: Show skeleton shimmer for cards >200ms load; degrade to error chip on failure.
- **Reduced Motion**: Skeleton shimmer replaced with static pulse when `prefers-reduced-motion`.

## 5. Security & Hardening Roadmap
| Phase | Measure | Trigger |
|-------|---------|---------|
| A | Hide page behind environment flag `ENABLE_ADMIN` | Immediately |
| B | Basic token auth header (shared secret) | Before staging deploy |
| C | Role-based auth (session / JWT) | Before multi-user release |
| D | Audit logging (view / changes) | Prior to write controls |

## 6. Future Enhancements
- Live rate metrics (requests/min last 5m) via in-memory ring buffer API.
- Error boundary digest list (recent 10) once logging integrated.
- Trigger ingestion re-scan button (post-auth only).
- LLM usage counters (tokens, cost estimate) updated per request.
- DB connectivity + migration status panel.

## 7. Non-Goals (For Now)
- Direct database writes
- Arbitrary shell commands
- Bulk deletion of cached data

## 8. Performance Budget
- Target TTI: < 1s (excluding slower real-data counts; load those after first paint).
- No single admin fetch > 500ms without visual placeholder.

## 9. Visual Severity Tokens
| State | Class Hint | Meaning |
|-------|------------|---------|
| ok | border-green-400 text-green-600 | Nominal |
| warn | border-amber-400 text-amber-600 | Degraded / partial |
| error | border-red-500 text-red-600 | Unavailable |

## 10. Implementation Notes
- Use a dedicated client component inside page to handle fetches with `useEffect` and abort controllers.
- Consider extracting a small `useAsync` hook for consistent loading / error structure.
- All secrets: only show `[set]` / `[unset]` (never echo values).

## 11. Dependencies
No external deps required initially. Leave integration hooks for Sentry or OpenTelemetry once added.

## 12. Changelog
- 2025-10-02: Initial draft.
