-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Magic tokens for passwordless auth
CREATE TABLE magic_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on token for fast lookups
CREATE INDEX idx_magic_tokens_token ON magic_tokens(token);
CREATE INDEX idx_magic_tokens_expires ON magic_tokens(expires_at);

-- Question sets (12-week rotating questions)
CREATE TABLE question_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 12),
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure unique week numbers
CREATE UNIQUE INDEX idx_question_sets_week ON question_sets(week_number);

-- Check-ins
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,

  -- Numeric data (revenue, hours, etc.)
  numeric_data JSONB NOT NULL,

  -- Narrative responses to rotating questions
  narrative_data JSONB NOT NULL,

  -- AI-generated summary (no recommendations)
  ai_summary TEXT,

  -- Pattern detection results
  patterns_detected JSONB,

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying check-ins
CREATE INDEX idx_check_ins_user ON check_ins(user_id);
CREATE INDEX idx_check_ins_submitted ON check_ins(submitted_at);

-- Ensure one check-in per user per week
CREATE UNIQUE INDEX idx_check_ins_user_week ON check_ins(user_id, year, week_number);

-- Email logs (track what we've sent)
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'weekly_checkin', 'post_submit', 'monday_followup'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE SET NULL,

  metadata JSONB -- store email-specific data
);

CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON question_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed default question sets
INSERT INTO question_sets (week_number, questions) VALUES
(1, '{"q1": "What decision are you avoiding?", "q2": "What feels harder than it should?"}'),
(2, '{"q1": "What would you do if you weren''t afraid of looking stupid?", "q2": "What are you tolerating?"}'),
(3, '{"q1": "What are you pretending not to know?", "q2": "Who are you trying to impress?"}'),
(4, '{"q1": "What would need to be true for this to feel easy?", "q2": "What conversation are you postponing?"}'),
(5, '{"q1": "What pattern keeps repeating?", "q2": "What story are you telling yourself?"}'),
(6, '{"q1": "What would you do with one less constraint?", "q2": "What felt surprisingly good this week?"}'),
(7, '{"q1": "What are you overcomplicating?", "q2": "What assumption might be wrong?"}'),
(8, '{"q1": "What would you stop doing if no one was watching?", "q2": "What tiny thing is draining you?"}'),
(9, '{"q1": "What trade-off are you ignoring?", "q2": "What does your gut already know?"}'),
(10, '{"q1": "What would you advise someone else to do?", "q2": "What are you optimizing for?"}'),
(11, '{"q1": "What would make next week 10% easier?", "q2": "What belief served you once but doesn''t now?"}'),
(12, '{"q1": "What are you learning about yourself?", "q2": "What do you need to accept?"}');
