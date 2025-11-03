// front-end/src/components/ChatThread.js
import { useEffect, useRef, useState, useMemo } from "react";
import { useChat } from "../context/ChatContext";

function normalizeMentions(text, mentionables = []) {
    return text.replace(/@(\w+)/g, (_m, raw) => {
        const hit = mentionables.find((n) => n.toLowerCase() === String(raw).toLowerCase());
        return hit ? `@${hit}` : `@${raw}`;
    });
}

export default function ChatThread({
  contextType,        // 'house' | 'bill' | 'task'
  contextId,          // id for bill/task; undefined for house
  title,
  participants = [],  // ['Alex','Sam','Jordan','You']
}) {
  const { getMessages, sendMessage } = useChat();
  const [messages, setMessages] = useState(() => getMessages(contextType, contextId));
  const [draft, setDraft] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const scrollRef = useRef(null);



  const names = useMemo(() => ["You", ...participants], [participants]);



  const mentionable = useMemo(() => {
    // ensure 'You' is available and no duplicates
    const set = new Set([..."You" ? ["You"] : [], ...participants]);
    return Array.from(set);
  }, [participants]);


  useEffect(() => {
    setMessages(getMessages(contextType, contextId));
  }, [contextType, contextId, getMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);



  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;

    const normalized = normalizeMentions(draft.trim(), names); // ✅ Add this

    sendMessage(contextType, contextId, "You", normalized);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("habita:thread-message", {
          detail: {
            contextType,
            contextId,
            sender: "You",
            text: normalized,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }
    setDraft("");
    setShowMentions(false);
  };

  // highlight @mentions inside message text
  const renderWithMentions = (text) => {
    return text.split(/(@\w+)/g).map((part, i) => {
      if (part.startsWith("@")) {
        const name = part.slice(1);
        const match = mentionable.find(
          (candidate) => candidate.toLowerCase() === name.toLowerCase()
        );
        if (match) {
          return (
            <span
              key={i}
              style={{
                color: "var(--habita-accent)",
                fontWeight: 600,
                background: "rgba(74,144,226,0.25)",
                borderRadius: 6,
                padding: "0 3px",
              }}
            >
              @{match}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <h3 style={{ marginBottom: "0.5rem" }}>{title || "Chat"}</h3>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.5rem",
          background: "var(--habita-card)",
          border: "1px solid rgba(74,144,226,0.25)",
          borderRadius: 10,
          marginBottom: "0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
        }}
      >
        {messages.map((m) => {
          const self = m.sender === "You";
          const isMentioningYou = m.text.includes("@You");
          const bubbleBg = self
            ? "var(--habita-accent)"
            : isMentioningYou
            ? "rgba(255,223,0,0.20)" // light attention when you’re tagged
            : "var(--habita-chip)";

        return (
          <div
            key={m.id}
            style={{
              alignSelf: self ? "flex-end" : "flex-start",
              background: bubbleBg,
              color: self ? "#fff" : "var(--habita-text)",
              borderRadius: 12,
              padding: "0.5rem 0.8rem",
              maxWidth: "80%",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              {renderWithMentions(m.text)}
            </p>
            <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{m.timestamp}</span>
          </div>
        );})}
      </div>

        <form onSubmit={handleSend} style={formStyle}>
        <div style={{ position: "relative", flex: 1 }}>
            <input
            value={draft}
            onChange={(event) => {
                const value = event.target.value;
                setDraft(value);

                // 🧠 Detect typing of '@' and show dropdown
                const match = value.match(/@(\w*)$/);
                if (match !== null) {
                    const query = match[1]?.toLowerCase() || "";
                    setMentionQuery(query);
                    setShowMentions(true);
                } else {
                    setMentionQuery("");
                    setShowMentions(false);
                }
                }}

            placeholder="Type a message... Use @ to mention a roommate"
            style={inputStyle}
            />

            {showMentions && (
                <div
                    style={{
                    position: "absolute",
                    bottom: "110%",
                    left: 0,
                    right: 0,
                    background: "var(--habita-card)",
                    border: "1px solid var(--habita-border)",
                    borderRadius: 8,
                    padding: "0.3rem 0",
                    zIndex: 10,
                    }}
                >
                {names
                .filter((n) => n !== "You")
                .filter((n) => n.toLowerCase().startsWith(mentionQuery || ""))
                .map((n) => (
                    <div
                    key={n}
                    onClick={() => {
                        setDraft((prev) => prev.replace(/@\w*$/, `@${n} `));
                        setShowMentions(false);
                    }}
                    style={{
                        padding: "0.4rem 0.6rem",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                    }}
                    >
                    @{n}
                    </div>
                ))}
            </div>
            )}
        </div>

        <button type="submit" style={sendButtonStyle} disabled={!draft.trim()}>
            Send
        </button>
        </form>

    </div>
  );
}

// --- Styles --------------------------------------------------------

const formStyle = {
  display: "flex",
  gap: "0.5rem",
  width: "100%",
  alignItems: "center",
  minWidth: 0,
};

const inputStyle = {
  flex: 1,
  width: "100%",
  borderRadius: "16px",
  border: "1px solid var(--habita-border)",
  padding: "0.8rem 1rem",
  fontSize: "1rem",
  outline: "none",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
  minWidth: 0,
};

const sendButtonStyle = {
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "999px",
  padding: "0.5rem 1rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
  transition: "opacity 0.2s ease",
};
