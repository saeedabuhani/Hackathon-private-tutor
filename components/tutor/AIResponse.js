"use client";

import LanguageBridge from "./LanguageBridge";
import { STUCK_TYPE_BADGES } from "@/lib/stuckTypes";

export default function AIResponse({ response }) {
  if (!response) return null;
  const rtl = ["he", "ar"].includes(response.detectedLang);
  const badge = STUCK_TYPE_BADGES[response.stuckType] || STUCK_TYPE_BADGES.general_confusion;

  return (
    <section className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4">
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
      <p dir={rtl ? "rtl" : "ltr"} className="whitespace-pre-wrap leading-relaxed">
        {response.explanation}
      </p>
      <LanguageBridge bridge={response.languageBridge} rtl={rtl} />
      {response.suggestedTopics?.length > 0 && (
        <p className="text-xs text-slate-500">
          Topics: <bdi>{response.suggestedTopics.join(" · ")}</bdi>
        </p>
      )}
    </section>
  );
}
