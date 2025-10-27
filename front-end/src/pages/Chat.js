import { useEffect, useMemo, useRef, useState } from "react";

const roommates = ["Alex", "Sam", "Jordan"];

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
              <div style={avatarStyle}>{msg.sender.charAt(0)}</div>
            )}
            <div
              style={{
                ...bubbleStyle,
                background: msg.isSelf ? "#4A90E2" : "white",
                color: msg.isSelf ? "white" : "#333",
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
                  color: msg.isSelf ? "rgba(255,255,255,0.8)" : "#9ba3b4",
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
  backgroundColor: "#f7f8fa",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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
  border: "1px solid #d4d7de",
  background: "white",
  borderRadius: "999px",
  padding: "0.35rem 0.9rem",
  fontSize: "0.8rem",
  cursor: "pointer",
  color: "#4a4a4a",
};

const switcherButtonActiveStyle = {
  background: "#4A90E2",
  color: "white",
  borderColor: "#4A90E2",
  boxShadow: "0 2px 6px rgba(74,144,226,0.2)",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.15rem",
  color: "#333",
};

const subtitleStyle = {
  margin: "0.2rem 0 0",
  fontSize: "0.8rem",
  color: "#777",
};

const messagesWrapperStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "0.5rem",
  borderRadius: "12px",
  backgroundColor: "#eef1f6",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
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
  background: "#d9e4ff",
  color: "#4A90E2",
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
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
};

const senderStyle = {
  fontSize: "0.75rem",
  color: "#4A4A4A",
  fontWeight: 600,
};

const messageTextStyle = {
  margin: 0,
  fontSize: "0.9rem",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const timestampStyle = {
  fontSize: "0.7rem",
};

const toolbarStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const quickReplyWrapperStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const quickReplyButtonStyle = {
  border: "none",
  backgroundColor: "#fff",
  borderRadius: "999px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.75rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  cursor: "pointer",
};

const formStyle = {
  display: "flex",
  gap: "0.5rem",
};

const inputStyle = {
  flex: 1,
  borderRadius: "999px",
  border: "1px solid #d5d9e3",
  padding: "0.5rem 0.9rem",
  fontSize: "0.9rem",
  outline: "none",
};

const sendButtonStyle = {
  backgroundColor: "#4A90E2",
  color: "white",
  border: "none",
  borderRadius: "999px",
  padding: "0.5rem 1rem",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.9rem",
};
