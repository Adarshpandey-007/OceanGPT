# Architecture and Technology Stack

## 1. Technology Stack and Justification

| Layer | Technology | Why Chosen for this Platform |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) | Enables seamless server-side rendering, robust API routes for LLM integration, and optimal performance for complex UI states (Map/Plot/Table). |
| **Styling** | Tailwind CSS + Glassmorphism | Provides a modern, "bioluminescent" deep-ocean aesthetic that feels premium and authoritative for government/official use. |
| **State Management** | Zustand | Lightweight and fast; perfect for managing complex cross-component state (e.g., Gemini controlling the Map and Plot from the Chat panel). |
| **Database (Relational & Spatial)** | PostgreSQL + PostGIS | Essential for geospatial queries ("Find projects near 15N 70E", "Is this within 500m of the coast?"). PostGIS is the industry standard for open-source spatial data. |
| **Vector Database (Semantic)** | ChromaDB | Stores embeddings of profile summaries and legal texts, enabling the RAG pipeline to answer conceptual questions ("Find laws regarding mangrove protection"). Runs locally/embedded for MVP simplicity. |
| **LLM Engine** | Google Gemini (2.5-flash) | Fast, highly capable of multi-turn tool calling, large context window (crucial for feeding legal documents and long data tables), and cost-effective. |
| **Tool Execution** | Model Context Protocol (MCP) Pattern | Decouples the AI reasoning from actual database execution. Next.js server acts as an MCP client executing local functions safely based on Gemini's requests. |

## 2. System Architecture Diagram

```mermaid
graph TD
    subgraph Frontend [Client Browser]
        UI[Next.js React UI]
        Chat[Chat Panel]
        Viz[Map / Plot / Table]
        UI --> Chat
        UI --> Viz
    end

    subgraph Backend [Next.js Server]
        API[/api/query]
        Router[Intent Router]
        LLM[Gemini Integration]
        Tools[MCP Tool Executor]
        
        Chat -- POST Prompt --> API
        API --> Router
        Router --> LLM
        LLM -- Tool Call Request --> Tools
        Tools -- Tool Result Data --> LLM
        LLM -- Synthesized Response & Viz Commands --> API
        API -- JSON Response --> Chat
    end

    subgraph Data Storage
        PG[(PostgreSQL + PostGIS)]
        Chroma[(ChromaDB)]
        
        Tools -- SQL/Spatial Query --> PG
        Tools -- Semantic Search --> Chroma
    end
    
    %% Interactions
    Chat -- Auto-Execute Viz Commands --> Viz
    PG -. Syncs summaries .-> Chroma
```

## 3. Tool Execution Flow (The "Brain")
1. User asks a broad question ("Evaluate building a port at 15N 70E").
2. Gemini receives the prompt + system instructions detailing available tools.
3. Gemini decides it needs data and returns a tool call: `get_nearest_floats(lat=15, lon=70)`.
4. Next.js server intercepts this, calls PostgreSQL/PostGIS, gets the data.
5. Server sends data back to Gemini: `Here is the data from your tool call: ...`
6. Gemini synthesizes the data into a layman-friendly response and decides the map should center on 15N 70E.
7. Gemini returns the text response AND a visualization command (`center_map`).
8. Frontend renders the text and automatically moves the map.
