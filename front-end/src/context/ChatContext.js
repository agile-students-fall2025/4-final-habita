import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "habita:chats";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [threads, setThreads] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { house: [] };
    } catch {
      return { house: [] };
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  const sendMessage = (contextType, contextId, sender, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const id = Date.now();
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const key = contextType === "house" ? "house" : `${contextType}-${contextId}`;

    const newMsg = { id, sender, text: trimmed, timestamp };

    setThreads((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), newMsg],
    }));
  };

  const getMessages = (contextType, contextId) => {
    const key = contextType === "house" ? "house" : `${contextType}-${contextId}`;
    return threads[key] || [];
  };

  return (
    <ChatContext.Provider value={{ threads, sendMessage, getMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
