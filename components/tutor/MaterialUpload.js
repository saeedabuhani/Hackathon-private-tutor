"use client";

import { useRef, useState } from "react";
import { useTranslation } from "@/lib/translations";

const ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp";

export default function MaterialUpload({ userId, onUploaded }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file) {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name.replace(/\.[^.]+$/, ""));
      form.append("userId", userId || "");
      const res = await fetch("/api/materials", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-3xl border-2 border-dashed bg-slate-900/40 p-10 text-center transition duration-300 ${
          dragging
            ? "border-violet-400/60 bg-violet-500/15 shadow-[0_0_17px_rgba(139,92,246,0.18)]"
            : "border-violet-400/25 hover:border-violet-400/60 hover:bg-violet-500/10 hover:shadow-[0_0_14px_rgba(139,92,246,0.12)]"
        }`}
      >
        <p className="text-lg">{loading ? t.readingMaterial : t.dragHere}</p>
        <p className="text-sm text-slate-500 mt-1">{t.supportedFiles}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
    </div>
  );
}
