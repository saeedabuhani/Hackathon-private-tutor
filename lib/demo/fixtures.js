// Sample data for the static demo build (NEXT_PUBLIC_DEMO=true). Nothing here comes from a real
// account, and no network call is made: lib/demo/install.js answers every /api request from this file.

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@leviathan.example",
  user_metadata: { name: "Demo" },
};

const day = 24 * 3600 * 1000;
const ago = (d) => new Date(Date.now() - d * day).toISOString().replace("Z", "");

export const materials = [
  { id: "m-js", title: "JavaScript Master Summary", topics: ["Arrays", "Loops", "Functions", "Objects", "async/await", "Closures"], created_at: ago(2), file_type: "pdf" },
  { id: "m-react", title: "React Hooks Cheat Sheet", topics: ["useState", "useEffect", "useMemo"], created_at: ago(5), file_type: "pdf" },
  { id: "m-db", title: "Intro to Databases", topics: ["SQL", "JOINs", "Indexes"], created_at: ago(9), file_type: "pdf" },
];

export const sessions = [
  { id: "s1", title: "JavaScript Master Summary", preview: "What is Arrays?", material_id: "m-js", materialTitle: "JavaScript Master Summary", updated_at: ago(0.1) },
  { id: "s2", title: "React Hooks Cheat Sheet", preview: "Explain useEffect with examples", material_id: "m-react", materialTitle: "React Hooks Cheat Sheet", updated_at: ago(1) },
  { id: "s3", title: "Intro to Databases", preview: "What is the difference between INNER JOIN and LEFT JOIN?", material_id: "m-db", materialTitle: "Intro to Databases", updated_at: ago(5) },
];

export const messages = {
  s1: [
    { id: "x1", role: "user", content: "What is Arrays?", created_at: ago(0.1) },
    {
      id: "x2",
      role: "assistant",
      content:
        "## 📌 In-depth explanation\nAn **array** is an ordered list of values. Each value has an index, and the first index is `0`.\n\n```javascript\nconst fruits = [\"apple\", \"banana\", \"orange\"];\nconsole.log(fruits[0]); // apple\n```\n\n- Index starts at `0`\n- Can store different types\n\n📖 According to your material: arrays are ordered lists.",
      stuck_type: "general",
      language_bridge: null,
      created_at: ago(0.1),
    },
  ],
  s2: [
    { id: "y1", role: "user", content: "Explain useEffect with examples", created_at: ago(1) },
    { id: "y2", role: "assistant", content: "## 📌 In-depth explanation\n`useEffect` runs code **after** React renders. The dependency array decides when it runs again.\n\n```javascript\nuseEffect(() => {\n  document.title = `Clicks: ${count}`;\n}, [count]);\n```", stuck_type: "general", language_bridge: null, created_at: ago(1) },
  ],
  s3: [
    { id: "z1", role: "user", content: "What is the difference between INNER JOIN and LEFT JOIN?", created_at: ago(5) },
    { id: "z2", role: "assistant", content: "## 📌 In-depth explanation\n`INNER JOIN` keeps only rows that match in both tables. `LEFT JOIN` keeps **all** rows from the left table and fills the missing right-side columns with `NULL`.", stuck_type: "term", language_bridge: null, created_at: ago(5) },
  ],
};

export const gaps = [
  { id: "g1", topic: "async/await", score_avg: 35, attempts_count: 3, stuck_count: 2 },
  { id: "g2", topic: "Closures", score_avg: 88, attempts_count: 4, stuck_count: 0 },
  { id: "g3", topic: "Promises", score_avg: 0, attempts_count: 0, stuck_count: 1 },
];

// Videos are placeholders in the demo: the player is replaced by a "playback disabled" card.
const v = (id, title, topic, lang, dur, channel) => ({
  id,
  youtubeId: id,
  title,
  description: "Short explainer: " + title,
  topic,
  subtopic: topic,
  language: lang,
  durationSec: dur,
  thumbnail: "",
  thumbnailUrl: "",
  videoUrl: "",
  channel,
  orderIndex: 0,
});

export const feedVideos = [
  v("demo-f1", "What is a closure? (60 seconds)", "Closures", "en", 62, "Sample channel"),
  v("demo-f2", "הסבר קצר על פונקציות", "Functions", "he", 58, "ערוץ לדוגמה"),
  v("demo-f3", "شرح المصفوفات في دقيقة", "Arrays", "ar", 55, "قناة تجريبية"),
];

