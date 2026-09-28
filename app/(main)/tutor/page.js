"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";
import MaterialUpload from "@/components/tutor/MaterialUpload";
import MaterialsGrid from "@/components/tutor/MaterialsGrid";
import { authFetch } from "@/lib/authFetch";
import { notifySessionsChanged } from "@/lib/chatSessions";
import { useTranslation } from "@/lib/translations";

// No conversation open: upload a file or pick one of your materials to start a chat.
// (Saved conversations live in the sidebar — see tutor/layout.js.)
export default function TutorPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/materials?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => setMaterials(d.materials || []));
  }, [user?.id]);

  async function handleDelete(materialId) {
    setError("");
    try {
      const res = await authFetch(`/api/materials/${materialId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      notifySessionsChanged(); // its conversations were deleted with it
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">{t.smartTutor}</h1>
      <MaterialUpload
        userId={user?.id}
        onUploaded={(data) => router.push(`/tutor/${data.materialId}`)}
      />

      <section className="space-y-3">
        <h2 className="text-sm text-slate-400">📂 {t.yourMaterials}</h2>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {materials.length > 0 ? (
          <MaterialsGrid
            materials={materials}
            onSelect={(m) => router.push(`/tutor/${m.id}`)}
            onDelete={handleDelete}
          />
        ) : (
          <p className="text-sm text-slate-500">{t.noMaterials}</p>
        )}
      </section>
    </div>
  );
}
