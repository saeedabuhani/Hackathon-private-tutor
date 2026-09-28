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
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          dragging
            ? "border-indigo-400 bg-indigo-950/40"
            : "border-slate-700 hover:border-slate-500"
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
