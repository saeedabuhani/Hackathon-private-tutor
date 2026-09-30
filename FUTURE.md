# 🔭 Leviathan — Roadmap

What exists today, what we build next, and what we would like to build later.
**Nothing marked 🟡 or 🔭 is implemented yet** — this file is the plan, not a feature list.

Legend: ✅ done · 🟡 next · 🔭 later

---

## 1. Career Launch for every profession (top priority) 🟡

**Today:** Career Launch covers software and computer science only — 7 roles (Frontend,
Backend, Full Stack, Mobile, Data, DevOps, CS Student). The job search, the LinkedIn kit, the
interview questions and the coding challenges are all written for developers.

**Goal:** a student of *any* field can find a job and prepare for it: medicine, nursing,
teaching, law, accounting and finance, psychology and social work, design and architecture,
civil / electrical / mechanical engineering, marketing, HR, business, and more.

### What changes

| Part | Today | Next |
|---|---|---|
| **Choosing a field** | one flat list of 7 developer roles | two steps: **field** (Technology, Health, Education, Law, Business & Finance, Engineering, Design, Marketing, …) → **role** inside it. A "my role isn't listed" option lets the student type their own |
| **Job search links** | LinkedIn, Indeed, Glassdoor, Drushim with developer keywords | the same boards with keywords **per role**, plus boards that fit the field (for example AllJobs for general roles, and a hospital / school / ministry careers page where it makes sense) |
| **LinkedIn kit** | headline, About, skills, tips for a developer | the same kit, written for the chosen role; the skills and tips come from the role, not from a developer list |
| **Interview** | behavioral, technical, code review | behavioral + **field questions** + a **case / scenario** type (a clinical case, a classroom situation, a legal case, a budget problem, a design critique) |
| **Code** tab | coding challenges | stays for technology roles. For other fields it becomes a **Practice task** tab: a realistic work exercise (write a lesson plan, analyse a balance sheet, draft a short legal memo, plan a campaign) that the AI reviews against a rubric |
| **XP** | easy / medium / hard per coding challenge | the same server-side rules apply to practice tasks: XP only for a good score, once per task |
| **Summary PDF** | profile, interviews, challenges | the same, with the new task type |

### How it fits the code we have
The design already keeps the facts in one place, so this is an extension, not a rewrite:
- `lib/careerData.js` — the list of roles, levels, job-board links. Add a `field` to each role
  and group the picker by field.
- `lib/careerAI.js` — the prompts. The role title is already a parameter; we add the field and
  the new question / task types, and keep the same output cleaning and safety checks.
- `app/api/career/*` — the routes already validate everything against the lists in
  `careerData.js`, so new roles are accepted automatically once added there.
- `components/career/*` — `ProfileSetup` gets the field step; the Code tab is swapped for the
  Practice task tab when the field is not technology.
- `supabase/` — `career_profiles.role` is plain text, so **no new table** is needed; a `field`
  column is the only database change.

### Things we must do carefully
- **Health, law and finance:** the AI gives practice and feedback, not advice. The screen says
  so, and answers are never presented as medical or legal guidance.
- **Quality per field:** each field's first questions and rubric are reviewed by someone who
  knows the field before we call it ready.
- **Language:** every new label is added in Hebrew, Arabic and English (RTL included).

### Stretch ideas for this part 🔭
- Real job listings inside the app through a licensed job-search API (LinkedIn has no public
  search API, so this needs a provider we can use legally).
- A **CV builder** and an ATS check: paste a CV and a job post, get what is missing.
- A **job tracker**: saved jobs, status (applied / interview / offer), reminders.
- **Voice interview**: speak the answer, get feedback on content and delivery.
- Salary ranges and a "skills gap" view per role.

---

## 2. Learning features 🟡 / 🔭

- 🟡 **Flashcards and spaced repetition** generated from a material's summary.
- 🟡 **Leaderboard and streaks** on top of the XP we already track.
- 🔭 **Study groups** (the old Community idea, built properly): share a material with friends,
  study the same topic together, a shared Gap Map.
- 🔭 **Teacher view**: a teacher uploads a course, sees where the class is stuck (Gap Map
  across students).
- 🔭 **Voice Tutor**: ask by voice, hear the answer.
- 🔭 More languages beyond Hebrew, Arabic and English.
- 🔭 An **admin page** for AI Studies and the Explore catalog, instead of a protected API route.

## 3. Code practice 🔭

- **Run the code for real** in a sandbox (for example a hosted code-execution service), so a
  solution is checked by tests and not only read by the AI. Today the review is by the AI and
  the screen says so.
- Test cases per challenge, a timer, and a history of solved problems.

## 4. Quality and operations 🟡 / 🔭

- 🟡 **Automated tests** for the API routes and the main flows (today we test by hand and with
  scripted browser runs).
- 🟡 **Verify the signed-in user's token on every API route.** Today the Career, saved-chat and delete routes do; the older Tutor, Feed, Explore and XP routes still trust the `userId` sent by the app. This is the most important security item.
- 🟡 **Rate limits** on the AI routes, so one user cannot use up the OpenAI budget.
- 🟡 **Accessibility review** (keyboard use, contrast, screen readers) on every page.
- 🔭 A mobile-friendly install (PWA) and offline reading of saved summaries.
- 🔭 Error tracking and usage analytics.
- 🔭 Raise the upload size on hosting that allows it (Vercel's request limit is 4.5 MB today).

---

## Known limits today (honest list)

- Career Launch is for software / computer-science roles only (see section 1).
- The code review is done by the AI reading the code; it does not run it.
- The LinkedIn, Indeed, Glassdoor and Drushim buttons open each site's own search page; we do
  not read or store any job listings.
- On Vercel, uploads above 4.5 MB fail; the YouTube API has a daily quota.
- Some older API routes (Tutor chat, Feed, Explore, XP) trust the `userId` the app sends instead of checking the user's token; the Career and saved-chat routes do check it.
- AI answers can be wrong; the Tutor shows when an answer comes from the student's material
  and when it is general knowledge.
