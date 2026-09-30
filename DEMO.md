# Demo: Leviathan (5 minutes)

## Prep the night before (do all of it on the production URL)

- [ ] Two accounts: `demo` (clean, for the live run) and one you use for prep.
- [ ] Pick a **real PDF from the course** on async/await, **under 4 MB** (Vercel limit). Text-based PDF, not a scan.
- [ ] Upload it once on the `demo` account and wait for the topics to appear on its card. This is your **safe copy**; if the live upload is slow, open this card instead.
- [ ] Ask the Arabic question once (below) so you know the answer looks right and the Language Bridge has a real slide reference.
- [ ] **Seed the gap map** so the bars differ. It only shows real answers: open `Test me` for 3 topics from the material; answer one topic well, one badly, one so-so. (Goal like the doc: one topic low, one high.)
- [ ] Open the Feed once for `async/await` so the videos are cached, and confirm the he/ar/en tabs each play (click ▶). If a video errors it auto-skips after 2 s.
- [ ] Record a **backup screen video** of the full run (in case the internet fails).
- [ ] Charge the laptop, close other tabs, browser zoom 100 %, notifications off, log in beforehand.

## Health check (2 minutes, right before)

1. Log in, upload the PDF -> topics appear.
2. Ask the question -> answer + Language Bridge.
3. Feed shows the sync banner and plays a video.
4. If any step fails, switch to the backup video. Do not debug live.

## The script

**0:00 - 1:00, The story**
> "We're Full Stack students. Every new topic we wasted hours figuring out WHAT the material even says before we could start learning. We built the tool we wished we had."

**1:00 - 2:00, Upload**
Tutor tab -> drag in the PDF. While it processes: "It reads the file, splits it, and builds a search index of YOUR material." Topics appear on the card.
*If slow (>15 s): "While that finishes, here's one I uploaded earlier" and open the safe copy.*

**2:00 - 3:30, "What are you stuck on?" (the wow)**
Open the material. Type in Arabic:
`لا أفهم async/await ولماذا نحتاجه`
Point out, in order:
1. The answer comes back **in Arabic** (language detected automatically).
2. The badge: what kind of confusion it is (term / missing base / general).
3. The Feynman explanation with an everyday analogy.
4. **Language Bridge**: the original term and slide reference from the lecture.
> "ChatGPT gives a generic answer. This one answers from YOUR lecture, and if it isn't in your material, it says so."

(Optional 20 s if time: ask something the PDF doesn't cover to show "I couldn't find this in your uploaded material".)

**3:30 - 4:15, Feed sync (the magic)**
Click the **StudyFeed** tab. The banner says "Feed updated because you studied async/await". Videos in three languages. Click ▶ on a Hebrew or Arabic one, let it play a few seconds, then finish one / press `+10 XP` to show the quick question and the XP counter.
> "We never showed both at once. The Tutor sets the topic; the Feed follows it."

**4:15 - 5:00, Gap map + close**
Back to Tutor -> the material -> `Test me` (show the professor-style question and the hint that points to a slide but doesn't give the answer) -> `Gap map`, showing the seeded bars.
> "This project was born from OUR problem. Not another tool that explains: a tool that knows exactly what you don't understand and fixes it."

**Bonus (if time): Career Launch**
Click the **🚀 Career** tab. Pick a field and level, press *Create my kit* for the LinkedIn headline and About, then *Interview* -> *Ask me a question* -> answer -> see the score and the stronger version. Finish on *Code*: a challenge, a solution, the review and the XP.
> "Learning is half of it. The same app gets you ready for the first job."

## Judge questions (short answers)

- **Why not ChatGPT?** It hallucinates. We use RAG at temperature 0.3, so answers come only from the uploaded material, and it says when the info isn't there.
- **Why Supabase?** pgvector, Auth and DB in one place. No separate vector service in a 4-day hackathon.
- **How are Feed and Tutor connected?** One shared `activeTopic` in Zustand. The Tutor sets it, the Feed fetches videos when it changes.
- **Privacy?** Row Level Security: each user sees only their own files. Nothing is shared with third parties beyond the OpenAI and YouTube API calls.
- **Only handwriting, no PDF?** GPT-4o Vision reads handwriting and whiteboard photos. (Have a photo ready only if you tested it on your own handwriting; if not, don't claim it.)

## Things that can go wrong on stage

| Symptom | Do this |
|---|---|
| Upload hangs or fails | Open the pre-uploaded card |
| Vercel "413" / upload rejected | File is over 4.5 MB; use the safe copy |
| Feed says quota error | YouTube daily quota is used up; use the backup video, or a topic already opened during prep (cached) |
| A video shows an error | It skips itself after 2 s; press "Skip this video" to be faster |
| Wi-Fi dies | Play the backup video |

## Full end-to-end test checklist (run it once on the real material)

- [ ] Register a new user, log out, log in.
- [ ] Upload PDF -> topics + chunks; upload a Word file; upload a handwritten/whiteboard photo (note whether Vision reads it).
- [ ] Ask in Hebrew, Arabic and English: the reply language matches; Language Bridge appears when the material's language differs.
- [ ] Ask something not in the material -> "couldn't find" message, no invention.
- [ ] Exam: question is tricky, hint doesn't reveal the answer, a wrong answer lowers the bar, a right one raises it.
- [ ] Gap map bars per topic; XP counter survives a page refresh.
- [ ] Feed: banner on new topic, he/ar/en tabs, error auto-skip, Skip button, Learn deeper returns to the material with the topic filled in.
- [ ] RTL: Hebrew and Arabic text is right-aligned in answers, exam, hints, cards and sidebar; English terms inside stay readable.
- [ ] Phone-width window: nothing overflows.
- [ ] Career: save a profile, job links open in a new tab, LinkedIn kit, interview feedback with a score, a coding challenge gives XP once (solving it again gives none), the summary PDF downloads.
