"use client";

import { useCallback, useEffect, useState } from "react";

export default function useGapMap(userId, materialId) {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const qs = new URLSearchParams({ userId });
    if (materialId) qs.set("materialId", materialId);
    const res = await fetch(`/api/gap-map?${qs}`);
    const data = await res.json();
    setGaps(data.gaps || []);
    setLoading(false);
  }, [userId, materialId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { gaps, loading, refresh };
}
