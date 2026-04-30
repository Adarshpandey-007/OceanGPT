"""
Seed ChromaDB with profile summaries from PostgreSQL.
Generates text embeddings using all-MiniLM-L6-v2 for semantic search.

Usage:
  cd FloatChat
  venv\Scripts\python.exe scripts\ingest\seed_chromadb.py
"""

import os
import sys
import psycopg2
import chromadb
from chromadb.utils import embedding_functions

# Load .env manually (no dotenv dependency needed)
def load_env(path=".env"):
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())

load_env()

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:a6364%40@localhost:5432/floatchat")
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_data")
COLLECTION_NAME = "float_summaries"
BATCH_SIZE = 200

def get_profile_summaries(conn):
    """Fetch profile summaries with stats from PostgreSQL."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            f.wmo_id,
            p.cycle_number,
            p.latitude,
            p.longitude,
            p.timestamp,
            p.min_depth,
            p.max_depth,
            ps.mean_temp,
            ps.mean_salinity,
            ps.surface_temp,
            ps.mixed_layer_depth
        FROM profiles p
        JOIN floats f ON f.id = p.float_id
        LEFT JOIN profile_stats ps ON ps.profile_id = p.id
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL
        ORDER BY f.wmo_id, p.cycle_number
    """)
    rows = cursor.fetchall()
    cursor.close()
    return rows

def build_summary_text(row):
    """Create a natural language summary for embedding."""
    wmo_id, cycle, lat, lon, ts, min_d, max_d, mean_t, mean_s, surf_t, mld = row
    
    parts = [f"Float {wmo_id} cycle {cycle}"]
    
    if lat is not None and lon is not None:
        # Determine ocean region
        region = get_ocean_region(lat, lon)
        parts.append(f"at ({lat:.2f}, {lon:.2f}) in the {region}")
    
    if ts:
        parts.append(f"observed {ts.strftime('%Y-%m-%d')}")
    
    if min_d is not None and max_d is not None:
        parts.append(f"depth range {min_d:.0f}-{max_d:.0f}m")
    
    if mean_t is not None:
        parts.append(f"mean temperature {mean_t:.1f}°C")
    
    if surf_t is not None:
        parts.append(f"surface temperature {surf_t:.1f}°C")
    
    if mean_s is not None:
        parts.append(f"mean salinity {mean_s:.2f} PSU")
    
    if mld is not None and mld > 0:
        parts.append(f"mixed layer depth {mld:.0f}m")
    
    return ", ".join(parts) + "."

def get_ocean_region(lat, lon):
    """Simple region classifier for Indian Ocean context."""
    if lat > 20 and lon > 60 and lon < 80:
        return "Arabian Sea"
    elif lat > 0 and lat <= 20 and lon > 60 and lon < 80:
        return "Arabian Sea (south)"
    elif lat > 5 and lon >= 80 and lon < 100:
        return "Bay of Bengal"
    elif lat > -10 and lat <= 5 and lon > 70 and lon < 100:
        return "equatorial Indian Ocean"
    elif lat <= -10 and lat > -40 and lon > 40 and lon < 120:
        return "southern Indian Ocean"
    elif lat > 0 and lon >= 100:
        return "eastern Indian Ocean"
    elif lat > 0 and lon < 60:
        return "western Indian Ocean"
    else:
        return "Indian Ocean region"

def main():
    print(f"Connecting to PostgreSQL: {DB_URL[:40]}...")
    conn = psycopg2.connect(DB_URL)
    
    print("Fetching profile summaries from database...")
    rows = get_profile_summaries(conn)
    print(f"  Found {len(rows)} profiles")
    
    if not rows:
        print("No profiles found. Exiting.")
        conn.close()
        return
    
    # Initialize ChromaDB
    chroma_path = os.path.abspath(CHROMA_PATH)
    print(f"Initializing ChromaDB at: {chroma_path}")
    client = chromadb.PersistentClient(path=chroma_path)
    
    # Delete existing collection if present (fresh seed)
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"  Deleted existing '{COLLECTION_NAME}' collection")
    except Exception:
        pass
    
    # Create collection with embedding function
    print("  Loading embedding model (all-MiniLM-L6-v2)...")
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"description": "ARGO float profile summaries for semantic search"}
    )
    
    # Build documents and metadata
    print("Building summary documents...")
    documents = []
    metadatas = []
    ids = []
    
    for row in rows:
        wmo_id, cycle, lat, lon, ts, min_d, max_d, mean_t, mean_s, surf_t, mld = row
        
        doc = build_summary_text(row)
        meta = {
            "wmo_id": str(wmo_id),
            "cycle": int(cycle) if cycle else 0,
            "latitude": float(lat) if lat else 0.0,
            "longitude": float(lon) if lon else 0.0,
        }
        if mean_t is not None:
            meta["mean_temp"] = float(mean_t)
        if mean_s is not None:
            meta["mean_salinity"] = float(mean_s)
        
        doc_id = f"{wmo_id}_{cycle}"
        
        documents.append(doc)
        metadatas.append(meta)
        ids.append(doc_id)
    
    # Insert in batches
    total = len(documents)
    print(f"Inserting {total} documents into ChromaDB (batch size {BATCH_SIZE})...")
    
    for i in range(0, total, BATCH_SIZE):
        batch_end = min(i + BATCH_SIZE, total)
        collection.add(
            documents=documents[i:batch_end],
            metadatas=metadatas[i:batch_end],
            ids=ids[i:batch_end]
        )
        print(f"  Batch {i//BATCH_SIZE + 1}: inserted {batch_end - i} docs ({batch_end}/{total})")
    
    # Verify
    count = collection.count()
    print(f"\nDone! ChromaDB collection '{COLLECTION_NAME}' now has {count} documents.")
    
    # Quick test query
    print("\nTest query: 'high salinity Arabian Sea'")
    results = collection.query(query_texts=["high salinity Arabian Sea"], n_results=3)
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        dist = results["distances"][0][i] if results.get("distances") else "N/A"
        print(f"  {i+1}. [{meta['wmo_id']}] (dist={dist:.3f}) {doc[:100]}...")
    
    conn.close()
    print("\nSeeding complete.")

if __name__ == "__main__":
    main()
