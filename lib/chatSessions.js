// The sidebar and the chat live in different parts of the tree; this lets the chat (or a
// material being deleted) tell the sidebar to refetch the list of conversations.
export const SESSIONS_CHANGED_EVENT = "chat-sessions-changed";

export function notifySessionsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSIONS_CHANGED_EVENT));
}