export const exploreVideos = [
  v("demo-e1", "Promises explained in one minute", "JavaScript", "en", 60, "Sample channel"),
  v("demo-e2", "Git branches in 60 seconds", "Git", "en", 59, "Sample channel"),
  v("demo-e3", "What is an API?", "API", "en", 57, "Sample channel"),
];

export const aiVideos = [
  v("demo-a1", "Intro to the Leviathan study method", "Study skills", "en", 180, "Leviathan"),
  v("demo-a2", "How to ask better questions", "Study skills", "en", 140, "Leviathan"),
];

export const stuckAnswer = {
  explanation:
    "## 📌 In-depth explanation\n`async/await` lets you write code that waits for slow work (like a network request) **without** freezing the page.\n\n**Everyday analogy:** you order coffee, get a buzzer, and sit down. You do not stand at the counter; when the buzzer rings (the promise resolves) you pick up the coffee.\n\n```javascript\nasync function load() {\n  const res = await fetch(\"/api/data\");\n  return res.json();\n}\n```\n\n- `async` marks a function that returns a Promise\n- `await` pauses *that function* until the Promise settles\n\n📖 According to your material: slide 14 introduces `await` as syntax over Promises.",
  stuckType: "term",
  languageBridge: { original_term: "async / await", slide_ref: "Slide 14", translation: "Asynchronous functions" },
  detectedLang: "en",
  suggestedTopics: ["Promises", "Callbacks", "Event loop"],
};

export const examQuestion = {
  question: "Why does `typeof null` return 'object' in JavaScript?",
  hint: "Review the section on primitive types.",
  sourceReference: "Slide 12",
};

export const hintResult = {
  isCorrect: false,
  score: 40,
  feedback: "You are close: it is a historical bug, not a design choice. Re-read the primitives slide and mention how values were tagged internally.",
  sourceReference: "Slide 12",
  gap: { topic: "Primitives", score_avg: 40 },
};

export const feedQuestion = {
  question: "What does a closure keep access to?",
  options: ["The scope where it was created", "The global window only", "The browser history", "Nothing"],
  correct: "a",
};

export const exploreQuestion = {
  question: "What does a Promise represent?",
  optionA: "A value that will be available later",
  optionB: "A CSS animation",
  optionC: "A database table",
  correct: "A",
};

export const careerProfile = { role: "fullstack", level: "junior", skills: ["JavaScript", "React", "SQL"], languages: ["javascript", "python"] };

export const jobsKit = {
  headline: "Junior Full Stack Developer | React, Node.js, SQL",
  about:
    "Final-year Software Engineering student who builds complete web apps, from the database to the interface.\n\nI like turning unclear requirements into small, tested features, and I am looking for a junior role where I can keep learning from a team.",
  skills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Git", "REST APIs"],
  tips: [
    "Put one project with a live demo at the top of your profile.",
    "Add numbers to every bullet: users, speed-ups, test counts.",
    "Use the same keywords as the job post you apply to.",
  ],
};

export const interviewQuestion = {
  question: "Tell me about a time you had to learn something new very fast.",
  hint: "Use the STAR method: Situation, Task, Action, Result.",
  expectedKeywords: ["deadline", "learned", "result"],
};

export const interviewFeedback = {
  score: 82,
  strengths: ["Clear structure", "A concrete example"],
  improvements: ["Add a number (how long? how many users?)", "End with the measurable result"],
  improvedAnswer:
    "In my final-year project we had two weeks to add a live chat, so I prototyped with WebSockets first and shipped it with a 30% faster response time.",
  tip: "Prepare three stories you can reuse for different questions.",
  sessionId: "demo-session",
};

export const challenge = {
  title: "Sum of even numbers",
  description: "Write a function sumEven(numbers) that returns the sum of the even numbers in an array.",
  examples: [
    { input: "[1, 2, 3, 4]", output: "6" },
    { input: "[7, 9]", output: "0" },
  ],
  hints: ["Use the % operator to test for even numbers."],
  starterCode: "function sumEven(numbers) {\n  // your code\n}\n",
  token: "demo-token",
};

export const challengeReview = {
  isCorrect: true,
  score: 90,
  verdict: "✅ Correct and readable",
  issues: [],
  goodParts: ["Handles empty arrays", "Clear variable names"],
  optimalSolution: "const sumEven = (numbers) => numbers.filter((n) => n % 2 === 0).reduce((a, b) => a + b, 0);",
  explanation: "A filter + reduce version states the intent directly and avoids a mutable accumulator.",
  xpEarned: 10,
};
