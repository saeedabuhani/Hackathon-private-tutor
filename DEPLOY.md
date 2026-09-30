# Deploy to Vercel

Run these yourself: they need your Vercel login and push your secret keys.

## 1. Log in and link
```bash
cd Hackathon-private-tutor
npx vercel login
npx vercel link
```
Answer: create a new project, name `private-tutor`, framework Next.js (auto-detected), no overrides.

## 2. First deploy (to learn the URL)
```bash
npx vercel --prod
```
Copy the production URL it prints (e.g. `https://private-tutor-xxxx.vercel.app`).

## 3. Environment variables
Either use the script (reads `.env.local`, values are piped in, never printed):
```bash
powershell -ExecutionPolicy Bypass -File scripts\vercel-env.ps1 -AppUrl https://YOUR-URL.vercel.app
```
or add them by hand in Vercel -> Project -> Settings -> Environment Variables (Production):

| Name | Note |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no trailing spaces |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, never `NEXT_PUBLIC_` |
| `OPENAI_API_KEY` | |
| `OPENAI_MODEL` | `gpt-4o` |
| `YOUTUBE_API_KEY` | |
| `YOUTUBE_REGION` | optional, default `IL` |
| `ADMIN_API_KEY` | protects `POST /api/ai-videos/add`; any long random string |
| `NEXT_PUBLIC_APP_URL` | the production URL |

`NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after setting them**:
```bash
npx vercel --prod
```

## 4. Supabase
Authentication -> URL Configuration: set Site URL to the production URL (Confirm email stays off).

## Known limits on Vercel
- **Request body max is 4.5 MB.** Uploads bigger than that fail on Vercel even though they work on localhost. Demo with a PDF under ~4 MB.
- API routes have `maxDuration = 60` (the Hobby-plan maximum). A big PDF (many chunks) can take 20-40 s to embed.
- The YouTube cache is in memory per serverless instance, so it resets often; the API quota (10,000 units/day, 100 per search, 3 searches per topic) is the real limit: about 33 new topics per day.
- Never commit `.env.local` (it is git-ignored).

## After deploying
Run the checklist in `DEMO.md` against the production URL, not localhost.
