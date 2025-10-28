import { useEffect, useMemo, useRef, useState } from "react";

const roommates = ["Alex", "Sam", "Jordan"];
const roommateProfiles = {
  Alex: { role: "Organizer", fun: "Keeps the house calendar in check." },
  Sam: { role: "Bills", fun: "Handles every split in under a minute." },
  Jordan: { role: "Cleaning", fun: "Loves a spotless kitchen playlist." },
};

const initialThreads = {
  house: {
    id: "house",
    name: "House Chat",
    type: "group",
    participants: roommates,
    messages: [
      {
        id: 1,
        sender: "Alex",
        text: "Morning! Reminder that recycling pickup is tonight.",
        timestamp: "09:12",
        isSelf: false,
      },
      {
        id: 2,
        sender: "Sam",
        text: "Thanks Alex! I’ll tie up the bags before dinner.",
        timestamp: "09:15",
        isSelf: false,
      },
      {
        id: 3,
        sender: "You",
        text: "I can take them downstairs after my class.",
        timestamp: "09:17",
        isSelf: true,
      },
      {
        id: 4,
        sender: "Jordan",
        text: "Legend 🙌 I’ll wipe the bins afterwards.",
        timestamp: "09:20",
        isSelf: false,
      },
    ],
  },
  Alex: {
    id: "Alex",
    name: "Alex",
    type: "direct",
    participants: ["Alex"],
    messages: [
      {
        id: 5,
        sender: "Alex",
        text: "Need help carrying the groceries later?",
        timestamp: "08:45",
        isSelf: false,
      },
      {
        id: 6,
        sender: "You",
        text: "Sure, ping me when you’re close!",
        timestamp: "08:47",
        isSelf: true,
      },
    ],
  },
  Sam: {
    id: "Sam",
    name: "Sam",
    type: "direct",
    participants: ["Sam"],
    messages: [
      {
        id: 7,
        sender: "Sam",
        text: "Wifi acting weird for you too?",
        timestamp: "21:20",
        isSelf: false,
      },
      {
        id: 8,
        sender: "You",
        text: "Yep! Restarting the router now.",
        timestamp: "21:22",
        isSelf: true,
      },
    ],
  },
  Jordan: {
    id: "Jordan",
    name: "Jordan",
    type: "direct",
    participants: ["Jordan"],
    messages: [
      {
        id: 9,
        sender: "Jordan",
        text: "Thanks for covering trash duty yesterday ❤️",
        timestamp: "18:05",
        isSelf: false,
      },
      {
        id: 10,
        sender: "You",
        text: "Anytime!",
        timestamp: "18:07",
        isSelf: true,
      },
    ],
  },
};

