-- Incremental migration: run this once in the Supabase SQL Editor if you already
-- ran the original supabase/schema.sql (which now also contains these statements
-- for anyone setting up the project from scratch).

CREATE TABLE explore_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  language TEXT DEFAULT 'en',
  duration_sec INTEGER,
  difficulty TEXT DEFAULT 'beginner',
  thumbnail TEXT,
  channel TEXT,
  times_shown INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE explore_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES explore_videos(id) ON DELETE CASCADE,
  topic TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE explore_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE explore_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON explore_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "anyone signed in can read" ON explore_videos
  FOR SELECT USING (auth.role() = 'authenticated');
