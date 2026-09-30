"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { buildJobLinks } from "@/lib/careerData";
import { useCareerText } from "./careerText";
import { careerFetch, CopyButton, ErrorLine, Spinner } from "./ui";

// Smart job search: direct search links for your field and level on four job boards, plus an
// AI-written LinkedIn kit (headline, About, skills to add, 3 tips) from GET /api/career/jobs.
export default function JobFinder({ profile, aiLang }) {
  const { x } = useCareerText();
  const [location, setLocation] = useState("Israel");
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const links = useMemo(() => buildJobLinks(profile.role, profile.level, location), [profile.role, profile.level, location]);

  async function makeKit() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        role: profile.role,
        level: profile.level,
        lang: aiLang,
        skills: (profile.skills || []).join(","),
        languages: (profile.languages || []).join(","),
      });
      const data = await careerFetch(`/api/career/jobs?${qs}`);
      setKit(data.kit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="career-card space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block w-full max-w-xs">
            <span className="career-h">{x.locationLabel}</span>
            <input className="career-input" dir="auto" value={location} maxLength={60} onChange={(e) => setLocation(e.target.value)} />
          </label>
        </div>
        <div>
          <p className="career-h">{x.searchOn}</p>
          <div className="flex flex-wrap gap-2.5">
            {links.map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className={`job-link ${l.id}`}>
                {l.id === "linkedin" ? "💼" : l.id === "indeed" ? "🔍" : l.id === "glassdoor" ? "📋" : "🧭"} {l.label}
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{x.searchNote}</p>
        </div>
      </div>

      <div className="career-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100">{x.kitTitle}</h3>
            <p className="max-w-xl text-sm text-slate-400">{x.kitIntro}</p>
          </div>
          <button type="button" onClick={makeKit} disabled={loading} className="career-btn">
            {kit ? x.newKit : x.makeKit}
          </button>
        </div>
        {loading && <Spinner label={x.writing} />}
        <ErrorLine>{error}</ErrorLine>

        {kit && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <Block title={x.headline} copy={kit.headline}>
              <p dir="auto" className="text-base font-semibold text-slate-100">
                {kit.headline}
              </p>
            </Block>
            <Block title={x.about} copy={kit.about}>
              <div dir="auto" className="space-y-2 text-sm leading-7 text-slate-200">
                {kit.about.split(/\n{2,}|\n/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Block>
            <Block title={x.skillsToAdd} copy={kit.skills.join(", ")} copyLabel={x.copyAll}>
              <div className="flex flex-wrap gap-2" dir="ltr">
                {kit.skills.map((s) => (
                  <span key={s} className="career-chip is-on">
                    {s}
                  </span>
                ))}
              </div>
            </Block>
            <div>
              <p className="career-h">{x.tips}</p>
              <ol dir="auto" className="career-list list-decimal text-sm leading-7 text-slate-200">
                {kit.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Block({ title, copy, copyLabel, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="career-h !mb-0">{title}</p>
        <CopyButton text={copy} label={copyLabel} />
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">{children}</div>
    </div>
  );
}
