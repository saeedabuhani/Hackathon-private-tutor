"use client";

import { useEffect, useRef, useState } from "react";
import MessageContent from "./MessageContent";
import LanguageBridge from "./LanguageBridge";
import { STUCK_TYPE_BADGES } from "@/lib/stuckTypes";
import { authFetch } from "@/lib/authFetch";
import { notifySessionsChanged } from "@/lib/chatSessions";
import useStore from "@/store/useStore";
import { useTranslation } from "@/lib/translations";

async function saveMessage(sessionId, message) {
  const res = await authFetch(`/api/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Could not save message");
}

// Full chat over one material: keeps the whole conversation on screen (not just
// the latest answer), sends the history back to /api/stuck on every turn so the
// AI remembers earlier questions, and renders deep Markdown answers.
//
// Conversations are saved (chat_sessions / chat_messages) so the sidebar can reopen them:
//  - `sessionId` (from the URL) opens an existing conversation and loads its messages;
//  - the first answer of a fresh chat creates the session and reports it via
//    `onSessionCreated(id)`, so the parent can put it in the URL.
export default function StuckInput({
  materialId,
  userId,
  topics = [],
  onTopicDetected,
  sessionId: propSessionId = null,
  onSessionCreated,
  initialValue = "",
}) {
  const { t } = useTranslation();
  const activeLanguage = useStore((s) => s.activeLanguage);
  const setActiveLanguage = useStore((s) => s.setActiveLanguage);
  const stuckTypeText = {
    term: t.stuckTerm,
    missing_base: t.stuckMissingBase,
    general_confusion: t.stuckConfusion,
  };
  const [input, setInput] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState("");
  const [saveWarning, setSaveWarning] = useState(false); // true when the last save failed
  const [history, setHistory] = useState([]); // [{role, content, stuckType?, languageBridge?}]
  const bottomRef = useRef(null);
  const sessionRef = useRef(null); // the conversation currently shown / being written to
  const loadTokenRef = useRef(0); // ignores a slow load if the user has moved on
  const saveChainRef = useRef(Promise.resolve()); // saves run one after another

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  // Follow the session id from the URL: open a saved conversation, or reset for a new chat.
  // A session this component just created is already in sessionRef, so it isn't reloaded.
  useEffect(() => {
    const next = propSessionId || null;
    if (next === sessionRef.current) return;
    sessionRef.current = next;
    setError("");
    setSaveWarning(false);
    if (!next) {
      setHistory([]);
      return;
    }

    const token = ++loadTokenRef.current;
    setLoadingSession(true);
    authFetch(`/api/sessions/${next}/messages`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load the conversation");
        if (token !== loadTokenRef.current) return;
        setHistory(
          data.messages.map((m) => ({
            role: m.role,
            content: m.content,
            stuckType: m.stuck_type,
            languageBridge: m.language_bridge,
          }))
        );
      })
      .catch((err) => {
        if (token !== loadTokenRef.current) return;
        setError(err.message);
        setHistory([]);
      })
      .finally(() => {
        if (token === loadTokenRef.current) setLoadingSession(false);
      });
  }, [propSessionId]);

  // Save a finished exchange. Creates the conversation on the first one. Never blocks or
  // breaks the chat: if saving fails the student just gets a small warning.
  function persistExchange(userMessage, data) {
    saveChainRef.current = saveChainRef.current.then(async () => {
      try {
        let sid = sessionRef.current;
        if (!sid) {
          const res = await authFetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materialId, firstMessage: userMessage }),
          });
          const created = await res.json();
          if (!res.ok) throw new Error(created.error || "Could not create the conversation");
          sid = created.sessionId;
          sessionRef.current = sid;
          onSessionCreated?.(sid);
        }
        await saveMessage(sid, { role: "user", content: userMessage });
        await saveMessage(sid, {
          role: "assistant",
          content: data.explanation,
          stuck_type: data.stuckType,
          language_bridge: data.languageBridge,
        });
        setSaveWarning(false);
        notifySessionsChanged();
      } catch (err) {
        console.warn("[chat] could not save history:", err.message);
        setSaveWarning(true);
      }
    });
  }

  async function handleExplain() {
    const userMessage = input.trim();
    if (!userMessage || loading || loadingSession) return;

    setInput("");
    setLoading(true);
    setError("");
    setHistory((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const res = await fetch("/api/stuck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          question: userMessage,
          userId,
          conversationHistory: history.map((h) => ({ role: h.role, content: h.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.explanation,
          stuckType: data.stuckType,
          languageBridge: data.languageBridge,
        },
      ]);
      if (data.suggestedTopics?.[0]) onTopicDetected?.(data.suggestedTopics[0]);
      if (["he", "ar", "en"].includes(data.detectedLang)) setActiveLanguage(data.detectedLang);
      persistExchange(userMessage, data);
    } catch (err) {
      setError(err.message);
      // Drop the optimistic user message so "Explain" can be retried cleanly
      setHistory((prev) => prev.slice(0, -1));
      setInput(userMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleExplain();
    }
  }

  return (
    <div className="flex flex-col h-[65vh] rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {loadingSession && <p className="text-sm text-slate-400">{t.loadingChat}</p>}

        {history.length === 0 && !loadingSession && (
          <div className="w-full sm:w-[95%] rounded-2xl rounded-es-md border border-slate-800 bg-slate-950/60 px-4 py-4">
            {topics.length > 0 ? (
              <>
                <p className="mb-2">{t.topicsIntro}</p>
                <ul className="mb-3 space-y-1">
                  {topics.map((topic) => (
                    <li key={topic}>
                      <button
                        type="button"
                        dir="auto"
                        onClick={() => setInput(t.topicQuestion(topic))}
                        className="text-start text-indigo-300 hover:text-indigo-200 hover:underline"
                      >
                        • <bdi>{topic}</bdi>
                      </button>
                    </li>
                  ))}
                </ul>
                <p>{t.whatToTalk}</p>
              </>
            ) : (
              <p className="text-slate-400">{t.askAnything}</p>
            )}
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div
                dir="auto"
                className="max-w-[80%] rounded-2xl rounded-ee-md bg-indigo-600 text-white px-4 py-2.5 text-sm leading-relaxed"
              >
                {msg.content}
              </div>
            ) : (
              <div className="w-full sm:w-[95%] rounded-2xl rounded-es-md border border-slate-800 bg-slate-950/60 px-4 py-4">
                {msg.stuckType && (
                  <span
                    className={`inline-block rounded-lg px-3 py-1.5 text-xs mb-3 ${
                      (STUCK_TYPE_BADGES[msg.stuckType] || STUCK_TYPE_BADGES.general_confusion).className
                    }`}
                  >
                    {stuckTypeText[msg.stuckType] || stuckTypeText.general_confusion}
                  </span>
                )}
                <MessageContent content={msg.content} />
                <LanguageBridge bridge={msg.languageBridge} rtl={["he", "ar"].includes(activeLanguage)} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            {t.thinking}
          </p>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {saveWarning && <p className="text-xs text-amber-400">{t.notSaved}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-800 p-3 flex gap-2 items-end bg-slate-900">
        <textarea
          dir="auto"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={history.length > 0 ? t.continuePlaceholder : t.stuckQuestion}
          className="flex-1 resize-none rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleExplain}
          disabled={loading || loadingSession || !input.trim()}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-bold whitespace-nowrap"
        >
          {loading ? "..." : t.explain}
        </button>
      </div>
    </div>
  );
}
