import { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";

export default function ChatThread({ contextType, contextId, title }) {
  const { getMessages, sendMessage } = useChat();
  const [messages, setMessages] = useState(() =>
    getMessages(contextType, contextId)
  );
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages(getMessages(contextType, contextId));
  }, [contextType, contextId, getMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(contextType, contextId, "You", draft);
    setMessages(getMessages(contextType, contextId));
    setDraft("");
  };

  return (
    <div style={container}>
      <h3 style={titleStyle}>{title || "Chat"}</h3>
      <div ref={scrollRef} style={chatBox}>
        {messages.map((m) => (
          <div key={m.id} style={m.sender === "You" ? selfMsg : otherMsg}>
            <p style={msgText}>{m.text}</p>
            <span style={msgTime}>{m.timestamp}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={form}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          style={input}
        />
        <button style={button}>Send</button>
      </form>
    </div>
  );
}

const container = { display: "flex", flexDirection: "column", height: "100%" };
const titleStyle = { fontSize: "1rem", marginBottom: "0.5rem" };
const chatBox = { flex: 1, overflowY: "auto", padding: "0.5rem", background: "var(--habita-card)", borderRadius: "10px", marginBottom: "0.5rem" };
const selfMsg = { alignSelf: "flex-end", background: "var(--habita-accent)", color: "#fff", borderRadius: "12px", padding: "0.5rem 0.8rem", margin: "0.3rem 0", maxWidth: "80%" };
const otherMsg = { alignSelf: "flex-start", background: "var(--habita-chip)", borderRadius: "12px", padding: "0.5rem 0.8rem", margin: "0.3rem 0", maxWidth: "80%" };
const msgText = { margin: 0, fontSize: "0.9rem" };
const msgTime = { fontSize: "0.7rem", opacity: 0.7 };
const form = { display: "flex", gap: "0.5rem" };
const input = { flex: 1, borderRadius: "8px", padding: "0.5rem", border: "1px solid var(--habita-border)" };
const button = { border: "none", borderRadius: "8px", background: "var(--habita-accent)", color: "#fff", padding: "0.5rem 1rem" };
