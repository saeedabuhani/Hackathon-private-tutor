# 🎓 Private Tutor + StudyFeed

A learning platform built for a Full Stack hackathon. It combines an AI tutor that answers
strictly from a student's own uploaded material with a TikTok-style video feed that follows
whatever the student is currently studying — plus a third, gamified feed for general browsing.

## 1. What it does

### 🧠 Smart Tutor
Upload a lecture (PDF, Word, or a photo of handwriting/a whiteboard). The app extracts the
text, chunks it, and embeds it for retrieval (RAG). Ask "what am I stuck on?" in Hebrew,
Arabic, or English (typos and mixed languages are handled), and the tutor:
- runs a short internal "thinking" pass before answering (Chain of Thought),
- answers **only from your material** when it genuinely explains the topic, and says so
  ("According to your material..."); if the material doesn't cover it, it says exactly that
  and then still gives a full general-knowledge explanation instead of refusing,
- classifies the type of confusion (unknown term / missing prerequisite / general confusion),
- shows a **Language Bridge**: the original term as written in the material, if the material
  is in a different language than the question,
- remembers the whole conversation (multi-turn chat, not a one-shot Q&A),
- can generate a professor-style exam question with an Active Recall hint (never reveals the
  answer), grade a free-text answer, and update a per-topic **Gap Map**,
- can summarize the entire uploaded material into a structured Markdown study sheet,
- **saves every conversation**: a left sidebar lists past chats (material name, preview, date),
  reopens one with its full history, and deletes it from a ··· menu. "Your Materials" is a
  2-column grid where a material (and, with it, its chats and progress) can be deleted.

### 📱 StudyFeed
A vertical, full-screen YouTube feed, split into Hebrew / Arabic / English tabs. It
**automatically re-fills** whenever the topic you're studying in the Tutor changes (shared
`activeTopic` state in Zustand) — a banner explains why the feed just changed. "Learn deeper"
sends you back to the Tutor with that topic pre-filled. Videos that fail to embed (region
blocked, embedding disabled) are detected and skipped automatically.

### 🎬 Explore
A gamified feed of short (≤60 seconds), curated videos across 12 general dev topics
(JavaScript, React, CSS, Git, API, Database, Node.js, HTML, Python, TypeScript, Docker, SQL).
After each video, a quick multiple-choice question appears; a correct answer awards XP and
moves to a new random topic, a wrong one keeps the same topic with a short AI explanation.

### 🤖 AI Studies
A curated vertical video feed (same look as Explore) that shows only the videos we add to the
`ai_videos` table — each either a YouTube embed or a direct video file — with a
"🤖 AI Generated" badge. No quiz: watching a video to the end earns +5 XP. Videos are added
through an admin-only route (`POST /api/ai-videos/add`, protected by `ADMIN_API_KEY`).

**StudyFeed, Explore, AI Studies and the Tutor are never shown at the same time** — one tab
at a time, synced through one shared piece of state.

## 2. Navigation

```
App
├── Auth: /login, /register (Supabase Auth)
└── (main) — top TabBar, always visible
    ├── 📱 /feed                         StudyFeed
    ├── 🧠 /tutor                        Smart Tutor
    │   ├── /tutor                       material list + upload
    │   └── /tutor/[materialId]          chat (topics list → deep Q&A with history)
    │       ├── /exam                    exam question + Active Recall hint
    │       └── /report                  Gap Map
    ├── 🎬 /explore                      Explore Feed
    └── 🤖 /ai-studies                   AI Studies (curated videos)
```

## 3. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, App Router, **JavaScript only** (no TypeScript) |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand (`activeTopic`, `activeLanguage`, `user`, `xp`) |
| Database | Supabase (PostgreSQL + `pgvector`), Row Level Security |
| Auth | Supabase Auth (email/password) |
| AI | OpenAI `gpt-4o` (temperature 0.3–0.4 depending on the task), `text-embedding-3-small` |
| Video | YouTube Data API v3 |
| File parsing | `pdf-parse` (PDF), `mammoth` (Word), GPT-4o Vision (images/handwriting) |
| Markdown/code rendering | `react-markdown`, `react-syntax-highlighter` |
| Deploy | Vercel |

## 4. Project structure

```
app/
├── (auth)/{login,register}/page.js
├── (main)/
│   ├── layout.js                 tab bar + session check
│   ├── feed/page.js               StudyFeed
│   ├── explore/page.js            Explore Feed
│   ├── ai-studies/page.js         AI Studies feed
│   └── tutor/
│       ├── layout.js               conversations sidebar + page
│       ├── page.js                 upload + "Your Materials" grid
│       └── [materialId]/
│           ├── page.js             chat (StuckInput); ?session=<id> reopens a saved chat
│           ├── exam/page.js        exam + Active Recall
│           └── report/page.js      gap map
└── api/
    ├── materials/route.js          upload -> extract -> chunk -> embed -> topics
    ├── stuck/route.js              deep RAG chat, history, Chain of Thought
    ├── exam/route.js               exam question + hint
    ├── hint/route.js               grade answer, Active Recall hint, gap map
    ├── summary/route.js            full-material Markdown summary
    ├── gap-map/route.js            GET/POST per-topic progress
    ├── xp/route.js                 add XP
    ├── sessions/                   saved chats: list/create, delete, messages (list/add)
    ├── feed/{route,question}.js    YouTube search, quick post-video question
    ├── explore/{videos,question,answer}/route.js
    └── ai-videos/{route.js,add/route.js}   AI Studies list + admin insert

components/
├── layout/       TabBar, TopNav
├── tutor/        StuckInput (chat), ChatSidebar, MaterialsGrid, ExamCard, GapMap, MessageContent, ...
├── feed/         VideoFeed, VideoSidebar, VideoControls, FeedSyncBanner, QuickQuestion
├── explore/      ExploreVideo, ExploreQuestion, ExploreExplain
└── ai-studies/   AiVideoPlayer

hooks/     useFeed, useGapMap
lib/       supabase.js, openai.js, embeddings.js, extract.js, youtube.js, youtubePlayer.js,
           utils.js (chunking, language detection), server.js (shared route helpers)
store/     useStore.js (Zustand)
supabase/  schema.sql, add-explore.sql
scripts/   seed-explore.js, vercel-env.ps1
```

