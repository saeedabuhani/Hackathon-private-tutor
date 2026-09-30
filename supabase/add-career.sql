-- Career Launch tables. Run once in the Supabase SQL Editor (after schema.sql).
-- Safe to run again: every statement checks whether it already exists.

-- The user's career profile: one row per user
create table if not exists career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  role text,           -- frontend | backend | fullstack | mobile | data | devops | cs-student
  level text,          -- student | junior | mid
  skills text[],       -- e.g. {React,"Node.js",Python}
  languages text[],    -- programming languages, e.g. {JavaScript,Python}
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Interview questions that were asked, the answer, and the AI feedback
create table if not exists interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  role text,
  question text,
  question_type text,  -- behavioral | technical | code
  user_answer text,
  ai_feedback text,    -- JSON string: strengths, improvements, improved answer, tip
  score integer,       -- 0-100
  created_at timestamp default now()
);

-- Coding challenges: the problem, the user's code, the review, and the XP that was earned
create table if not exists code_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text,
  difficulty text,     -- easy | medium | hard
  language text,
  problem text,
  user_code text,
  ai_feedback text,
  is_correct boolean,
  xp_earned integer default 0,
  created_at timestamp default now()
);

-- Row Level Security: every user sees and changes only their own rows
alter table career_profiles enable row level security;
alter table interview_sessions enable row level security;
alter table code_challenges enable row level security;

drop policy if exists "own data" on career_profiles;
drop policy if exists "own data" on interview_sessions;
drop policy if exists "own data" on code_challenges;

create policy "own data" on career_profiles for all using (auth.uid() = user_id);
create policy "own data" on interview_sessions for all using (auth.uid() = user_id);
create policy "own data" on code_challenges for all using (auth.uid() = user_id);
