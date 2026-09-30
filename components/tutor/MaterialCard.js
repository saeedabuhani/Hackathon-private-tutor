"use client";

import Link from "next/link";

export default function MaterialCard({ material }) {
  return (
    <Link
      href={`/tutor/${material.id}`}
      className="block rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-600 p-4 transition"
    >
      <h3 dir="auto" className="font-semibold">
        {material.title}
      </h3>
      <p className="text-xs text-slate-500 mb-2">{material.file_type}</p>
      <div className="flex flex-wrap gap-1.5">
        {(material.topics || []).slice(0, 6).map((t) => (
          <span key={t} dir="auto" className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
