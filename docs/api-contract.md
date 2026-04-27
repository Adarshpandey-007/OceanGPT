# API Contract

_Last updated: 2025-10-02_

This document defines the current and near-term **stable response shapes** for key API routes. Backward compatibility guidance: additive changes only (new optional fields). Breaking changes require versioning or feature flag gating.

## Conventions
- All timestamps ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- Numeric coordinate order: `(latitude, longitude)` where explicitly paired.
- Errors: JSON `{ error: string, code?: string }` with appropriate HTTP status.
- Pagination (future): cursor-based via `nextCursor`.

---
## `GET /api/health`
Health & liveness probe.

**Response 200**
```json
{
  "status": "ok",
  "timestamp": "2025-10-02T12:34:56.123Z"
}
```
Fields:
- `status`: always `ok` if route responds 200.
- `timestamp`: server time.

**Non-200**: Standard error JSON shape.

---
## `GET /api/query`
Processes a chat message, performs intent classification, optional LLM augmentation.

**Query Params / Body**: (implementation-specific; current MVP uses JSON body `{ message: string }`).

**Success 200**
```json
{
  "intent": "map|plot|table|unknown",
  "message": "model or fallback response text",
  "llmUsed": true,
  "rateLimit": { "remaining": 12, "resetMs": 12345 },
  "nearestFloat": {
    "id": "1901745",
    "lat": 12.1,
    "lon": -70.0,
    "distanceKm": 24.3
  }
}
```
Optional Objects:
- `nearestFloat`: Present only when coordinate pattern detected.

**Rate Limited 429**
```json
{
  "error": "rate_limited",
  "retryAfterMs": 30000,
  "limit": 30
}
```

---
## `GET /api/floats`
Mock float dataset list.

**200**
```json
{
  "floats": [
    { "id": "F001", "lat": 10.5, "lon": -60.2 },
    { "id": "F002", "lat": 11.0, "lon": -61.0 }
  ],
  "total": 2
}
```

---
## `GET /api/profiles`
Mock profile summaries.

**200**
```json
{
  "profiles": [
    {
      "id": "P001",
      "floatId": "F001",
      "cycle": 12,
      "timestamp": "2025-09-29T04:20:00.000Z",
      "minDepth": 5,
      "maxDepth": 1500,
      "meanTemp": 8.23,
      "meanSalinity": 34.71
    }
  ],
  "total": 1
}
```

---
## Real Data Discovery
Environment variable gating: `ARGO_DATA_DIR` must point to directory of `.nc` files.

### `GET /api/real/floats`
Returns discovered ARGO NetCDF file metadata (no parsed scientific variables yet).

**200**
```json
{
  "files": [
    {
      "id": "1901745",             // derived from filename stem
      "filename": "argo-profiles-1901745.nc",
      "sizeBytes": 123456,
      "modified": "2025-09-30T10:11:12.000Z"
    }
  ],
  "count": 1,
  "dataDir": "./ARGO-DATA",
  "warning": null
}
```
If `ARGO_DATA_DIR` unset:
```json
{ "files": [], "count": 0, "dataDir": null, "warning": "ARGO_DATA_DIR not set" }
```

### `GET /api/real/floats/:id`
**200** (single file metadata) or **404** `{ "error": "not_found" }`.

### `GET /api/real/profiles`
Discovery / index of cached parsed profile bundles.

**200**
```json
{
  "floats": ["1901745", "1901746"],
  "total": 2,
  "cacheDir": "./data/derived/profiles"
}
```

### `GET /api/real/profiles?floatId=1901745`
Returns full profile dataset for a single float (first iteration: basic arrays).

**200**
```json
{
  "floatId": "1901745",
  "generatedAt": "2025-10-01T08:22:00.000Z",
  "sourceFileCount": 3,
  "profiles": [
    {
      "cycle": 45,
      "timestamp": "2025-09-28T03:00:00.000Z",
      "points": [
        { "depth": 0, "temperature": 26.1, "salinity": 35.2 },
        { "depth": 10, "temperature": 25.8, "salinity": 35.1 }
      ],
      "stats": {
        "minDepth": 0,
        "maxDepth": 1500,
        "meanTemp": 12.34,
        "meanSalinity": 34.91
      }
    }
  ]
}
```

**404** `{ "error": "not_found", "floatId": "1901745" }`.

---
## Planned Additive Fields (Non-Breaking)
| Route | Field | Purpose |
|-------|-------|---------|
| `/api/query` | `tokensUsed` | LLM cost telemetry |
| `/api/query` | `elapsedMs` | Latency instrumentation |
| `/api/real/profiles` | `pagination` | Cursor block for large sets |
| `/api/real/profiles?floatId=` | `profileCount` | Quick length without parsing full array |
| `/api/health` | `uptimeSeconds` | Monitoring dashboards |

---
## Deprecation & Versioning Policy
- Minor shape changes require 2-week deprecation note in `CHANGELOG.md`.
- For structural changes, introduce `/api/v1/...` prefix and run dual stack until migration complete.

---
## Error Codes (Enumerated So Far)
| Code | Meaning | HTTP |
|------|---------|------|
| `rate_limited` | Token bucket exhausted | 429 |
| `not_found` | Resource missing | 404 |
| `invalid_input` | Validation failure (future) | 400 |

---
## Security Notes
- No auth yet; admin endpoints must not expose sensitive config until auth layer lands.
- Rate limiting only applied to `/api/query` (expand to other write-heavy routes later).

---
## Changelog
- 2025-10-02: Initial publication.
