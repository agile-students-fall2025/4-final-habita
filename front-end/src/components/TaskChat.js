// front-end/src/components/TaskChat.js
import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Minimal chat UI bound to a single threadId.
 * Props:
 *   - threadId
 *   - currentUserName (actual username)
 */
export default function TaskChat({ threadId, currentUserName }) {
  const { user } = useUser();
  const effectiveName =
    currentUserName ||
    user?.name ||
    user?.username ||
    "You"; // ALWAYS defined now

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  //
  // Load messages whenever threadId changes
  //
  useEffect(() => {
    if (!threadId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/chats/${encodeURIComponent(threadId)}/messages`
        );
        if (!res.ok) throw new Error("Failed to load messages");

        const data = await res.json();
        if (!cancelled) setMessages(data.data || []);
      } catch (err) {
        console.error("[chat] load failed:", err);
        if (!cancelled) setError("Failed to load messages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => (cancelled = true);
  }, [threadId]);

  //
  // SEND message
  //
  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !threadId || sending) return;

    try {
      setSending(true);
      setError(null);

      const res = await fetch(
        `/api/chats/${encodeURIComponent(threadId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: effectiveName,
            text: trimmed,
          }),
        }
      );

      if (!res.ok) throw new Error("Message send failed");

      const data = await res.json();
      const message = data.data;

      setMessages((prev) => [...prev, message]);
      setText("");
    } catch (err) {
      console.error("[chat] send failed:", err);
      setError("Unable to send message");
    } finally {
      setSending(false);
    }
  }

  //
  // UI
  //
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Message List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.75rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
          marginBottom: "0.5rem",
          background: "#fafafa",
        }}
      >
        {loading && <div style={{ fontSize: 12 }}>Loading chat…</div>}
        {error && (
          <div style={{ fontSize: 12, color: "red" }}>{error}</div>
        )}

        {messages.map((m) => {
          const isMe = m.sender === effectiveName;

          return (
            <div
              key={m._id}
              style={{
                marginBottom: "0.35rem",
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  padding: "0.45rem 0.75rem",
                  borderRadius: 12,
                  maxWidth: "75%",
                  background: isMe ? "#d7e7ff" : "white",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#777",
                    marginBottom: 2,
                    textAlign: isMe ? "right" : "left",
                  }}
                >
                  {m.sender} · {formatTime(m.createdAt)}
                </div>
                <div style={{ fontSize: 14 }}>{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSend}
        style={{ display: "flex", gap: "0.5rem" }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: "0.6rem",
            borderRadius: 999,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: 999,
            border: "none",
            background: "#4a90e2",
            color: "white",
            cursor: sending ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
