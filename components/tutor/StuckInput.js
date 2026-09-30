"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MessageContent from "./MessageContent";
import QuickActions from "./QuickActions";
import AnswerBubbles from "./AnswerBubbles";
import { useTutorText } from "./tutorText";
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
  header = null, // the panel header (title, bookmark, share...) drawn inside the same glass panel
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { x, lang: siteLang } = useTutorText();
  const user = useStore((s) => s.user);
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
  const [detectedTopic, setDetectedTopic] = useState(""); // what the quick actions ask about
  const [listening, setListening] = useState(false);
  const [burst, setBurst] = useState(0); // counts answers: each one sends a few bubbles up from the box
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const docInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesRef = useRef(null);
  const sessionRef = useRef(null); // the conversation currently shown / being written to
  const loadTokenRef = useRef(0); // ignores a slow load if the user has moved on
  const saveChainRef = useRef(Promise.resolve()); // saves run one after another

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); // the list, not the page
  }, [history, loading]);

  useEffect(() => {
    if (initialValue) setInput(initialValue);
  }, [initialValue]);

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

  async function handleExplain(override) {
    const fromAction = typeof override === "string";
    const userMessage = (fromAction ? override : input).trim();
    if (!userMessage || loading || loadingSession) return;

    if (!fromAction) setInput("");
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
      // design only: a few small bubbles rise out of the message box when the answer arrives
      setBurst((b) => b + 1);
      if (data.suggestedTopics?.[0]) {
        onTopicDetected?.(data.suggestedTopics[0]);
        setDetectedTopic(data.suggestedTopics[0]);
      }
      if (["he", "ar", "en"].includes(data.detectedLang)) setActiveLanguage(data.detectedLang);
      persistExchange(userMessage, data);
    } catch (err) {
      setError(err.message);
      // Drop the optimistic user message so "Explain" can be retried cleanly
      setHistory((prev) => prev.slice(0, -1));
      if (!fromAction) setInput(userMessage);
    } finally {
      setLoading(false);
    }
  }

  // ---- input bar tools ----

  // Wrap the selection (or an empty spot) in a ``` code fence
  function insertCode() {
    const el = textareaRef.current;
    const start = el ? el.selectionStart : input.length;
    const end = el ? el.selectionEnd : input.length;
    const selected = input.slice(start, end);
    const before = input.slice(0, start);
    const after = input.slice(end);
    const lead = before && !before.endsWith("\n") ? "\n" : "";
    const block = `${lead}\`\`\`\n${selected}\n\`\`\`\n`;
    setInput(before + block + after);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const caret = before.length + lead.length + 4 + selected.length;
      el.setSelectionRange(caret, caret);
    });
  }

  // Dictation with the browser's own speech recognition (no server involved)
  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError(x.voiceUnsupported);
      return;
    }
    const rec = new Recognition();
    rec.lang = { he: "he-IL", ar: "ar-SA", en: "en-US" }[siteLang] || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    const base = input.trim();
    rec.onresult = (e) => {
      const spoken = Array.from(e.results).map((r) => r[0].transcript).join(" ");
      setInput(base ? `${base} ${spoken}` : spoken);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setError("");
    setListening(true);
    rec.start();
  }

  // Attach / image: add a NEW material (same upload as the Materials page) and open a chat on it
  async function uploadMaterial(file) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", file.name.replace(/\.[^.]+$/, ""));
      form.append("userId", user?.id || userId || "");
      const res = await fetch("/api/materials", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      notifySessionsChanged();
      router.push(`/tutor/${data.materialId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function openQuiz(topic) {
    router.push(`/tutor/${materialId}/exam${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleExplain();
    }
  }

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  // What the quick actions ask about: the topic the AI detected, else one of the material's
  // topics that the last question mentions (a reopened chat has no detected topic), else the question
  const mentioned = topics.find((tp) => lastUser?.content?.toLowerCase().includes(String(tp).toLowerCase()));
  const quickTopic = detectedTopic || mentioned || lastUser?.content?.slice(0, 80) || "";
  const initial = (user?.email || "?").trim().charAt(0).toUpperCase();
  const sparkle = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5 14 9l6.5 2L14 13l-2 6.5L10 13 3.5 11 10 9l2-6.5Z" />
    </svg>
  );
  const toolBtn = (active) =>
    `composer-tool ${active ? "is-on" : ""}`;

  return (
    <div className="glass-panel tutor-panel">
      {header}

      <div ref={messagesRef} className="tutor-messages">
        {loadingSession && <p className="text-sm text-slate-400">{t.loadingChat}</p>}

        {history.length === 0 && !loadingSession && (
          <div className="flex items-start gap-3">
            <div className="chat-avatar ai">{sparkle}</div>
            <div className="ai-bubble">
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
          </div>
        )}

        {history.map((msg, i) => {
          const isLast = i === history.length - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {msg.role === "user" ? (
                <div className="flex items-end justify-end gap-3">
                  <div dir="auto" className="user-bubble">
                    {msg.content}
                  </div>
                  <div className="chat-avatar user" aria-hidden="true">
                    {initial}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="chat-avatar ai">{sparkle}</div>
                  <div className="min-w-0 flex-1">
                    <div className="ai-bubble">
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
                    {isLast && !loading && (
                      <QuickActions
                        topic={quickTopic}
                        disabled={loading || loadingSession}
                        onAsk={(text) => handleExplain(text)}
                        onQuiz={openQuiz}
                      />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3" role="status">
            <div className="chat-avatar ai">{sparkle}</div>
            <div className="typing" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span className="text-sm text-slate-400">{t.thinking}</span>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {saveWarning && <p className="text-xs text-amber-400">{t.notSaved}</p>}
      </div>

      <div className="tutor-composer">
        {burst > 0 && <AnswerBubbles key={burst} />}
        {(uploading || listening) && (
          <p className="mb-2 px-1 text-xs text-slate-400" role="status">
            {uploading ? x.uploading : x.listening}
          </p>
        )}
        <div className="composer-box">
          <textarea
            ref={textareaRef}
            dir="auto"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={history.length > 0 ? t.continuePlaceholder : x.askPlaceholder}
            className="composer-input"
          />
          <div className="composer-toolbar">
            <div className="flex items-center gap-0.5">
              <button type="button" className={toolBtn(false)} onClick={() => docInputRef.current?.click()} disabled={uploading} title={x.attach} aria-label={x.attach}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m20 11.5-8.2 8.2a5 5 0 0 1-7-7l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.5 8.5a1.8 1.8 0 0 1-2.5-2.5l7.9-7.9" /></svg>
              </button>
              <button type="button" className={toolBtn(false)} onClick={() => imageInputRef.current?.click()} disabled={uploading} title={x.addImage} aria-label={x.addImage}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" /></svg>
              </button>
              <button type="button" className={toolBtn(listening)} onClick={toggleVoice} title={listening ? x.listening : x.voice} aria-label={x.voice} aria-pressed={listening}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" /></svg>
              </button>
              <button type="button" className={toolBtn(false)} onClick={insertCode} title={x.insertCode} aria-label={x.insertCode}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4" /></svg>
              </button>
              <input ref={docInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => { uploadMaterial(e.target.files?.[0]); e.target.value = ""; }} />
              <input ref={imageInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => { uploadMaterial(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="model-chip" title={x.modelLabel} aria-label={x.modelLabel}>
                {sparkle}
                GPT-4o
              </span>
              <button
                onClick={handleExplain}
                disabled={loading || loadingSession || !input.trim()}
                className="send-btn"
                title={x.send}
                aria-label={t.explain}
              >
                {loading ? (
                  "…"
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
