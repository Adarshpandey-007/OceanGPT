#!/usr/bin/env python3
"""
NetCDF parser for ARGO float profile extraction with PostgreSQL ingestion.

Environment Variables:
  ARGO_DATA_DIR: directory containing raw .nc files
  DATABASE_URL: Postgres connection string
  PROFILE_CACHE_DIR: fallback output directory for parsed JSON if DB not used

Usage:
  python scripts/ingest/parse_netcdf.py --float-id 5904892
  python scripts/ingest/parse_netcdf.py --all --limit 5
"""
import argparse
import json
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

try:
    import xarray as xr
    import numpy as np
    import psycopg2
    from psycopg2.extras import execute_values
    from dotenv import load_dotenv
    load_dotenv()
except ImportError as e:
    raise SystemExit("Missing dependencies. Run: pip install -r scripts/ingest/requirements.txt") from e

def find_netcdf_files(root: Path):
    for p in root.rglob('*.nc'):
        if p.is_file():
            yield p

def derive_float_id(filename: str) -> str:
    stem = Path(filename).stem
    digits = ''.join(ch for ch in stem if ch.isdigit())
    return digits or stem

def parse_file(path: Path):
    try:
        ds = xr.open_dataset(path, decode_times=True)
    except Exception as e:
        print(f"WARN: failed to open {path}: {e}")
        return []

    temp_var_candidates = [v for v in ['TEMP', 'TEMP_ADJUSTED', 'temperature'] if v in ds]
    sal_var_candidates = [v for v in ['PSAL', 'PSAL_ADJUSTED', 'salinity'] if v in ds]
    pres_var_candidates = [v for v in ['PRES', 'PRES_ADJUSTED', 'pressure'] if v in ds]

    if not temp_var_candidates or not sal_var_candidates or not pres_var_candidates:
        print(f"SKIP: {path.name} missing required variables")
        return []

    temp_var = temp_var_candidates[0]
    sal_var = sal_var_candidates[0]
    pres_var = pres_var_candidates[0]

    try:
        temps = ds[temp_var].values
        sals = ds[sal_var].values
        press = ds[pres_var].values
    except Exception as e:
        print(f"WARN: variable extraction failed {path.name}: {e}")
        return []

    time_var = next((v for v in ['JULD', 'TIME', 'time'] if v in ds), None)
    lat_var = next((v for v in ['LATITUDE', 'latitude', 'LAT'] if v in ds), None)
    lon_var = next((v for v in ['LONGITUDE', 'longitude', 'LON'] if v in ds), None)
    cycle_var = next((v for v in ['CYCLE_NUMBER', 'cycle_number', 'CYCLE'] if v in ds), None)

    n_prof = temps.shape[0] if temps.ndim == 2 else 1

    def safe_arr(var):
        if var and var in ds:
            return ds[var].values
        return None

    times_raw = safe_arr(time_var)
    lats = safe_arr(lat_var)
    lons = safe_arr(lon_var)
    cycles = safe_arr(cycle_var)

    profiles = []
    for i in range(n_prof):
        t_series = temps[i] if temps.ndim == 2 else temps
        s_series = sals[i] if sals.ndim == 2 else sals
        p_series = press[i] if press.ndim == 2 else press

        mask = np.isfinite(t_series) & np.isfinite(s_series) & np.isfinite(p_series)
        t_series = t_series[mask]
        s_series = s_series[mask]
        p_series = p_series[mask]
        if t_series.size == 0:
            continue

        mean_temp = float(np.mean(t_series))
        mean_sal = float(np.mean(s_series))
        surface_temp = float(t_series[0]) if t_series.size > 0 else None

        measurements = [
            {"depth": float(p_series[j]), "temperature": float(t_series[j]), "salinity": float(s_series[j])}
            for j in range(t_series.size)
        ]

        timestamp_iso = None
        if times_raw is not None:
            try:
                val = times_raw[i] if times_raw.ndim > 0 else times_raw
                if isinstance(val, (np.datetime64, datetime)):
                    timestamp_iso = str(np.datetime_as_string(val, timezone='UTC')) if isinstance(val, np.datetime64) else val.astimezone(timezone.utc).isoformat()
                else:
                    base = datetime(1950, 1, 1, tzinfo=timezone.utc)
                    timestamp_iso = (base + timedelta(days=float(val))).isoformat()
            except Exception:
                timestamp_iso = None
                
        if not timestamp_iso:
             timestamp_iso = datetime.now(timezone.utc).isoformat()

        lat_val = float(lats[i]) if lats is not None else 0.0
        lon_val = float(lons[i]) if lons is not None else 0.0
        cycle_val = int(cycles[i]) if cycles is not None else i
        
        if np.isnan(lat_val) or np.isnan(lon_val):
             continue

        profiles.append({
            "cycle": cycle_val,
            "timestamp": timestamp_iso,
            "latitude": lat_val,
            "longitude": lon_val,
            "minDepth": float(np.min(p_series)),
            "maxDepth": float(np.max(p_series)),
            "measurements": measurements,
            "stats": {"meanTemp": mean_temp, "meanSalinity": mean_sal, "surfaceTemp": surface_temp}
        })

    return profiles

