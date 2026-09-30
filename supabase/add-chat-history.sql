-- Chat history sidebar: saved conversations + their messages.
-- Run once in the Supabase SQL Editor (the same statements are appended to schema.sql
-- for anyone setting the project up from scratch).
--
-- Timestamps are TIMESTAMPTZ here (the older tables use plain TIMESTAMP): the sidebar shows
-- "today / yesterday" from updated_at, and a timezone-less value is parsed as local time by
-- the browser, which shifts it by hours.

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