## 5. Database schema

Defined in [`supabase/schema.sql`](./supabase/schema.sql) (run once in the Supabase SQL
Editor; `add-explore.sql` / `add-ai-videos.sql` / `add-chat-history.sql` are only needed if your project predates those features).

| Table | Purpose |
|---|---|
| `users` | Mirrors `auth.users` (auto-created on signup via trigger); tracks XP |
| `materials` | Uploaded files: extracted text, AI-extracted topics, file type |
| `embeddings` | 500-word chunks of each material + `vector(1536)` embeddings (pgvector) |
| `stuck_points` | Every question asked, its detected language, stuck-type, answer, language bridge |
| `quiz_attempts` | Exam answers, correctness, hint given |
| `gap_map` | Running per-topic score/attempts/stuck-count, per user and material |
| `explore_videos` | Shared catalog of short videos per topic, seeded from YouTube |
| `explore_attempts` | Explore Feed quiz answers per user |
| `chat_sessions` / `chat_messages` | Saved conversations per user and material, and their messages |
| `ai_videos` | Curated AI Studies videos (YouTube id or direct URL), ordered by `order_index` |

`match_chunks` (SQL function) does the cosine-similarity vector search behind RAG. Every
table has Row Level Security — each user only ever sees their own rows (`explore_videos` and
`ai_videos` are shared catalogs: readable by everyone, writable only by the service role).

## 6. API routes

| Route | Method | What it does |
|---|---|---|
| `/api/materials` | GET / POST | List materials, or upload one (extract → chunk → embed → topics) |
| `/api/stuck` | POST | Deep, multi-turn RAG chat with Chain-of-Thought and source transparency |
| `/api/exam` | POST | Generate a tricky exam question + Active Recall hint |
| `/api/hint` | POST | Grade a free-text answer, give a hint (never the answer), update gap map |
| `/api/summary` | POST | Summarize the whole material into structured Markdown |
| `/api/gap-map` | GET / POST | Read or update per-topic progress |
| `/api/xp` | POST | Add XP to a user |
| `/api/sessions` | GET / POST | List the caller's saved chats, or start one |
| `/api/sessions/[id]` | DELETE | Delete a chat and its messages |
| `/api/sessions/[id]/messages` | GET / POST | Read a chat's messages, or append one |
| `/api/materials/[id]` | DELETE | Delete a material (cascades to its chats, embeddings, progress) |
| `/api/feed` | GET | YouTube videos for a topic, in he/ar/en, filtered for embeddability |
| `/api/feed/question` | POST | Quick multiple-choice question from a video's title/description |
| `/api/explore/videos` | GET | One random, unseen-this-session short video for a topic |
| `/api/explore/question` | POST | Multiple-choice question for an Explore video |
| `/api/explore/answer` | POST | Record the answer, award XP, pick the next topic |
| `/api/ai-videos` | GET | AI Studies videos ordered by `order_index` (`?topic=&lang=`) |
| `/api/ai-videos/add` | POST | **Admin only** (header `x-admin-key`): add a YouTube or direct-file video |

## 7. Team & division of work

| Name | Area | Branch |
|---|---|---|
| **Saeed** | Base: auth, navigation, shared state and libraries, deployment | `feature/setup-auth-nav` |
| **Mohammed** | Smart Tutor — upload, RAG chat, saved chats sidebar, exam, hints, summary, gap map | `feature/smart-tutor` |
| **Arkan** | StudyFeed, Explore, AI Studies, database schema & seeding | `feature/studyfeed-explore-db` |

Saeed's base is merged into `main` first. Mohammed's and Arkan's branches are the base plus
only their own files (no feature imports another feature's files), so each one builds and
runs on its own (`npm install && npm run dev`) and the two merge with no conflicts.

## 8. Getting started

```bash
npm install
cp .env.example .env.local   # fill in the keys below
npm run dev
```

`.env.local` needs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `YOUTUBE_API_KEY`, `ADMIN_API_KEY`.

Then, in the Supabase SQL Editor, run `supabase/schema.sql`.

Seed the Explore Feed catalog once (uses YouTube API quota):
```bash
node scripts/seed-explore.js
```

See [DEPLOY.md](./DEPLOY.md) for deploying to Vercel, and [DEMO.md](./DEMO.md) for the
5-minute demo script and a full end-to-end test checklist.
