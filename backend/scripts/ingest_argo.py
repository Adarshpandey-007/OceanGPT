import os
import argparse
from pathlib import Path
import netCDF4 as nc
import pandas as pd
import numpy as np
import chromadb
from chromadb.config import Settings
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load environment variables (expecting DATABASE_URL for PostGIS connection)
load_dotenv()

CHROMA_DB_PATH = Path(__file__).parent.parent / "chroma_data"

def init_chroma():
    """Initialize Embedded ChromaDB using the local persistence directory."""
    print(f"Initializing ChromaDB at {CHROMA_DB_PATH}")
    client = chromadb.PersistentClient(path=str(CHROMA_DB_PATH))
    collection = client.get_or_create_collection(
        name="argo_metadata",
        metadata={"hnsw:space": "cosine"}
    )
    return collection

def get_db_connection():
    """Establish connection to the PostGIS database."""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Warning: DATABASE_URL not set. Skipping PostGIS ingestion.")
        return None
    return psycopg2.connect(db_url)

def process_netcdf(file_path: str):
    """Read a NetCDF file, extract metadata and tabular data."""
    print(f"Reading NetCDF file: {file_path}")
    dataset = nc.Dataset(file_path, 'r')
    
    # Extract global metadata for vector search
    metadata_text = f"ARGO Float Data from file {Path(file_path).name}. "
    for attr in dataset.ncattrs():
        val = getattr(dataset, attr)
        metadata_text += f"{attr}: {val}. "
        
    float_id = "unknown"
    if 'platform_number' in dataset.variables:
        float_id = b"".join(dataset.variables['platform_number'][0].data).decode('utf-8').strip()
        
    print(f"Found Float ID: {float_id}")
    
    # Simple extraction of core variables (handling missing depending on ARGO standard)
    # Note: Real ARGO files can be complex, this is a simplified PoC extraction.
    records = []
    
    if 'PRES' in dataset.variables and 'TEMP' in dataset.variables and 'PSAL' in dataset.variables:
        pres = dataset.variables['PRES'][:]
        temp = dataset.variables['TEMP'][:]
        psal = dataset.variables['PSAL'][:]
        
        # Typically these are 2D arrays (N_PROF, N_LEVELS)
        if hasattr(pres, 'shape') and len(pres.shape) == 2:
            num_profiles = pres.shape[0]
            num_levels = pres.shape[1]
            for p in range(num_profiles):
                # We would also extract latitude/longitude/time per profile here
                for l in range(num_levels):
                    def is_masked(var_data, p, l):
                        if hasattr(var_data, 'mask'):
                            # Mask can be a single boolean or an array
                            mask = var_data.mask
                            if isinstance(mask, bool) or isinstance(mask, np.bool_):
                                return mask
                            return mask[p, l]
                        return False

                    records.append({
                        "float_id": float_id,
                        "profile": p,
                        "level": l,
                        "pressure": float(pres[p, l]) if not is_masked(pres, p, l) else None,
                        "temperature": float(temp[p, l]) if not is_masked(temp, p, l) else None,
                        "salinity": float(psal[p, l]) if not is_masked(psal, p, l) else None
                    })
    
    df = pd.DataFrame(records)
    return float_id, metadata_text, df

def ingest_to_chroma(collection, float_id: str, metadata_text: str):
    """Store the metadata string as a vector embedding in ChromaDB."""
    print(f"Generating embeddings and storing in ChromaDB for {float_id}...")
    collection.add(
        documents=[metadata_text],
        metadatas=[{"float_id": float_id}],
        ids=[f"float_meta_{float_id}"]
    )
    print("ChromaDB ingestion complete.")

def ingest_to_postgis(conn, df: pd.DataFrame):
    """Bulk insert the extracted data into PostGIS."""
    if conn is None or df.empty:
        return
    
    print(f"Ingesting {len(df)} records into PostGIS...")
    cursor = conn.cursor()
    
    # Assumes table exists (would typically run migrations first)
    # insert_query = "INSERT INTO argo_data (float_id, profile, level, pressure, temperature, salinity) VALUES %s"
    # execute_values(cursor, insert_query, [tuple(x) for x in df.to_numpy()])
    # conn.commit()
    
    print("PostGIS ingestion stub complete (Skipped actual SQL execution until schema is finalized).")

def main():
    parser = argparse.ArgumentParser(description="Ingest ARGO NetCDF files into ChromaDB and PostGIS.")
    parser.add_argument("file", help="Path to the .nc file to process")
    args = parser.parse_args()
    
    collection = init_chroma()
    conn = get_db_connection()
    
    float_id, metadata_text, df = process_netcdf(args.file)
    print(f"Extracted {len(df)} depth readings.")
    
    ingest_to_chroma(collection, float_id, metadata_text)
    ingest_to_postgis(conn, df)
    
    if conn:
        conn.close()
        
    print("Ingestion pipeline finished successfully!")

if __name__ == "__main__":
    main()
