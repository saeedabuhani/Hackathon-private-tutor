-- Run in Supabase SQL Editor, in this order.

CREATE EXTENSION IF NOT EXISTS vector;

-- Users (id matches auth.users so auth.uid() works with RLS)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auto-create a users row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  topics TEXT[],
  file_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,
  embedding vector(1536),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE TABLE stuck_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  user_question TEXT NOT NULL,
  detected_language TEXT,
  stuck_type TEXT,
  ai_explanation TEXT,
  language_bridge JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  topic TEXT,
  question TEXT,
  user_answer TEXT,
  is_correct BOOLEAN,
  hint_given TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE gap_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score_avg FLOAT DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  stuck_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, material_id, topic)
);

-- Explore Feed: a shared catalog of short (<=60s) YouTube videos per topic,
-- seeded by scripts/seed-explore.js. Not tied to any one user or material.
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

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stuck_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE explore_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE explore_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "own data" ON materials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own data" ON stuck_points FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own data" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own data" ON gap_map FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own embeddings" ON embeddings FOR ALL
  USING (material_id IN (SELECT id FROM materials WHERE user_id = auth.uid()));
CREATE POLICY "own data" ON explore_attempts FOR ALL USING (auth.uid() = user_id);
-- explore_videos is a shared catalog: any signed-in user can read it,
-- but only the service role (seeding script, API routes) can write to it.
CREATE POLICY "anyone signed in can read" ON explore_videos
  FOR SELECT USING (auth.role() = 'authenticated');

-- RAG search
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_material_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, chunk_text TEXT, chunk_index INTEGER, similarity FLOAT)
LANGUAGE SQL STABLE
AS $$
  SELECT id, chunk_text, chunk_index,
    1 - (embedding <=> query_embedding) AS similarity
  FROM embeddings
  WHERE material_id = match_material_id
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- AI Studies tab: curated videos (YouTube embeds or direct file URLs).
-- Written only through the admin route POST /api/ai-videos/add (service role).
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

-- Chat history sidebar: saved conversations + their messages (TIMESTAMPTZ, see add-chat-history.sql).
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  title TEXT,                    -- first thing the student asked (50 chars)
  preview TEXT,                  -- sidebar preview (80 chars)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,            -- 'user' | 'assistant'
  content TEXT NOT NULL,
  stuck_type TEXT,
  language_bridge JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX chat_sessions_user_updated_idx ON chat_sessions (user_id, updated_at DESC);
CREATE INDEX chat_messages_session_created_idx ON chat_messages (session_id, created_at);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own messages" ON chat_messages
  FOR ALL USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );
