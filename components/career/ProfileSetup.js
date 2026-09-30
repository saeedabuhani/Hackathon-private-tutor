"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ROLES, LEVELS, CODE_LANGUAGES, roleById } from "@/lib/careerData";
import { useCareerText } from "./careerText";
import { careerFetch, ErrorLine } from "./ui";

// Who you want to become: field (7 roles), level, skills and programming languages.
// Shown the first time, and again from "Edit profile". Saves to the database through
// POST /api/career/profile and hands the saved profile to onSaved.
export default function ProfileSetup({ initial, onSaved, onCancel }) {
  const { x } = useCareerText();
  const [role, setRole] = useState(initial?.role || null);
  const [level, setLevel] = useState(initial?.level || "student");
  const [skills, setSkills] = useState(initial?.skills || []);
  const [languages, setLanguages] = useState(initial?.languages || []);
  const [custom, setCustom] = useState("");
  const [touched, setTouched] = useState(Boolean(initial)); // the person shaped the skills themselves
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = roleById(role);

  // Picking a field fills in typical skills and languages, unless the person already chose their own
  function pickRole(r) {
    setRole(r.id);
    if (!touched) {
      setSkills(r.skills);
      setLanguages(r.languages);
    }
  }
  function toggle(list, setList, item) {
    setTouched(true);
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }
  function addCustom() {
    const value = custom.trim().slice(0, 40);
    if (!value) return;
    setCustom("");
    setTouched(true);
    if (!skills.some((s) => s.toLowerCase() === value.toLowerCase()) && skills.length < 15) setSkills([...skills, value]);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const data = await careerFetch("/api/career/profile", { role, level, skills, languages });
      onSaved(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const suggestions = (current?.skills || []).filter((s) => !skills.includes(s));
  const canSave = role && level && skills.length > 0 && !saving;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass-panel space-y-6 p-6 sm:p-8">
      <div>
        <h2 className="text-neon text-2xl font-extrabold">{x.setupTitle}</h2>
        <p className="mt-1 text-sm text-slate-400">{x.setupSub}</p>
      </div>

      <section>
        <p className="career-h">{x.fieldLabel}</p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <button key={r.id} type="button" onClick={() => pickRole(r)} aria-pressed={role === r.id} className={`career-role ${role === r.id ? "is-on" : ""}`} dir="ltr">
              <span className="font-semibold text-slate-100">
                {r.emoji} {r.label}
              </span>
              <span className="text-xs text-slate-400">{r.skills.join(" · ")}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="career-h">{x.levelLabel}</p>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button key={l} type="button" onClick={() => setLevel(l)} aria-pressed={level === l} className={`career-chip ${level === l ? "is-on" : ""}`}>
              {x.levels[l]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="career-h">{x.skillsLabel}</p>
        <p className="mb-2 text-xs text-slate-500">{x.skillsHint}</p>
        <div className="mb-3 flex flex-wrap gap-2" dir="ltr">
          {skills.map((s) => (
            <button key={s} type="button" onClick={() => toggle(skills, setSkills, s)} className="career-chip is-on" aria-label={`Remove ${s}`}>
              {s} <span aria-hidden="true">✕</span>
            </button>
          ))}
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => toggle(skills, setSkills, s)} className="career-chip is-ghost">
              + {s}
            </button>
          ))}
        </div>
        <div className="flex max-w-sm gap-2">
          <input
            className="career-input"
            dir="auto"
            value={custom}
            maxLength={40}
            placeholder={x.addSkill}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button type="button" onClick={addCustom} className="career-btn is-quiet">
            {x.add}
          </button>
        </div>
      </section>

      <section>
        <p className="career-h">{x.languagesLabel}</p>
        <div className="flex flex-wrap gap-2" dir="ltr">
          {CODE_LANGUAGES.map((l) => (
            <button key={l} type="button" onClick={() => toggle(languages, setLanguages, l)} aria-pressed={languages.includes(l)} className={`career-chip ${languages.includes(l) ? "is-on" : ""}`}>
              {l}
            </button>
          ))}
        </div>
      </section>

      <ErrorLine>{error}</ErrorLine>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={!canSave} className="career-btn" title={!role ? x.pickRole : undefined}>
          {saving ? x.saving : x.saveProfile}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="career-btn is-quiet">
            {x.cancel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