const quickReplies = [
  "On my way!",
  "Can someone cover for me tonight?",
  "All done ✅",
];

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const [threads, setThreads] = useState(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState("house");
  const activeThread = threads[activeThreadId];
  const [messages, setMessages] = useState(activeThread.messages);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const [hoveredProfile, setHoveredProfile] = useState(null);
  const activeRoommates = useMemo(
    () =>
      activeThread.type === "group"
        ? roommates.join(" • ")
        : activeThread.participants[0],
    [activeThread]
  );

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    setMessages(threads[activeThreadId].messages);
    setDraft("");
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThreadId, threads]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    const now = new Date();
    const userMessage = {
      id: Date.now(),
      sender: "You",
      text: trimmed,
      timestamp: formatTimestamp(now),
      isSelf: true,
    };

    setThreads((prev) => {
      const updatedThread = {
        ...prev[activeThreadId],
        messages: [...prev[activeThreadId].messages, userMessage],
      };
      return {
        ...prev,
        [activeThreadId]: updatedThread,
      };
    });
    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(draft);
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={titleStyle}>{activeThread.name}</h2>
          <p style={subtitleStyle}>
            {activeThread.type === "group"
              ? `Active: ${activeRoommates}`
              : `Direct message with ${activeRoommates}`}
          </p>
        </div>
        <span role="img" aria-label="chat bubble" style={headerEmojiStyle}>
          💬
        </span>
      </header>

      <div style={threadSwitcherStyle}>
        <button
          type="button"
          style={{
            ...switcherButtonStyle,
            ...(activeThreadId === "house" ? switcherButtonActiveStyle : {}),
          }}
          onClick={() => setActiveThreadId("house")}
          title="Group chat with everyone"
        >
          🏡 House
        </button>
        {roommates.map((roommate) => (
          <button
            key={roommate}
            type="button"
            style={{
              ...switcherButtonStyle,
              ...(activeThreadId === roommate
                ? switcherButtonActiveStyle
                : {}),
            }}
            onClick={() => setActiveThreadId(roommate)}
            title={`${roommate} • ${roommateProfiles[roommate]?.role ?? "Roommate"}`}
          >
            👤 {roommate}
          </button>
        ))}
      </div>

      <div ref={scrollRef} style={messagesWrapperStyle}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...messageRowStyle,
              justifyContent: msg.isSelf ? "flex-end" : "flex-start",
            }}
          >
            {!msg.isSelf && (
              <div
                style={avatarWrapperStyle}
                onMouseEnter={() =>
                  setHoveredProfile({ id: msg.id, name: msg.sender })
                }
                onMouseLeave={() => setHoveredProfile(null)}
              >
                <div style={avatarStyle}>{msg.sender.charAt(0)}</div>
                {hoveredProfile?.id === msg.id && (
                  <div style={avatarTooltipStyle}>
                    <strong style={tooltipTitleStyle}>{msg.sender}</strong>
                    <span style={tooltipMetaStyle}>
                      {roommateProfiles[msg.sender]?.role ?? "Roommate"}
                    </span>
                    <span style={tooltipFunStyle}>
                      {roommateProfiles[msg.sender]?.fun ??
                        "Always on top of house updates."}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div
              style={{
                ...bubbleStyle,
                background: msg.isSelf
                  ? "var(--habita-accent)"
                  : "var(--habita-card)",
                color: msg.isSelf
                  ? "var(--habita-button-text)"
                  : "var(--habita-text)",
                alignItems: msg.isSelf ? "flex-end" : "flex-start",
              }}
            >
              {!msg.isSelf && (
                <span style={senderStyle}>{msg.sender}</span>
              )}
              <p style={messageTextStyle}>{msg.text}</p>
              <span
                style={{
                  ...timestampStyle,
                  color: msg.isSelf
                    ? "rgba(255,255,255,0.8)"
                    : "var(--habita-muted)",
                }}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={toolbarStyle}>
        <div style={quickReplyWrapperStyle}>
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              style={quickReplyButtonStyle}
              onClick={() => sendMessage(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            style={inputStyle}
          />
          <button type="submit" style={sendButtonStyle} disabled={!draft.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: "1rem",
  gap: "1rem",
  backgroundColor: "var(--habita-bg)",
  color: "var(--habita-text)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--habita-card)",
  padding: "0.6rem 0.9rem",
  borderRadius: "12px",
  boxShadow: "var(--habita-shadow)",
};

const headerEmojiStyle = {
  fontSize: "1.5rem",
};

const threadSwitcherStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const switcherButtonStyle = {
  border: "1px solid var(--habita-border)",
  background: "var(--habita-card)",
  borderRadius: "999px",
  padding: "0.35rem 0.9rem",
  fontSize: "0.8rem",
  cursor: "pointer",
  color: "var(--habita-muted)",
};

const switcherButtonActiveStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderColor: "var(--habita-accent)",
  boxShadow: "0 2px 6px rgba(74,144,226,0.25)",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.15rem",
  color: "var(--habita-text)",
};

const subtitleStyle = {
  margin: "0.2rem 0 0",
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const messagesWrapperStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "0.5rem",
  borderRadius: "12px",
  backgroundColor: "var(--habita-card)",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  boxShadow: "var(--habita-shadow)",
};

const messageRowStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "flex-end",
};

const avatarStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "var(--habita-chip)",
  color: "var(--habita-chip-text)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: "0.85rem",
};

const bubbleStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  maxWidth: "70%",
  padding: "0.6rem 0.8rem",
  borderRadius: "12px",
  boxShadow: "var(--habita-shadow)",
};

const senderStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  fontWeight: 600,
};

const messageTextStyle = {
  margin: 0,
  fontSize: "0.9rem",
  lineHeight: 1.4,
  wordBreak: "break-word",
  color: "var(--habita-text)",
};

const timestampStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
};

const avatarWrapperStyle = {
  position: "relative",
  display: "flex",
};

const avatarTooltipStyle = {
  position: "absolute",
  top: "50%",
  left: "110%",
  transform: "translateY(-50%)",
  width: "180px",
  background: "var(--habita-card)",
  borderRadius: "10px",
  padding: "0.55rem",
  boxShadow: "var(--habita-shadow)",
  zIndex: 5,
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const tooltipTitleStyle = {
  fontSize: "0.85rem",
  color: "var(--habita-text)",
};

const tooltipMetaStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-accent)",
};

const tooltipFunStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
};

const toolbarStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  background: "var(--habita-card)",
  padding: "0.75rem",
  borderRadius: "12px",
  boxShadow: "var(--habita-shadow)",
};

const quickReplyWrapperStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const quickReplyButtonStyle = {
  border: "none",
  backgroundColor: "var(--habita-card)",
  borderRadius: "999px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.75rem",
  boxShadow: "var(--habita-shadow)",
  cursor: "pointer",
  color: "var(--habita-muted)",
};

const formStyle = {
  display: "flex",
  gap: "0.5rem",
};

const inputStyle = {
  flex: 1,
  borderRadius: "999px",
  border: "1px solid var(--habita-border)",
  padding: "0.5rem 0.9rem",
  fontSize: "0.9rem",
  outline: "none",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
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
  boxShadow: "var(--habita-shadow)",
};
