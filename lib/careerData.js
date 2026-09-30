// Career Launch: the facts both the browser and the API routes need (no imports, no secrets).
// One list of roles / levels / languages, so the form and the server validation can never drift apart.

// `query` is what we search job boards with; `title` is the job title used in prompts.
export const ROLES = [
  { id: "frontend", emoji: "🎨", label: "Frontend Developer", title: "Frontend Developer", query: "Frontend Developer React", skills: ["React", "CSS", "JavaScript"], languages: ["JavaScript", "TypeScript"] },
  { id: "backend", emoji: "⚙️", label: "Backend Developer", title: "Backend Developer", query: "Backend Developer Node.js Python", skills: ["Node.js", "Python", "SQL"], languages: ["JavaScript", "Python"] },
  { id: "fullstack", emoji: "🔥", label: "Full Stack Developer", title: "Full Stack Developer", query: "Full Stack Developer", skills: ["React", "Node.js", "DB"], languages: ["JavaScript", "TypeScript"] },
  { id: "mobile", emoji: "📱", label: "Mobile Developer", title: "Mobile Developer", query: "Mobile Developer React Native", skills: ["React Native", "Flutter"], languages: ["JavaScript", "Dart"] },
  { id: "data", emoji: "📊", label: "Data Scientist", title: "Data Scientist", query: "Data Scientist Python ML", skills: ["Python", "ML", "SQL"], languages: ["Python", "SQL"] },
  { id: "devops", emoji: "🔧", label: "DevOps Engineer", title: "DevOps Engineer", query: "DevOps Engineer Docker AWS", skills: ["Docker", "AWS", "CI/CD"], languages: ["Python", "Bash"] },
  { id: "cs-student", emoji: "🎓", label: "CS Student", title: "Computer Science student looking for a first job or internship", query: "Junior Software Developer Student", skills: ["Algorithms", "Data Structures", "Java"], languages: ["Java", "Python"] },
];

export const LEVELS = ["student", "junior", "mid"]; // LEVELS[i] labels are translated in the UI
export const DIFFICULTIES = ["easy", "medium", "hard"];
export const QUESTION_TYPES = ["behavioral", "technical", "code"];
export const CODE_LANGUAGES = ["JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "SQL", "Dart", "Bash"];
export const AI_LANGS = ["he", "en", "ar"];

export const XP_BY_DIFFICULTY = { easy: 10, medium: 20, hard: 30 };

export const roleById = (id) => ROLES.find((r) => r.id === id) || null;

// LinkedIn's experience filter: 1 internship, 2 entry level, 3 associate, 4 mid-senior
const LINKEDIN_EXP = { student: "1,2", junior: "2", mid: "3,4" };

// Job board searches for a role, seniority and place. Every link opens the board's own search page.
export function buildJobLinks(roleId, level, location = "Israel") {
  const role = roleById(roleId);
  if (!role) return [];
  const q = encodeURIComponent(role.query);
  const loc = encodeURIComponent((location || "Israel").trim() || "Israel");
  const exp = encodeURIComponent(LINKEDIN_EXP[level] || "2");
  return [
    { id: "linkedin", label: "LinkedIn", url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}&f_E=${exp}` },
    { id: "indeed", label: "Indeed", url: `https://il.indeed.com/jobs?q=${q}&l=${loc}` },
    { id: "glassdoor", label: "Glassdoor", url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}&locKeyword=${loc}` },
    { id: "drushim", label: "דרושים", url: `https://www.drushim.co.il/jobs/search/${q}/` },
  ];
}
