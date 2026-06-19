"""
FloatChat / OceanGPT -- Python MCP Server
=========================================
Provides agentic ocean-data tools that Gemini can invoke via the
Model Context Protocol (MCP). Connects to:
  - Argovis API  (ocean profiles)
  - OceanOPS API (float metadata and health)
  - ERDDAP       (bulk / fallback data)

Run:
    cd FloatChat
    .\\venv\\Scripts\\python backend\\mcp_server.py
"""

import os
import json
import requests
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv()

ARGOVIS_BASE = "https://argovis-api.colorado.edu"
ARGOVIS_KEY = os.getenv("ARGOVIS_API_KEY", "")

OCEANOPS_BASE = "https://www.ocean-ops.org/api/1"

ERDDAP_BASE = "https://erddap.osmc.noaa.gov/erddap/tabledap"

# Strict timeouts (connect, read)
TIMEOUT = (5, 25) 
HEALTH_TIMEOUT = (3, 5)

# ---------------------------------------------------------------------------
# FastMCP Server
# ---------------------------------------------------------------------------
mcp = FastMCP("OceanGPT Data Service")


# ── Tool 1: get_ocean_profile ─────────────────────────────────────────────
@mcp.tool()
def get_ocean_profile(wmo_id: str, variables: str = "temperature,salinity") -> str:
    """
    Fetch vertical ocean profiles (temperature, salinity, pressure) for a
    specific ARGO float by its WMO platform ID.

    Args:
        wmo_id: The WMO platform number, e.g. '4901283'.
        variables: Comma-separated data variables. Default: 'temperature,salinity'.

    Returns:
        JSON string with profile data including coordinates, timestamps,
        and depth-indexed measurements.
    """
    headers = {}
    if ARGOVIS_KEY:
        headers["x-argokey"] = ARGOVIS_KEY

    try:
        resp = requests.get(
            f"{ARGOVIS_BASE}/argo",
            params={"platform": wmo_id, "data": variables},
            headers=headers,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        if not data:
            return json.dumps({"error": f"No profiles found for float {wmo_id}."})

        # Summarise for the LLM -- keep it concise
        # Argovis returns data as arrays; data_info maps variable names
        profiles = []
        for item in data[:5]:  # Cap to 5 most recent profiles
            geo = item.get("geolocation", {})
            coords = geo.get("coordinates", [None, None])
            
            # Parse the actual measurement data
            data_info = item.get("data_info", [])  # [[var_names], [units], ...]
            data_arrays = item.get("data", [])      # [[values], [values], ...]
            
            measurement_summary = {}
            if data_info and len(data_info) >= 2 and data_arrays:
                var_names = data_info[0] if isinstance(data_info[0], list) else []
                for i, var_name in enumerate(var_names):
                    if i < len(data_arrays):
                        arr = data_arrays[i]
                        valid = [v for v in arr if v is not None]
                        if valid:
                            measurement_summary[var_name] = {
                                "min": round(min(valid), 2),
                                "max": round(max(valid), 2),
                                "levels": len(valid),
                            }
            
            profile_summary = {
                "id": item.get("_id", "unknown"),
                "longitude": coords[0],
                "latitude": coords[1],
                "timestamp": item.get("timestamp", "unknown"),
                "measurements": measurement_summary,
            }
            profiles.append(profile_summary)

        return json.dumps({
            "float_id": wmo_id,
            "total_profiles_returned": len(data),
            "profiles_shown": len(profiles),
            "profiles": profiles,
        }, default=str)

    except requests.exceptions.HTTPError as e:
        return json.dumps({"error": f"Argovis HTTP {e.response.status_code}", "detail": str(e)})
    except requests.exceptions.RequestException as e:
        return json.dumps({"error": "Argovis connection failed", "detail": str(e)})


# ── Tool 2: search_ocean_area ─────────────────────────────────────────────
@mcp.tool()
def search_ocean_area(
    lat_min: float,
    lat_max: float,
    lon_min: float,
    lon_max: float,
    variables: str = "temperature,salinity",
) -> str:
    """
    Search for ARGO float profiles within a geographic bounding box.
    Use this when the user asks about a region (e.g. 'near the Maldives').

    Args:
        lat_min: Southern latitude boundary (e.g. 2.0).
        lat_max: Northern latitude boundary (e.g. 8.0).
        lon_min: Western longitude boundary (e.g. 71.0).
        lon_max: Eastern longitude boundary (e.g. 76.0).
        variables: Comma-separated data variables. Default: 'temperature,salinity'.

    Returns:
        JSON with a list of floats found in the area, their coordinates,
        and the number of profiles available.
    """
    headers = {}
    if ARGOVIS_KEY:
        headers["x-argokey"] = ARGOVIS_KEY

    # Argovis box format: [[lon_min, lat_min], [lon_max, lat_max]]
    box_param = f"[[{lon_min},{lat_min}],[{lon_max},{lat_max}]]"

    try:
        resp = requests.get(
            f"{ARGOVIS_BASE}/argo",
            params={"box": box_param, "data": variables},
            headers=headers,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        if not data:
            return json.dumps({
                "error": f"No profiles found in box lat[{lat_min},{lat_max}] lon[{lon_min},{lon_max}]."
            })

        # Group by float and summarise
        floats_seen = {}
        for item in data:
            pid = item.get("_id", "unknown")
            platform = pid.split("_")[0] if "_" in pid else pid
            geo = item.get("geolocation", {}).get("coordinates", [None, None])
            if platform not in floats_seen:
                floats_seen[platform] = {
                    "float_id": platform,
                    "longitude": geo[0],
                    "latitude": geo[1],
                    "profile_count": 0,
                    "latest_timestamp": item.get("timestamp", ""),
                }
            floats_seen[platform]["profile_count"] += 1
            ts = item.get("timestamp", "")
            if ts > floats_seen[platform]["latest_timestamp"]:
                floats_seen[platform]["latest_timestamp"] = ts

        float_list = list(floats_seen.values())

        return json.dumps({
            "bounding_box": {
                "lat_min": lat_min, "lat_max": lat_max,
                "lon_min": lon_min, "lon_max": lon_max,
            },
            "total_profiles": len(data),
            "unique_floats": len(float_list),
            "floats": float_list[:20],  # Cap for token efficiency
        }, default=str)

    except requests.exceptions.HTTPError as e:
        return json.dumps({"error": f"Argovis HTTP {e.response.status_code}", "detail": str(e)})
    except requests.exceptions.RequestException as e:
        return json.dumps({"error": "Argovis connection failed", "detail": str(e)})


# ── Tool 3: check_float_health ────────────────────────────────────────────
@mcp.tool()
def check_float_health(wmo_id: str) -> str:
    """
    Check the operational status, deployment info, and hardware health
    of an ARGO float using the OceanOPS API.

    Args:
        wmo_id: The WMO platform number, e.g. '4901283'.

    Returns:
        JSON with status (ACTIVE/INACTIVE), deployment date, coordinates,
        float model, deploying country, and program name.
    """
    try:
        resp = requests.get(
            f"{OCEANOPS_BASE}/data/platform",
            params={"wmo": wmo_id},
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        result = resp.json()
        
        # OceanOPS returns { data: [...] }
        items = result.get("data", [])
        if not items:
            return json.dumps({"error": f"Float {wmo_id} not found in OceanOPS."})
        
        data = items[0]  # First match

        # Extract the most useful fields safely
        status_obj = data.get("ptfStatus", {})
        status = status_obj.get("name", "UNKNOWN") if isinstance(status_obj, dict) else str(status_obj) if status_obj else "UNKNOWN"

        depl = data.get("ptfDepl", {}) or {}
        model_info = data.get("ptfModel", {}) or {}
        program = data.get("program", {}) or {}
        country = data.get("country", {}) or {}

        summary = {
            "wmo_id": wmo_id,
            "status": status,
            "deployment_date": depl.get("deplDate", "unknown"),
            "deployment_lat": depl.get("lat"),
            "deployment_lon": depl.get("lon"),
            "float_model": model_info.get("name", "unknown") if isinstance(model_info, dict) else str(model_info),
            "program": program.get("nameShort", "unknown") if isinstance(program, dict) else str(program),
            "country": country.get("name2", country.get("name", "unknown")) if isinstance(country, dict) else str(country),
            "description": data.get("description", ""),
        }

        return json.dumps(summary, default=str)

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return json.dumps({"error": f"Float {wmo_id} not found in OceanOPS."})
        return json.dumps({"error": f"OceanOPS HTTP {e.response.status_code}", "detail": str(e)})
    except requests.exceptions.RequestException as e:
        return json.dumps({"error": "OceanOPS connection failed", "detail": str(e)})


# ── Tool 4: search_erddap ────────────────────────────────────────────────
@mcp.tool()
def search_erddap(
    variables: str = "longitude,latitude,time,temp",
    dataset_id: str = "argo",
    time_min: str = "",
    lat_min: float = -90,
    lat_max: float = 90,
    lon_min: float = -180,
    lon_max: float = 180,
) -> str:
    """
    Query ERDDAP Tabledap for bulk ocean data. Use this as a fallback when
    Argovis doesn't have a specific dataset, or for large-scale filtering.

    Args:
        variables: Comma-separated column names (e.g. 'longitude,latitude,time,temp').
        dataset_id: ERDDAP dataset identifier. Default: 'argo'.
        time_min: Minimum time filter in ISO format (e.g. '2024-01-01'). Empty = no filter.
        lat_min: Southern latitude boundary. Default: -90.
        lat_max: Northern latitude boundary. Default: 90.
        lon_min: Western longitude boundary. Default: -180.
        lon_max: Eastern longitude boundary. Default: 180.

    Returns:
        JSON data from ERDDAP, or an error message.
    """
    # Build constraint string
    constraints = []
    if time_min:
        constraints.append(f"time>={time_min}")
    if lat_min > -90:
        constraints.append(f"latitude>={lat_min}")
    if lat_max < 90:
        constraints.append(f"latitude<={lat_max}")
    if lon_min > -180:
        constraints.append(f"longitude>={lon_min}")
    if lon_max < 180:
        constraints.append(f"longitude<={lon_max}")

    constraint_str = "&".join(constraints)
    url = f"{ERDDAP_BASE}/{dataset_id}.json?{variables}"
    if constraint_str:
        url += f"&{constraint_str}"

    # Add row limit to prevent massive responses
    url += "&orderByLimit(\"100\")"

    try:
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()

        # ERDDAP returns { table: { columnNames: [...], rows: [[...], ...] } }
        table = data.get("table", {})
        columns = table.get("columnNames", [])
        rows = table.get("rows", [])

        return json.dumps({
            "source": "ERDDAP",
            "dataset": dataset_id,
            "columns": columns,
            "row_count": len(rows),
            "rows_sample": rows[:20],  # First 20 rows for the LLM
            "query_url": url,
        }, default=str)

    except requests.exceptions.HTTPError as e:
        return json.dumps({"error": f"ERDDAP HTTP {e.response.status_code}", "detail": str(e)})
    except requests.exceptions.RequestException as e:
        return json.dumps({"error": "ERDDAP connection failed", "detail": str(e)})


# ── Tool 5: system_health_check ───────────────────────────────────────────
@mcp.tool()
def system_health_check() -> str:
    """
    Check the health of the OceanGPT Backend MCP Server.
    """
    checks = {
        "mcp_server": "online",
        "argovis_key_set": bool(ARGOVIS_KEY)
    }

    return json.dumps(checks)

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("[OceanGPT] MCP Server starting...")
    print(f"   Argovis key: {'set' if ARGOVIS_KEY else 'NOT SET'}")
    print(f"   Tools registered: {len(mcp._tool_manager._tools)}")
    mcp.run(transport="sse")
