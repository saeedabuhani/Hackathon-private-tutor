"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";
import MaterialUpload from "@/components/tutor/MaterialUpload";
import MaterialsGrid from "@/components/tutor/MaterialsGrid";
import ConfirmDialog from "@/components/tutor/ConfirmDialog";
import { notify } from "@/components/tutor/toast";
import { authFetch } from "@/lib/authFetch";
import { notifySessionsChanged } from "@/lib/chatSessions";
import { useTranslation } from "@/lib/translations";

// No conversation open: upload a file or pick one of your materials to start a chat.
// (Saved conversations live in the side cards — see tutor/layout.js.)
export default function TutorPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // the material asked about in the confirm dialog
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/materials?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => setMaterials(d.materials || []));
  }, [user?.id]);

  async function confirmDelete() {
    const material = pendingDelete;
    if (!material) return;
    setDeleting(true);
    setError("");
    try {
      const res = await authFetch(`/api/materials/${material.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      notifySessionsChanged(); // its conversations were deleted with it
      notify({ message: t.materialDeletedToast(material.title), tone: "danger" });
    } catch (err) {
      setError(err.message);
      notify({ message: t.deleteFailedToast, tone: "danger" });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="glass-panel space-y-6 p-6 sm:p-8">
      <h1 className="text-neon text-3xl font-extrabold">{t.smartTutor}</h1>
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
            onRequestDelete={setPendingDelete}
          />
        ) : (
          <p className="text-sm text-slate-500">{t.noMaterials}</p>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t.deleteMaterialTitle}
        message={t.confirmDeleteMaterial}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}
