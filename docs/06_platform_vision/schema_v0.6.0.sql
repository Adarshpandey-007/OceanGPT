-- FloatChat v0.6.0 Schema Update: Planned Projects

CREATE TABLE IF NOT EXISTS planned_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) NOT NULL, -- e.g., 'Port', 'Desalination', 'Wind Farm'
    description TEXT,
    scale_budget_usd NUMERIC,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    geom GEOMETRY(Point, 4326), -- PostGIS Point geometry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the geometry column is updated when lat/lon change
CREATE OR REPLACE FUNCTION update_project_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_project_geom ON planned_projects;

CREATE TRIGGER trg_update_project_geom
BEFORE INSERT OR UPDATE ON planned_projects
FOR EACH ROW
EXECUTE FUNCTION update_project_geom();

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_planned_projects_geom ON planned_projects USING GIST (geom);
