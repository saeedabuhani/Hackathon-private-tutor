-- AI Studies tab: curated videos (YouTube embeds or direct file URLs).
-- Run once in the Supabase SQL Editor. The same statements are appended to schema.sql
-- for anyone setting the project up from scratch.

CREATE TABLE ai_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT,
  youtube_id TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_sec INTEGER,
  language TEXT DEFAULT 'he',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ai_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read ai_videos"
  ON ai_videos FOR SELECT USING (true);
CREATE POLICY "service role can write"
  ON ai_videos FOR ALL USING (auth.role() = 'service_role');
