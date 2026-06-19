# Platform Features and Database Schema

## 1. Feature Modules

### A. Smart Advisor Mode (The Foundation)
- **Auto-Control of Visualizations:** Gemini can emit commands to change the UI state. If a user asks "Show me the temperature profile," Gemini responds with text AND a command to switch to the Plot tab and load a specific float.
- **Data Gap Filling:** If specific date/location data is missing, Gemini uses historical averages (via RAG) to provide "Estimated" answers, clearly marked to prevent hallucination.
- **Contextual Memory:** The system remembers the active location, time, and topic across chat turns.

### B. Project Planner & Evaluate Mode
- **Project Wizard:** Define project type, location, scale, and timeline.
- **Nature Advocate Evaluation:** An AI mode that aggressively critiques the project from a sustainability perspective. It provides a "Sustainability Score" (0-100) and highlights Red Flags.
- **Impact Assessment:** Calculates potential ecosystem disruption based on local oceanographic data.

### C. Legal Expert Mode
- **Multi-Jurisdiction Knowledge Base:** Embeddings of environmental laws from India (CRZ, WPA), USA, EU, UN (UNCLOS), and 10+ other major jurisdictions.
- **Compliance Checker:** Cross-references proposed project locations with zoning laws and protected areas.
- **Comparative Law:** Can compare how different countries handle specific coastal issues.

### D. Social Impact & Economic Factors
- **Stakeholder Matrix:** Analyzes impact on local fishing communities, tourism, and residents.
- **Socio-Economic Synthesis:** Ensures every environmental report includes a section on human impact, preventing "nature-only" vacuum analysis.

---

## 2. Proposed Database Schema Extensions

To support the new features, the PostgreSQL database needs expanding.

```sql
-- Extension to existing PostGIS schema

-- 1. Projects Table (User planned coastal projects)
CREATE TABLE planned_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) NOT NULL, -- e.g., 'Port', 'Desalination', 'Wind Farm'
    description TEXT,
    scale_budget_usd NUMERIC,
    geom GEOMETRY(Polygon, 4326), -- Spatial boundary of the project
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Protected Areas & Legal Zones (For Compliance Checking)
CREATE TABLE legal_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(255),
    jurisdiction VARCHAR(100), -- 'India', 'International', etc.
    zone_type VARCHAR(100), -- 'Marine Protected Area', 'CRZ-1A', etc.
    geom GEOMETRY(MultiPolygon, 4326),
    restrictions_summary TEXT
);

-- 3. Social & Economic Data (Regional overlays)
CREATE TABLE coastal_demographics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_name VARCHAR(255),
    geom GEOMETRY(Polygon, 4326),
    primary_livelihood VARCHAR(100), -- e.g., 'Artisanal Fishing'
    population_density INT,
    economic_vulnerability_index NUMERIC
);

-- Indexes for fast spatial queries
CREATE INDEX idx_planned_projects_geom ON planned_projects USING GIST (geom);
CREATE INDEX idx_legal_zones_geom ON legal_zones USING GIST (geom);
CREATE INDEX idx_coastal_demo_geom ON coastal_demographics USING GIST (geom);
```

### ChromaDB Collections
- `float_summaries` (Existing)
- `environmental_laws` (New): Chunks of legal texts, tagged by `jurisdiction` and `topic`.
- `project_case_studies` (New): Historical coastal projects and their actual environmental outcomes for comparative analysis.
