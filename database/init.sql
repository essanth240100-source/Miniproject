-- Initialize Travel Organizer Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- CREATE DATABASE travel_organizer;

-- Connect to the database
\c travel_organizer;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Insert some sample data for development
INSERT INTO trips (name, destination, start_date, end_date, description, budget, created_at, updated_at) VALUES
('Weekend in Paris', 'Paris, France', '2024-02-15', '2024-02-18', 'Romantic weekend getaway to the City of Light', 1500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Business Trip to Tokyo', 'Tokyo, Japan', '2024-03-10', '2024-03-15', 'Client meetings and project discussions', 3000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Family Vacation in Bali', 'Bali, Indonesia', '2024-06-20', '2024-06-30', 'Relaxing family vacation with beach activities', 4000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Solo Adventure in Iceland', 'Reykjavik, Iceland', '2024-08-05', '2024-08-12', 'Northern lights and nature exploration', 2500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cultural Tour of Italy', 'Rome, Italy', '2024-09-15', '2024-09-25', 'Historical sites and Italian cuisine', 3500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_end_date ON trips(end_date);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE travel_organizer TO travel_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO travel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO travel_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO travel_user;
