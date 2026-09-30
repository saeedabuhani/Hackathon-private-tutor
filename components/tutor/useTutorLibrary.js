"use client";

import { useCallback, useEffect, useState } from "react";
import useStore from "@/store/useStore";
import { authFetch } from "@/lib/authFetch";
import { SESSIONS_CHANGED_EVENT } from "@/lib/chatSessions";

// One place that loads what the Tutor screen shows around the chat: the saved conversations
// (with their delete action) and the user's materials. The conversation list refetches when
// the open conversation changes (a new one was just created) and whenever the chat or a
// material deletion says the list changed.
export default function useTutorLibrary(activeSessionId) {
  const userId = useStore((s) => s.user?.id);
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSessions = useCallback(async () => {
    try {
      const res = await authFetch("/api/sessions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load conversations");
      setSessions(data.sessions || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaterials = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/materials?userId=${userId}`);
      const data = await res.json();
      if (res.ok) setMaterials(data.materials || []);
    } catch {
      // the materials are a convenience around the chat: never block on them
    }
  }, [userId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, activeSessionId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    const refresh = () => {
      fetchSessions();
      fetchMaterials();
    };
    window.addEventListener(SESSIONS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SESSIONS_CHANGED_EVENT, refresh);
  }, [fetchSessions, fetchMaterials]);

  async function deleteSession(sessionId) {
    try {
      const res = await authFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  return { sessions, materials, loading, error, deleteSession };
}
