"use client";

import "@/components/career/career.css";
import { useCallback, useEffect, useState } from "react";
import useStore from "@/store/useStore";
import { useTranslation } from "@/lib/translations";
import { authFetch } from "@/lib/authFetch";
import { roleById, AI_LANGS } from "@/lib/careerData";
import { useCareerText } from "@/components/career/careerText";
import { careerFetch, ErrorLine, Spinner } from "@/components/career/ui";
import ProfileSetup from "@/components/career/ProfileSetup";
import JobFinder from "@/components/career/JobFinder";
import InterviewPrep from "@/components/career/InterviewPrep";
import CodeChallenge from "@/components/career/CodeChallenge";

const TABS = [
  { id: "jobs", icon: "💼", title: "tabJobs", sub: "tabJobsSub" },
  { id: "interview", icon: "🎤", title: "tabInterview", sub: "tabInterviewSub" },
  { id: "code", icon: "💻", title: "tabCode", sub: "tabCodeSub" },
];
const AI_LANG_LABEL = { he: "עברית", en: "English", ar: "العربية" };

// Career Launch: prepares students for their first job. First a profile (field, level, skills), then
// three sections: Jobs (search links + an AI LinkedIn kit), Interview (AI practice) and Code
// (AI-written challenges). The PDF button downloads everything practiced so far.
export default function CareerPage() {
  const { lang: siteLang } = useTranslation();
  const { x } = useCareerText();
  const profile = useStore((s) => s.careerProfile); // undefined = loading, null = none yet
  const setProfile = useStore((s) => s.setCareerProfile);
  const setXP = useStore((s) => s.setXP);

  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("jobs");
  const [visited, setVisited] = useState(() => new Set(["jobs"]));
  const [aiLang, setAiLang] = useState(siteLang);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const data = await careerFetch("/api/career/profile");
      setProfile(data.profile);
    } catch (err) {
      setLoadError(err.message);
    }
  }, [setProfile]);

  useEffect(() => {
    if (profile === undefined) load();
  }, [profile, load]);

  // The AI writes in the language you pick here; it starts as the site language and is remembered
  useEffect(() => {
    try {
      const saved = localStorage.getItem("careerAiLang");
      if (AI_LANGS.includes(saved)) setAiLang(saved);
      else setAiLang(siteLang);
    } catch {
      setAiLang(siteLang);
    }
  }, [siteLang]);
  function pickAiLang(l) {
    setAiLang(l);
    try {
      localStorage.setItem("careerAiLang", l);
    } catch {
      // storage blocked: it just won't be remembered
    }
  }

  function openTab(id) {
    setTab(id);
    setVisited((v) => new Set(v).add(id));
  }

  async function downloadPdf() {
    setPdfBusy(true);
    setPdfError("");
    try {
      const res = await authFetch(`/api/career/summary?lang=${siteLang}`);
      if (!res.ok) {
        let message = x.errors.generic;
        try {
          message = (await res.json()).error || message;
        } catch {
          // not JSON
        }
        throw new Error(message);
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "Career-Prep-Summary.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err.message);
    } finally {
      setPdfBusy(false);
    }
  }

  const role = profile ? roleById(profile.role) : null;

  return (
    <div className="career-page mx-auto max-w-5xl space-y-4 px-3 py-6 sm:px-4">
      <header className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <h1 className="text-neon text-3xl font-extrabold">🚀 {x.title}</h1>
          <p className="mt-1 text-slate-300">{x.subtitle}</p>
        </div>
        {profile && !editing && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="career-chip is-on" dir="ltr">
              {role?.emoji} {role?.label} · {x.levelsShort[profile.level]}
            </span>
            <button type="button" onClick={() => setEditing(true)} className="career-mini-btn">
              ✎ {x.editProfile}
            </button>
          </div>
        )}
      </header>

      {profile === undefined && !loadError && (
        <div className="career-card">
          <Spinner label={x.loading} />
        </div>
      )}
      {loadError && (
        <div className="career-card space-y-3">
          <ErrorLine>{loadError}</ErrorLine>
          <button type="button" onClick={load} className="career-btn is-quiet">
            {x.retry}
          </button>
        </div>
      )}

      {(profile === null || editing) && profile !== undefined && (
        <ProfileSetup
          initial={profile}
          onCancel={profile ? () => setEditing(false) : undefined}
          onSaved={(saved) => {
            setProfile(saved);
            setEditing(false);
          }}
        />
      )}

      {profile && !editing && (
        <>
          <div className="career-tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" id={`career-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`career-panel-${t.id}`} onClick={() => openTab(t.id)} className={`career-tab ${tab === t.id ? "is-active" : ""}`}>
                <span className="career-tab-icon" aria-hidden="true">
                  {t.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-100">{x[t.title]}</span>
                  <span className="block text-xs text-slate-400">{x[t.sub]}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{x.aiLanguage}:</span>
              {AI_LANGS.map((l) => (
                <button key={l} type="button" onClick={() => pickAiLang(l)} aria-pressed={aiLang === l} className={`career-chip ${aiLang === l ? "is-on" : ""}`}>
                  {AI_LANG_LABEL[l]}
                </button>
              ))}
            </div>
            <button type="button" onClick={downloadPdf} disabled={pdfBusy} className="career-btn is-quiet">
              📄 {pdfBusy ? x.preparingPdf : x.downloadPdf}
            </button>
          </div>
          <ErrorLine>{pdfError}</ErrorLine>

          {/* All three stay mounted once opened, so a half-written answer or code survives switching tabs */}
          {visited.has("jobs") && (
            <section role="tabpanel" id="career-panel-jobs" aria-labelledby="career-tab-jobs" hidden={tab !== "jobs"}>
              <JobFinder profile={profile} aiLang={aiLang} />
            </section>
          )}
          {visited.has("interview") && (
            <section role="tabpanel" id="career-panel-interview" aria-labelledby="career-tab-interview" hidden={tab !== "interview"}>
              <InterviewPrep profile={profile} aiLang={aiLang} />
            </section>
          )}
          {visited.has("code") && (
            <section role="tabpanel" id="career-panel-code" aria-labelledby="career-tab-code" hidden={tab !== "code"}>
              <CodeChallenge profile={profile} aiLang={aiLang} onXp={setXP} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
