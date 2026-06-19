# FloatChat / OceanGPT — External API Integration Guide

> Last updated: 2026-05-06

This document explains how FloatChat integrates with external ocean data APIs, including authentication, request/response formats, and error handling patterns.

---

## 1. API Overview

FloatChat uses three external APIs as its data backbone:

| API | Role | Auth | Rate Limit |
|-----|------|------|------------|
| **Argovis** | Primary ocean data (profiles) | API Key (header) | ~1000 req/day |
| **OceanOPS** | Float metadata & health | None (public) | Best-effort |
| **ERDDAP** | Bulk/fallback data | None (public) | Generous |

All API calls are made **server-side only** from the Python MCP Server (`backend/mcp_server.py`). API keys are never exposed to the browser.

---

## 2. Argovis API

### 2.1 Authentication
```
Header: x-argokey: <ARGOVIS_API_KEY>
```
Store the key in `.env` as `ARGOVIS_API_KEY`.

### 2.2 Get Profile by Float ID
```http
GET https://argovis-api.colorado.edu/argo
  ?platform=4901283
  &data=temperature,salinity
```

**Response** (simplified):
```json
[
  {
    "_id": "4901283_001",
    "geolocation": { "type": "Point", "coordinates": [73.5, 4.17] },
    "timestamp": "2024-06-15T12:00:00.000Z",
    "data": [
      { "pressure": 10, "temperature": 28.5, "salinity": 34.8 },
      { "pressure": 50, "temperature": 26.2, "salinity": 35.1 },
      { "pressure": 200, "temperature": 15.3, "salinity": 35.4 }
    ]
  }
]
```

### 2.3 Search by Bounding Box
```http
GET https://argovis-api.colorado.edu/argo
  ?box=[[72,3],[75,6]]
  &data=temperature
  &presRange=[0,500]
```

### 2.4 Search by Radius
```http
GET https://argovis-api.colorado.edu/argo
  ?circle_center=73.5,4.17
  &circle_radius=200
  &data=temperature,salinity
```

### 2.5 Error Handling
| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Parse JSON |
| 401 | Invalid API key | Check `ARGOVIS_API_KEY` |
| 404 | No data found | Return "No profiles found" message |
| 429 | Rate limited | Wait and retry, or use ERDDAP fallback |
| 500 | Server error | Use ERDDAP fallback |

---

## 3. OceanOPS API

### 3.1 Authentication
None required. Public API.

### 3.2 Get Float Metadata
```http
GET https://www.ocean-ops.org/api/1/platforms/4901283
```

**Response** (simplified):
```json
{
  "ref": "4901283",
  "ptfStatus": { "name": "ACTIVE" },
  "ptfDepl": {
    "deplDate": "2022-03-15T00:00:00Z",
    "lat": 4.17,
    "lon": 73.5
  },
  "ptfModel": { "name": "ARVOR" },
  "program": { "nameShort": "INCOIS" },
  "country": { "name": "INDIA" }
}
```

### 3.3 List Active Floats by Network
```http
GET https://www.ocean-ops.org/api/1/platforms
  ?status=ACTIVE
  &network=Argo
  &fields=ref,ptfStatus,country
```

### 3.4 Error Handling
| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Parse JSON |
| 404 | Float not found | Return "Float ID not recognized" |
| 503 | Service unavailable | Skip metadata, use Argovis only |

---

## 4. ERDDAP Tabledap

### 4.1 Authentication
None required.

### 4.2 Query Construction
ERDDAP uses URL-based queries that act like SQL:

```http
GET https://erddap.osmc.noaa.gov/erddap/tabledap/argo.json
  ?longitude,latitude,time,temp
  &time>=2024-01-01
  &latitude>=0
  &latitude<=10
  &longitude>=70
  &longitude<=80
```

### 4.3 Response Formats
Change the extension to control the format:
- `.json` — JSON array
- `.csv` — CSV download
- `.png` — Auto-generated chart
- `.htmlTable` — HTML table

### 4.4 Error Handling
| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Parse response |
| 404 | Dataset not found | Check dataset ID |
| 500 | Query error | Simplify constraints |

---

## 5. Integration Pattern in MCP Server

```python
# backend/mcp_server.py

import os
import requests
from mcp.server.fastmcp import FastMCP

ARGOVIS_BASE = "https://argovis-api.colorado.edu"
ARGOVIS_KEY = os.getenv("ARGOVIS_API_KEY")

OCEANOPS_BASE = "https://www.ocean-ops.org/api/1"

ERDDAP_BASE = "https://erddap.osmc.noaa.gov/erddap/tabledap"

mcp = FastMCP("OceanGPT Data Service")

@mcp.tool()
def get_ocean_profile(wmo_id: str, variables: str = "temperature,salinity") -> str:
    """Fetch ocean depth profile from Argovis for a specific float."""
    resp = requests.get(
        f"{ARGOVIS_BASE}/argo",
        params={"platform": wmo_id, "data": variables},
        headers={"x-argokey": ARGOVIS_KEY},
        timeout=15
    )
    resp.raise_for_status()
    return resp.text

@mcp.tool()
def check_float_health(wmo_id: str) -> str:
    """Check float deployment info and operational status from OceanOPS."""
    resp = requests.get(f"{OCEANOPS_BASE}/platforms/{wmo_id}", timeout=10)
    resp.raise_for_status()
    return resp.text
```

---

## 6. Environment Variables Required

Add these to your `.env` file:

```env
# Ocean Data APIs
ARGOVIS_API_KEY=your_argovis_api_key_here

# MCP Backend
MCP_SERVER_URL=http://127.0.0.1:8000/sse
```
