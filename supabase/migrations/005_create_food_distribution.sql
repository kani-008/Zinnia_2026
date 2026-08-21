-- Migration: 005_create_food_distribution.sql
CREATE TABLE IF NOT EXISTS food_distribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  agent_id VARCHAR(32) NOT NULL,
  meal_session VARCHAR(32) NOT NULL DEFAULT 'LUNCH',
  collected BOOLEAN DEFAULT TRUE,
  collected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  scanned_by VARCHAR(255) NOT NULL,
  CONSTRAINT unique_food_per_session UNIQUE(participant_id, meal_session)
);

CREATE INDEX IF NOT EXISTS idx_food_agent_id ON food_distribution(agent_id);