def aggregate_by_float(files):
    grouped = {}
    for f in files:
        fid = derive_float_id(f.name)
        grouped.setdefault(fid, []).append(f)
    return grouped

def get_db_connection():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        return None
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"WARN: DB connection failed: {e}")
        return None

def insert_float_data(conn, fid, profiles):
    cursor = conn.cursor()
    try:
        # Insert float
        cursor.execute('''
            INSERT INTO floats (wmo_id, launch_date, last_observation)
            VALUES (%s, NOW(), NOW())
            ON CONFLICT (wmo_id) DO UPDATE SET last_observation = EXCLUDED.last_observation
            RETURNING id
        ''', (fid,))
        db_float_id = cursor.fetchone()[0]

        for p in profiles:
            # Insert profile
            cursor.execute('''
                INSERT INTO profiles (float_id, cycle_number, timestamp, latitude, longitude, min_depth, max_depth, qc_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'good')
                ON CONFLICT (float_id, cycle_number) DO UPDATE SET timestamp = EXCLUDED.timestamp
                RETURNING id
            ''', (db_float_id, p["cycle"], p["timestamp"], p["latitude"], p["longitude"], p["minDepth"], p["maxDepth"]))
            
            profile_id = cursor.fetchone()[0]

            # Prepare measurements
            meas_records = [
                (profile_id, m["depth"], m["temperature"], m["salinity"])
                for m in p["measurements"]
            ]
            
            cursor.execute('DELETE FROM measurements WHERE profile_id = %s', (profile_id,))

            execute_values(cursor, '''
                INSERT INTO measurements (profile_id, depth, temperature, salinity)
                VALUES %s
            ''', meas_records)

            # Insert stats
            cursor.execute('''
                INSERT INTO profile_stats (profile_id, mean_temp, mean_salinity, surface_temp)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (profile_id) DO UPDATE SET 
                  mean_temp = EXCLUDED.mean_temp,
                  mean_salinity = EXCLUDED.mean_salinity,
                  surface_temp = EXCLUDED.surface_temp
            ''', (profile_id, p["stats"]["meanTemp"], p["stats"]["meanSalinity"], p["stats"]["surfaceTemp"]))

        conn.commit()
        print(f"DB Inserted/Updated Float {fid} with {len(profiles)} profiles.")
    except Exception as e:
        conn.rollback()
        print(f"Error inserting float {fid}: {e}")
    finally:
        cursor.close()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--float-id', help='Specific float id to parse')
    parser.add_argument('--all', action='store_true', help='Parse all discovered floats')
    parser.add_argument('--limit', type=int, help='Limit number of floats when using --all')
    args = parser.parse_args()

    data_dir = Path(os.getenv('ARGO_DATA_DIR', 'ARGO-DATA')).resolve()
    out_dir = Path(os.getenv('PROFILE_CACHE_DIR', 'data/derived/profiles')).resolve()
    
    conn = get_db_connection()
    if not conn:
        out_dir.mkdir(parents=True, exist_ok=True)

    if not data_dir.exists():
        raise SystemExit(f"ARGO_DATA_DIR does not exist: {data_dir}")

    all_files = list(find_netcdf_files(data_dir))
    if not all_files:
        raise SystemExit("No .nc files found")

    groups = aggregate_by_float(all_files)

    selected = []
    if args.float_id:
        if args.float_id in groups:
            selected = [(args.float_id, groups[args.float_id])]
        else:
            raise SystemExit(f"Float id {args.float_id} not found")
    elif args.all:
        items = list(groups.items())
        if args.limit:
            items = items[:args.limit]
        selected = items
    else:
        parser.error('Provide --float-id or --all')

    for fid, files in selected:
        profiles = []
        for f in files:
            profiles.extend(parse_file(f))
            
        if conn:
            insert_float_data(conn, fid, profiles)
        else:
            payload = {
                "floatId": fid,
                "profiles": profiles,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "sourceFileCount": len(files)
            }
            out_path = out_dir / f"{fid}.json"
            with open(out_path, 'w', encoding='utf-8') as fh:
                json.dump(payload, fh)
            print(f"Wrote {out_path} ({len(profiles)} profiles)")

    if conn:
        conn.close()

if __name__ == '__main__':
    main()
