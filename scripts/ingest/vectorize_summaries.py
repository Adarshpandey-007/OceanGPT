#!/usr/bin/env python3
"""
Generate embeddings for float profiles and store them in ChromaDB.
"""
import os
import psycopg2
import chromadb
from chromadb.utils import embedding_functions

def get_db_connection():
    db_url = os.getenv('DATABASE_URL', 'postgres://floatchat:floatchat_dev@localhost:5433/floatchat')
    try:
        return psycopg2.connect(db_url)
    except Exception as e:
        print(f"Postgres connection failed: {e}")
        return None

def main():
    conn = get_db_connection()
    if not conn:
        return
        
    print("Connected to PostgreSQL")
    cursor = conn.cursor()
    
    # Query float and stats
    cursor.execute('''
        SELECT f.wmo_id, p.id as profile_id, p.latitude, p.longitude, 
               s.mean_temp, s.mean_salinity, s.surface_temp
        FROM floats f
        JOIN profiles p ON f.id = p.float_id
        LEFT JOIN profile_stats s ON p.id = s.profile_id
    ''')
    rows = cursor.fetchall()
    
    if not rows:
        print("No profiles found in DB.")
        return
        
    print(f"Found {len(rows)} profiles to vectorize.")
    
    # Initialize Local ChromaDB (No Docker required!)
    chroma_client = chromadb.PersistentClient(path="./chroma_data")
    
    # Use default sentence-transformers model
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    
    collection = chroma_client.get_or_create_collection(
        name="float_summaries",
        embedding_function=sentence_transformer_ef
    )
    
    documents = []
    metadatas = []
    ids = []
    
    for row in rows:
        wmo_id, profile_id, lat, lon, mean_temp, mean_salinity, surface_temp = row
        
        # Construct summary
        summary = f"ARGO Float {wmo_id} profile at latitude {lat:.4f}, longitude {lon:.4f}. "
        if mean_temp is not None:
            summary += f"Average temperature {mean_temp:.2f}C. "
        if mean_salinity is not None:
            summary += f"Average salinity {mean_salinity:.2f} PSU. "
        if surface_temp is not None:
            summary += f"Surface temperature {surface_temp:.2f}C."
            
        documents.append(summary)
        metadatas.append({
            "wmo_id": wmo_id,
            "profile_id": profile_id,
            "latitude": float(lat) if lat is not None else 0.0,
            "longitude": float(lon) if lon is not None else 0.0
        })
        ids.append(f"profile_{profile_id}")
        
    # Batch upsert
    batch_size = 500
    for i in range(0, len(ids), batch_size):
        end = min(i + batch_size, len(ids))
        collection.upsert(
            documents=documents[i:end],
            metadatas=metadatas[i:end],
            ids=ids[i:end]
        )
        print(f"Upserted {end}/{len(ids)} vectors to ChromaDB")
        
    print("Vectorization complete.")
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
