
-- Create 3 shcemas 
CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS clean;
CREATE SCHEMA IF NOT EXISTS dwh;


-- Comments 
COMMENT ON SCHEMA raw   IS 'Raw data, an exact mirror of Olists CSV files';
COMMENT ON SCHEMA clean IS 'Clean data with correct types and no duplicates';
COMMENT ON SCHEMA dwh  IS 'Data Warehouse: star schema for analytics';