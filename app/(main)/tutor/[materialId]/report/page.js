"use client";

import Link from "next/link";
import useStore from "@/store/useStore";
import useGapMap from "@/hooks/useGapMap";
import GapMap from "@/components/tutor/GapMap";
import { useTranslation } from "@/lib/translations";

export default function ReportPage({ params }) {
  const { materialId } = params;
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const { gaps, loading } = useGapMap(user?.id, materialId);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between text-sm text-slate-400">
        <Link href={`/tutor/${materialId}`} className="hover:text-slate-100">
          {t.back}
        </Link>
        <Link href={`/tutor/${materialId}/exam`} className="hover:text-slate-100">
          {t.takeTest}
        </Link>
      </div>
      <h1 className="text-xl font-bold">{t.gapMapTitle}</h1>
      {loading ? <p className="text-slate-500">{t.loading}</p> : <GapMap gaps={gaps} />}
    </div>
  );
}
