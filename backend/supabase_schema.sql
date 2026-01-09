-- Supabase Schema for AQI Data Storage
-- Run this SQL in your Supabase SQL Editor

-- Table to store daily average AQI data for each ward
CREATE TABLE IF NOT EXISTS ward_aqi_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ward_name VARCHAR(255) NOT NULL,
    ward_no VARCHAR(50) NOT NULL,
    quadrant VARCHAR(10) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    date DATE NOT NULL,
    avg_aqi DOUBLE PRECISION NOT NULL,
    avg_pm25 DOUBLE PRECISION,
    avg_pm10 DOUBLE PRECISION,
    avg_no2 DOUBLE PRECISION,
    avg_o3 DOUBLE PRECISION,
    min_aqi DOUBLE PRECISION,
    max_aqi DOUBLE PRECISION,
    hourly_readings_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ward_no, date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ward_aqi_daily_ward_date ON ward_aqi_daily(ward_no, date DESC);
CREATE INDEX IF NOT EXISTS idx_ward_aqi_daily_date ON ward_aqi_daily(date DESC);
CREATE INDEX IF NOT EXISTS idx_ward_aqi_daily_quadrant ON ward_aqi_daily(quadrant);

-- Table to store ward metadata (the 4 selected wards)
CREATE TABLE IF NOT EXISTS selected_wards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ward_name VARCHAR(255) NOT NULL UNIQUE,
    ward_no VARCHAR(50) NOT NULL UNIQUE,
    quadrant VARCHAR(10) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 4 selected wards
INSERT INTO selected_wards (ward_name, ward_no, quadrant, latitude, longitude)
VALUES
    ('MODEL TOWN', '72', 'NE', 28.701933, 77.191341),
    ('BEGUMPUR', '27', 'NW', 28.765128, 77.022542),
    ('HAUZ RANI', '162', 'SE', 28.533246, 77.212759),
    ('NANGLI SAKRAVATI', '134', 'SW', 28.580401, 76.994073)
ON CONFLICT (ward_no) DO NOTHING;

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE ward_aqi_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_wards ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to AQI data
CREATE POLICY "Public read access for AQI data" ON ward_aqi_daily
    FOR SELECT USING (true);

-- Policy: Allow public read access to selected wards
CREATE POLICY "Public read access for selected wards" ON selected_wards
    FOR SELECT USING (true);

-- Policy: Allow service role to insert/update AQI data
CREATE POLICY "Service role can insert AQI data" ON ward_aqi_daily
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update AQI data" ON ward_aqi_daily
    FOR UPDATE USING (true);
