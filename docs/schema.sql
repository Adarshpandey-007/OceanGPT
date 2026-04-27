-- PostgreSQL / PostGIS Schema Draft (v0.1)
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;  -- if pgvector is used for embeddings

-- FLOATS: One row per physical float (WMO identifier)
CREATE TABLE floats (
  id SERIAL PRIMARY KEY,
  wmo_id VARCHAR(16) UNIQUE NOT NULL,
  launch_date TIMESTAMP WITH TIME ZONE,
  last_observation TIMESTAMP WITH TIME ZONE,
  geom GEOGRAPHY(POINT, 4326),
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_floats_geom ON floats USING GIST (geom);
CREATE INDEX idx_floats_last_obs ON floats(last_observation DESC);

-- PROFILES: One row per profile (cycle) per float
CREATE TABLE profiles (
  id BIGSERIAL PRIMARY KEY,
  float_id INTEGER NOT NULL REFERENCES floats(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  position_geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  min_depth DOUBLE PRECISION,
  max_depth DOUBLE PRECISION,
  qc_status VARCHAR(16) DEFAULT 'unknown',
  source_checksum CHAR(32), -- MD5 of source NetCDF file
  raw_source_path TEXT,     -- for provenance / reprocessing
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(float_id, cycle_number)
);

CREATE INDEX idx_profiles_float_time ON profiles(float_id, timestamp DESC);
CREATE INDEX idx_profiles_time ON profiles(timestamp DESC);
CREATE INDEX idx_profiles_qc ON profiles(qc_status);
CREATE INDEX idx_profiles_geom ON profiles USING GIST (position_geom);

-- MEASUREMENTS: Vertical measurements within a profile
CREATE TABLE measurements (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  depth DOUBLE PRECISION NOT NULL,          -- dbar
  temperature REAL,                         -- °C
  salinity REAL,                            -- PSU
  oxygen REAL,                              -- umol/kg (future)
  nitrate REAL,                             -- umol/kg (future)
  chlorophyll REAL,                         -- mg/m^3 (future)
  temperature_qc SMALLINT,                  -- numeric QC codes
  salinity_qc SMALLINT,
  oxygen_qc SMALLINT,
  nitrate_qc SMALLINT,
  chlorophyll_qc SMALLINT
);

CREATE INDEX idx_measurements_profile ON measurements(profile_id);
CREATE INDEX idx_measurements_profile_depth ON measurements(profile_id, depth);

-- PROFILE STATS: Derived summary metrics
CREATE TABLE profile_stats (
  profile_id BIGINT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  mean_temp REAL,
  mean_salinity REAL,
  surface_temp REAL,
  mixed_layer_depth REAL,
  depth_range REAL[],           -- {min,max}
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- EMBEDDINGS: Schema & profile textual summaries
-- pgvector dimension placeholder (e.g., 1536 for OpenAI, 768 for MiniLM)
CREATE TABLE embeddings (
  id BIGSERIAL PRIMARY KEY,
  object_type VARCHAR(32) NOT NULL,           -- 'profile' | 'schema' | 'float'
  object_id BIGINT,                           -- nullable for schema-level rows
  embedding vector(768),                      -- adjust dimension as needed
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_embeddings_object ON embeddings(object_type, object_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding) WITH (lists = 100);

-- OPTIONAL: INGEST ERRORS (future)
-- CREATE TABLE ingest_errors (
--   id BIGSERIAL PRIMARY KEY,
--   source_path TEXT,
--   error_message TEXT,
--   attempt_count INT DEFAULT 1,
--   last_attempt TIMESTAMPTZ DEFAULT now()
-- );

-- TRIGGERS: Update timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_floats_updated
BEFORE UPDATE ON floats
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- SAMPLE MATERIALIZED VIEW (future): recent profiles summary
-- CREATE MATERIALIZED VIEW recent_profile_stats AS
-- SELECT p.id as profile_id, f.wmo_id, p.timestamp, s.mean_temp, s.mean_salinity
-- FROM profiles p
-- JOIN floats f ON f.id = p.float_id
-- LEFT JOIN profile_stats s ON s.profile_id = p.id
-- WHERE p.timestamp > now() - interval '30 days';

-- Vacuum / analyze strategy and partitioning (future):
-- Optionally partition profiles & measurements by month or year for very large volumes.

-- SECURITY: grant least privileges to application role (example)
-- CREATE ROLE app_user LOGIN PASSWORD '***';
-- GRANT CONNECT ON DATABASE floatchat TO app_user;
-- GRANT USAGE ON SCHEMA public TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
