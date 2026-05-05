-- FloatChat v0.7.0 Schema Update: Legal Zones

CREATE TABLE IF NOT EXISTS legal_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(100) NOT NULL, -- e.g., 'India', 'International'
    zone_type VARCHAR(100) NOT NULL, -- e.g., 'Marine Protected Area', 'CRZ-1A'
    restrictions_summary TEXT,
    geom GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_legal_zones_geom ON legal_zones USING GIST (geom);
