"""
Seed ChromaDB and PostGIS with mock environmental laws and legal zones.
Generates text embeddings using all-MiniLM-L6-v2 for semantic search.

Usage:
  cd FloatChat
  venv\Scripts\python.exe scripts\ingest\seed_laws.py
"""

import os
import psycopg2
import chromadb
from chromadb.utils import embedding_functions

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
COLLECTION_NAME = "environmental_laws"

# Mock Legal Texts for Vector DB
MOCK_LAWS = [
    {
        "jurisdiction": "India",
        "act": "Coastal Regulation Zone (CRZ) Notification 2019",
        "topic": "Prohibited Activities in CRZ-IA",
        "content": "In CRZ-IA (Ecologically Sensitive Areas), setting up of new industries and expansion of existing industries is prohibited. Construction of ports, jetties, and desalination plants is strictly regulated and requires extensive environmental clearance and impact assessment. Discharge of untreated wastewater or effluents is strictly forbidden."
    },
    {
        "jurisdiction": "India",
        "act": "Environment Protection Act, 1986",
        "topic": "Penalties for Contravention",
        "content": "Whoever fails to comply with or contravenes any of the provisions of this Act shall be punishable with imprisonment for a term which may extend to five years with fine which may extend to one lakh rupees, or with both."
    },
    {
        "jurisdiction": "United Nations",
        "act": "United Nations Convention on the Law of the Sea (UNCLOS)",
        "topic": "Protection and Preservation of the Marine Environment",
        "content": "States have the obligation to protect and preserve the marine environment. States shall take all measures necessary to prevent, reduce and control pollution of the marine environment from any source, using the best practicable means at their disposal. This includes pollution from land-based sources, pollution from seabed activities, and dumping."
    },
    {
        "jurisdiction": "International",
        "act": "Convention on Biological Diversity (CBD)",
        "topic": "Marine Protected Areas",
        "content": "Parties shall establish a system of marine and coastal protected areas or areas where special measures need to be taken to conserve biological diversity. Economic activities within these zones must not jeopardize the long-term survival of native species."
    }
]

# Mock Spatial Zones for PostGIS
# Format: name, jurisdiction, type, restrictions, WKT Polygon
MOCK_ZONES = [
    (
        "Mumbai Mangrove Buffer", 
        "India", 
        "CRZ-IA", 
        "No construction within 50m of mangroves.", 
        "POLYGON((72.7 18.8, 72.9 18.8, 72.9 19.1, 72.7 19.1, 72.7 18.8))" # A rough box around Mumbai
    ),
    (
        "Gulf of Kutch Marine National Park", 
        "India", 
        "Marine Protected Area", 
        "Complete ban on industrial activities and commercial fishing.", 
        "POLYGON((69.0 22.0, 70.5 22.0, 70.5 23.0, 69.0 23.0, 69.0 22.0))"
    ),
    (
        "Lakshadweep Coral Reserve", 
        "India", 
        "CRZ-IA (Coral Reef)", 
        "Strict prohibition of dredging, mining, and brine discharge.", 
        "POLYGON((71.0 10.0, 74.0 10.0, 74.0 12.0, 71.0 12.0, 71.0 10.0))"
    )
]

def seed_postgres():
    print("Connecting to PostgreSQL to seed Legal Zones...")
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    # Clear existing mock zones
    cursor.execute("DELETE FROM legal_zones")
    
    for zone in MOCK_ZONES:
        cursor.execute("""
            INSERT INTO legal_zones (zone_name, jurisdiction, zone_type, restrictions_summary, geom)
            VALUES (%s, %s, %s, %s, ST_GeomFromText(%s, 4326))
        """, zone)
        
    conn.commit()
    cursor.close()
    conn.close()
    print(f"  Inserted {len(MOCK_ZONES)} mock legal zones into PostGIS.")

def seed_chroma():
    chroma_path = os.path.abspath(CHROMA_PATH)
    print(f"Initializing ChromaDB at: {chroma_path}")
    client = chromadb.PersistentClient(path=chroma_path)
    
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"  Deleted existing '{COLLECTION_NAME}' collection")
    except Exception:
        pass
        
    print("  Loading embedding model (all-MiniLM-L6-v2)...")
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=ef,
        metadata={"description": "Environmental laws and regulations for Legal Expert mode"}
    )
    
    documents = []
    metadatas = []
    ids = []
    
    for i, law in enumerate(MOCK_LAWS):
        doc = f"{law['jurisdiction']} - {law['act']} - {law['topic']}:\n{law['content']}"
        meta = {
            "jurisdiction": law["jurisdiction"],
            "act": law["act"],
            "topic": law["topic"]
        }
        
        documents.append(doc)
        metadatas.append(meta)
        ids.append(f"law_{i}")
        
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"  Inserted {len(MOCK_LAWS)} legal documents into ChromaDB.")

def main():
    try:
        seed_postgres()
        seed_chroma()
        print("\nSeeding complete. Legal Expert Mode backend is ready.")
    except Exception as e:
        print(f"Error seeding data: {e}")

if __name__ == "__main__":
    main()
