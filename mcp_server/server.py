import os
import psycopg2
import chromadb
from chromadb.utils import embedding_functions
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv
load_dotenv()

# Initialize FastMCP Server
mcp = FastMCP("FloatChat")

DB_URL = os.getenv('DATABASE_URL', 'postgres://floatchat:floatchat_dev@localhost:5433/floatchat')

def get_db_connection():
    return psycopg2.connect(DB_URL)

@mcp.tool()
def query_argo_sql(query: str) -> str:
    """
    Execute a read-only SQL query against the ARGO PostgreSQL database.
    Schema:
    - floats(id, wmo_id, launch_date, last_observation, geom)
    - profiles(id, float_id, cycle_number, timestamp, latitude, longitude, min_depth, max_depth)
    - measurements(id, profile_id, depth, temperature, salinity)
    - profile_stats(profile_id, mean_temp, mean_salinity, surface_temp)
    """
    if "insert" in query.lower() or "update" in query.lower() or "delete" in query.lower() or "drop" in query.lower():
        return "Error: Only SELECT queries are allowed."
    
    try:
        conn = get_db_connection()
        conn.autocommit = False
        cursor = conn.cursor()
        
        # Enforce read only transaction
        cursor.execute("SET TRANSACTION READ ONLY;")
        
        # Limit rows to avoid massive outputs
        if "limit" not in query.lower():
            query = query.rstrip(';') + " LIMIT 100;"
            
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        
        result = f"Columns: {', '.join(columns)}\n"
        for row in rows:
            result += str(row) + "\n"
            
        cursor.close()
        conn.close()
        return result if rows else "No results found."
    except Exception as e:
        return f"Database Error: {str(e)}"

@mcp.tool()
def search_argo_vector(query: str, n_results: int = 5) -> str:
    """
    Perform a semantic search over ARGO float summaries using ChromaDB.
    Useful for answering conceptual questions like "Where are floats with high salinity?"
    """
    try:
        # Initialize Local ChromaDB (No Docker required!)
        chroma_client = chromadb.PersistentClient(path="./chroma_data")
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        collection = chroma_client.get_collection(name="float_summaries", embedding_function=sentence_transformer_ef)
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        output = "Semantic Search Results:\n"
        if not results['documents'] or not results['documents'][0]:
            return "No matching floats found."
            
        for i, doc in enumerate(results['documents'][0]):
            meta = results['metadatas'][0][i]
            output += f"- Float {meta['wmo_id']} at ({meta['latitude']}, {meta['longitude']}): {doc}\n"
            
        return output
    except Exception as e:
        return f"ChromaDB Error: {str(e)}"

@mcp.tool()
def get_nearest_floats(lat: float, lon: float, limit: int = 5) -> str:
    """
    Find the nearest ARGO floats to a specific latitude and longitude using PostGIS.
    """
    query = f"""
        SELECT wmo_id, ST_Y(geom::geometry) as lat, ST_X(geom::geometry) as lon,
               ST_Distance(geom, ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)::geography) / 1000.0 as dist_km
        FROM floats
        WHERE geom IS NOT NULL
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)::geography
        LIMIT {limit};
    """
    return query_argo_sql(query)

if __name__ == "__main__":
    # Start the MCP server using stdio transport
    mcp.run()
