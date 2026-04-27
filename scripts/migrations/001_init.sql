-- Initial schema migration
-- \echo 'Applying extensions'
CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS vector;  -- Removed: using ChromaDB for vector storage

-- \echo 'Creating tables'

-- FLOATS
CREATE TABLE IF NOT EXISTS floats (
  id SERIAL PRIMARY KEY,
  wmo_id VARCHAR(16) UNIQUE NOT NULL,
  launch_date TIMESTAMPTZ,
  last_observation TIMESTAMPTZ,
  geom GEOGRAPHY(POINT, 4326),
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_floats_geom ON floats USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_floats_last_obs ON floats(last_observation DESC);

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
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
  source_checksum CHAR(32),
  raw_source_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(float_id, cycle_number)
);
CREATE INDEX IF NOT EXISTS idx_profiles_float_time ON profiles(float_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_time ON profiles(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_qc ON profiles(qc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_geom ON profiles USING GIST (position_geom);

-- MEASUREMENTS
CREATE TABLE IF NOT EXISTS measurements (
  id BIGSERIAL PRIMARY KEY,
  profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  depth DOUBLE PRECISION NOT NULL,
  temperature REAL,
  salinity REAL,
  oxygen REAL,
  nitrate REAL,
  chlorophyll REAL,
  temperature_qc SMALLINT,
  salinity_qc SMALLINT,
  oxygen_qc SMALLINT,
  nitrate_qc SMALLINT,
  chlorophyll_qc SMALLINT
);
CREATE INDEX IF NOT EXISTS idx_measurements_profile ON measurements(profile_id);
CREATE INDEX IF NOT EXISTS idx_measurements_profile_depth ON measurements(profile_id, depth);

-- PROFILE STATS
CREATE TABLE IF NOT EXISTS profile_stats (
  profile_id BIGINT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  mean_temp REAL,
  mean_salinity REAL,
  surface_temp REAL,
  mixed_layer_depth REAL,
  depth_range REAL[],
  computed_at TIMESTAMPTZ DEFAULT now()
);

-- EMBEDDINGS (Migrated to ChromaDB)
-- CREATE TABLE IF NOT EXISTS embeddings (
--   id BIGSERIAL PRIMARY KEY,
--   object_type VARCHAR(32) NOT NULL,
--   object_id BIGINT,
--   embedding vector(768),
--   text TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS idx_embeddings_object ON embeddings(object_type, object_id);
-- CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding) WITH (lists = 100);

-- Update timestamp trigger
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

-- End
