import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useHousehold } from "./HouseholdContext";
import { useUser } from "./UserContext";

const ChatContext = createContext(null);
const API_BASE = "/api/chat";

const makeThreadKey = (contextType, contextId, threadId) => {
  if (threadId) return threadId;
  if (contextType === "house") return "house";
  if (contextId === undefined || contextId === null) return contextType || "chat";
  return `${contextType}-${contextId}`;
};

export function ChatProvider({ children }) {
  const [threads, setThreads] = useState([]);
  const [messagesByThread, setMessagesByThread] = useState({});
  const [status, setStatus] = useState({ loading: false, error: null });
  const { household } = useHousehold();
  const { user, token } = useUser();

  const buildHeaders = useCallback(
    (extra = {}) => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    }),
    [token]
  );

  const defaultParticipants = useMemo(() => {
    const names = new Set([user?.name || user?.username || "Anonymous"]);
    (household?.members || []).forEach((member) => {
      const name = member.userId?.displayName || member.userId?.username;
      if (name) names.add(name);
    });
    return Array.from(names);
  }, [household?.members, user?.name, user?.username]);

  const ensureThread = useCallback(
    async ({ threadId, contextType, contextId, name, participants }) => {
      if (!contextType && !threadId) return null;
      const mergedParticipants =
        Array.isArray(participants) && participants.length > 0
          ? participants
          : defaultParticipants;
      const response = await fetch(`${API_BASE}/threads`, {
        method: "POST",
        headers: buildHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          threadId,
          contextType,
          contextId,
          name,
          participants: mergedParticipants,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to ensure chat thread");
      }
      const payload = await response.json();
      setThreads((prev) => {
        const exists = prev.find((item) => item.id === payload.data.id);
        if (exists) {
          return prev.map((item) => (item.id === payload.data.id ? payload.data : item));
        }
        return [payload.data, ...prev];
      });
      return payload.data;
    },
    [defaultParticipants, buildHeaders]
  );

  const fetchThreads = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${API_BASE}/threads`, {
        headers: buildHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Failed to load chat threads (${response.status})`);
      }
      const payload = await response.json();
      const normalized = (payload.data || []).map((thread) => {
        if (!Array.isArray(thread.participants) || thread.participants.length === 0) {
          return { ...thread, participants: defaultParticipants };
        }
        return thread;
      });
      setThreads(normalized);
      setStatus({ loading: false, error: null });
      return normalized;
    } catch (error) {
      setStatus({ loading: false, error: error.message || "Unable to load chats" });
      return [];
    }
  }, [defaultParticipants, buildHeaders]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!household) return;
    ensureThread({
      contextType: "house",
      contextId: household.id || household._id || "house",
      name: household.name || "House",
      participants: defaultParticipants,
    }).catch(() => {});
  }, [household, ensureThread, defaultParticipants]);

  const loadMessages = useCallback(
    async ({ threadId, contextType, contextId, name, participants }) => {
      const key = makeThreadKey(contextType, contextId, threadId);
      const params = new URLSearchParams();
      if (key === "house") {
        params.set("threadId", "house");
      } else if (threadId) {
        params.set("threadId", threadId);
      } else {
        if (contextType) params.set("contextType", contextType);
        if (contextId !== undefined && contextId !== null) {
          params.set("contextId", contextId);
        }
      }
      if (!params.has("threadId") && !params.has("contextType")) {
        return [];
      }
      try {
        await ensureThread({
          threadId,
          contextType,
          contextId,
          name,
          participants: participants && participants.length ? participants : defaultParticipants,
        });
        const response = await fetch(`${API_BASE}/messages?${params.toString()}`, {
          headers: buildHeaders(),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch chat messages");
        }
        const payload = await response.json();
        const messages = payload.data || [];
        setMessagesByThread((prev) => ({
          ...prev,
          [key]: messages,
        }));
        return messages;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("[chat] loadMessages failed", error);
        return [];
      }
    },
    [ensureThread, buildHeaders]
  );

  const sendMessage = useCallback(
    async ({ threadId, contextType, contextId, sender, text, name, participants, metadata }) => {
      const trimmed = text?.trim();
      if (!trimmed) return null;
      const mergedParticipants = Array.isArray(participants) && participants.length > 0
        ? participants
        : defaultParticipants;
      const response = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: buildHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          threadId,
          contextType,
          contextId,
          sender,
          text: trimmed,
          name,
          participants: mergedParticipants,
          metadata,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to send chat message");
      }
      const payload = await response.json();
      const formatted = payload.data.message;
      const key = makeThreadKey(contextType, contextId, payload.data.thread.id);
      setMessagesByThread((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), formatted],
      }));
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === payload.data.thread.id ? payload.data.thread : thread
        )
      );
      return formatted;
    },
    [defaultParticipants, buildHeaders]
  );

  const markThreadRead = useCallback(async (threadId) => {
    if (!threadId) return null;
    const response = await fetch(`${API_BASE}/threads/${threadId}/read`, {
      method: "PATCH",
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error("Unable to update read state");
    }
    const payload = await response.json();
    setThreads((prev) =>
      prev.map((thread) => (thread.id === threadId ? payload.data : thread))
    );
    return payload.data;
  }, [buildHeaders]);

  const value = useMemo(
    () => ({
      threads,
      messagesByThread,
      loadMessages,
      sendMessage,
      refreshThreads: fetchThreads,
      ensureThread,
      markThreadRead,
      status,
    }),
    [threads, messagesByThread, loadMessages, sendMessage, fetchThreads, ensureThread, markThreadRead, status]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function getThreadKey(contextType, contextId, threadId) {
  return makeThreadKey(contextType, contextId, threadId);
}
