import { useEffect, useMemo, useRef, useState } from "react";
import { useBills } from "../context/BillsContext";
import { useChat } from "../context/ChatContext";
import { useTasks } from "../context/TasksContext";

const roommates = ["Alex", "Sam", "Jordan"];
const roommateProfiles = {
  Alex: { role: "Organizer", fun: "Keeps the house calendar in check." },
  Sam: { role: "Bills Lead", fun: "Balances every split in seconds." },
  Jordan: { role: "Cleaning Crew", fun: "Owns the spotless kitchen playlist." },
};

const baseThreads = {
  house: {
    id: "house",
    name: "House Chat",
    type: "group",
    contextType: "house",
    contextId: null,
    participants: roommates,
    messages: [
      {
        id: 1,
        sender: "Alex",
        text: "Morning! Recycling pickup is tonight.",
        timestamp: "09:12",
      },
      {
        id: 2,
        sender: "Sam",
        text: "Thanks! I’ll tie up the bags after class.",
        timestamp: "09:15",
      },
      {
        id: 3,
        sender: "You",
        text: "I'll take them downstairs before dinner.",
        timestamp: "09:17",
      },
    ],
  },
};

roommates.forEach((roommate, index) => {
  baseThreads[`direct-${roommate}`] = {
    id: `direct-${roommate}`,
    name: roommate,
    type: "direct",
    contextType: "direct",
    contextId: roommate,
    participants: [roommate],
    messages: [
      {
        id: 100 + index * 2,
        sender: roommate,
        text: "Hey! Need to sync later?",
        timestamp: "20:05",
      },
      {
        id: 100 + index * 2 + 1,
        sender: "You",
        text: "Sure thing, ping me anytime.",
        timestamp: "20:07",
      },
    ],
  };
});

const quickReplies = ["On my way!", "Can someone cover tonight?", "All set ✅"];
const mentionFallback = ["You", ...roommates];

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDueDate(value) {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "";
  return new Date(parsed).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function normalizeMentions(text, names = mentionFallback) {
  return text.replace(/@(\w+)/g, (_match, raw) => {
    const target = names.find(
      (name) => name.toLowerCase() === String(raw).toLowerCase()
    );
    return target ? `@${target}` : `@${raw}`;
  });
}

function uniqueParticipants(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return Array.from(new Set(value));
  }
  return [value];
}

export default function Chat() {
  const { bills } = useBills();
  const { tasks } = useTasks();
  const { threads: storedThreads, sendMessage } = useChat();

  const initialIsMobile =
    typeof window !== "undefined" ? window.innerWidth <= 900 : false;
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [viewMode, setViewMode] = useState(initialIsMobile ? "list" : "chat");
  const [activeThreadId, setActiveThreadId] = useState(
    initialIsMobile ? null : "house"
  );
  const [draft, setDraft] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [hoveredProfile, setHoveredProfile] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        const mobile = window.innerWidth <= 900;
        setIsMobile(mobile);
        if (!mobile && !activeThreadId) {
          setActiveThreadId("house");
          setViewMode("chat");
        }
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeThreadId]);

  const { sections, threadMap, defaultThreadId, hasAnyThread } = useMemo(() => {
    const sections = [
      { key: "house", label: "House", threads: [] },
      { key: "tasks", label: "Tasks", threads: [] },
      { key: "bills", label: "Bills", threads: [] },
      { key: "direct", label: "Direct", threads: [] },
    ];
    const lookup = {};

    const formatStored = (list = []) =>
      list.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp,
        isSelf: msg.sender === "You",
        isSystem: msg.sender === "System" || msg.isSystem,
      }));

    const upsert = (sectionKey, thread) => {
      if (!thread) return;
      const section = sections.find((item) => item.key === sectionKey);
      if (!section) return;
      section.threads.push(thread);
      lookup[thread.id] = thread;
    };

    const houseStored = storedThreads.house ?? [];
    const houseThread = {
      ...baseThreads.house,
      name: "# house-chat",
      messages: [...baseThreads.house.messages, ...formatStored(houseStored)],
    };
    upsert("house", houseThread);

    roommates.forEach((roommate) => {
      const key = `direct-${roommate}`;
      const stored = storedThreads[key] ?? [];
      upsert("direct", {
        ...baseThreads[key],
        messages: [...baseThreads[key].messages, ...formatStored(stored)],
      });
    });

    Object.entries(storedThreads).forEach(([key, list]) => {
      if (!key.startsWith("task-") || !Array.isArray(list) || list.length === 0) {
        return;
      }
      const taskId = key.slice(5);
      const task = tasks.find((item) => String(item.id) === taskId);
      upsert("tasks", {
        id: key,
        name: task ? task.title : `Task ${taskId}`,
        type: "task",
        contextType: "task",
        contextId: taskId,
        participants: uniqueParticipants(task?.assignees),
        messages: formatStored(list),
      });
    });

    bills.forEach((bill) => {
      const key = `bill-${bill.id}`;
      const stored = storedThreads[key] ?? [];
      const dueLabel = formatDueDate(bill.dueDate);
      const intro = {
        id: `${key}-intro`,
        sender: "System",
        text: `Created ${bill.title} for $${Number(bill.amount || 0).toFixed(
          2
        )}.${dueLabel ? ` Due ${dueLabel}.` : ""}`,
        timestamp: formatTimestamp(new Date()),
        isSystem: true,
      };
      upsert("bills", {
        id: key,
        name: bill.title || "Bill",
        type: "bill",
        contextType: "bill",
        contextId: bill.id,
        participants: Array.isArray(bill.splitBetween) ? bill.splitBetween : [],
        messages: [intro, ...formatStored(stored)],
      });
    });

    const defaultThread =
      sections.find((section) => section.threads.length > 0)?.threads[0]?.id ??
      null;
    const hasAny = sections.some((section) => section.threads.length > 0);

    return { sections, threadMap: lookup, defaultThreadId: defaultThread, hasAnyThread: hasAny };
  }, [bills, storedThreads, tasks]);

  useEffect(() => {
    if (!isMobile && !activeThreadId && defaultThreadId) {
      setActiveThreadId(defaultThreadId);
    }
  }, [isMobile, activeThreadId, defaultThreadId]);

  useEffect(() => {
    if (activeThreadId && !threadMap[activeThreadId]) {
      if (isMobile) {
        setActiveThreadId(null);
        setViewMode("list");
      } else {
        setActiveThreadId(defaultThreadId || null);
      }
    }
  }, [activeThreadId, threadMap, defaultThreadId, isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setViewMode("chat");
    } else if (!activeThreadId) {
      setViewMode("list");
    }
  }, [isMobile, activeThreadId]);

  const activeThread = activeThreadId ? threadMap[activeThreadId] : null;

  const mentionOptions = useMemo(() => {
    const set = new Set([
      ...mentionFallback,
      ...(activeThread?.participants ?? []),
    ]);
    return Array.from(set);
  }, [activeThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThreadId, activeThread?.messages?.length]);

  const handleSend = (text) => {
    const trimmed = text.trim();
    if (!trimmed || !activeThread) return;

    const normalized = normalizeMentions(trimmed, mentionOptions);
    sendMessage(
      activeThread.contextType,
      activeThread.contextId,
      "You",
      normalized
    );
    setDraft("");
    setShowMentions(false);
    setMentionQuery("");
  };

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mentionOptions;
    return mentionOptions.filter((name) =>
      name.toLowerCase().startsWith(mentionQuery.toLowerCase())
    );
  }, [mentionOptions, mentionQuery]);

  const handleThreadSelect = (threadId) => {
    setActiveThreadId(threadId);
    if (isMobile) {
      setViewMode("chat");
    }
  };

  const handleBackToList = () => {
    setActiveThreadId(null);
    setViewMode("list");
    setDraft("");
    setShowMentions(false);
    setMentionQuery("");
  };

  const renderThreadList = () => (
    <div style={threadListStyle}>
      <div style={listHeaderStyle}>
        <h2 style={listTitleStyle}>Chats</h2>
        <p style={listHintStyle}>
          {hasAnyThread
            ? "Pick someone to message."
            : "No chats yet—start one from a task or bill."}
        </p>
      </div>
      {sections.map((section) => (
        <div key={section.key} style={threadSectionStyle}>
          <div style={sectionTitleStyle}>{section.label}</div>
          {section.threads.length === 0 ? (
            <div style={emptySectionNoteStyle}>Nothing here yet.</div>
          ) : (
            section.threads.map((thread) => {
              const last = thread.messages[thread.messages.length - 1];
              const preview = last
                ? `${last.sender === "You" ? "You" : last.sender}: ${last.text}`
                : "No messages yet";
              return (
                <button
                  key={thread.id}
                  type="button"
                  style={{
                    ...threadButtonStyle,
                    ...(thread.id === activeThreadId ? threadButtonActiveStyle : {}),
                  }}
                  onClick={() => handleThreadSelect(thread.id)}
                >
                  <span style={threadButtonNameStyle}>{thread.name}</span>
                  <span style={threadButtonPreviewStyle}>{preview}</span>
                </button>
              );
            })
          )}
        </div>
      ))}
    </div>
  );

  const renderChatPane = () => {
    if (!activeThread) {
      return (
        <div style={chatPaneStyle}>
          {isMobile && (
            <button type="button" style={backButtonStyle} onClick={handleBackToList}>
              ← Chats
            </button>
          )}
          <div style={emptyChatStyle}>Pick a conversation to start chatting.</div>
        </div>
      );
    }

    const subtitle =
      activeThread.type === "group"
        ? roommates.join(" • ")
        : activeThread.type === "bill"
        ? "Bill conversation"
        : activeThread.type === "task"
        ? "Task chat"
        : activeThread.participants?.[0]
        ? `Direct message with ${activeThread.participants[0]}`
        : "";

    return (
      <div style={chatPaneStyle}>
        <header style={chatHeaderStyle}>
          {isMobile && (
            <button type="button" style={backButtonStyle} onClick={handleBackToList}>
              ← Chats
            </button>
          )}
          <div>
            <h2 style={chatTitleStyle}>{activeThread.name}</h2>
            <p style={chatSubtitleStyle}>{subtitle}</p>
          </div>
        </header>

        <div ref={scrollRef} style={messagesWrapperStyle}>
          {activeThread.messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...messageRowStyle,
                justifyContent: msg.sender === "You" ? "flex-end" : "flex-start",
              }}
            >
              {msg.sender !== "You" && !msg.isSystem && (
                <div
                  style={avatarWrapperStyle}
                  onMouseEnter={() => setHoveredProfile({ id: msg.id, name: msg.sender })}
                  onMouseLeave={() => setHoveredProfile(null)}
                >
                  <div style={avatarStyle}>{msg.sender.charAt(0)}</div>
                  {hoveredProfile?.id === msg.id && (
                    <div style={avatarTooltipStyle}>
                      <strong style={tooltipTitleStyle}>{msg.sender}</strong>
                      <span style={tooltipMetaStyle}>
                        {roommateProfiles[msg.sender]?.role ?? "Participant"}
                      </span>
                      <span style={tooltipFunStyle}>
                        {roommateProfiles[msg.sender]?.fun ?? "Stays in the loop."}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div
                style={{
                  ...bubbleStyle,
                  background: msg.sender === "You"
                    ? "var(--habita-accent)"
                    : msg.isSystem
                    ? "rgba(74,144,226,0.18)"
                    : "var(--habita-card)",
                  border: msg.sender === "You"
                    ? "1px solid transparent"
                    : "1px solid rgba(74,144,226,0.25)",
                  color: msg.sender === "You"
                    ? "var(--habita-button-text)"
                    : "var(--habita-text)",
                  alignItems: msg.sender === "You" ? "flex-end" : "flex-start",
                  opacity: msg.isSystem ? 0.85 : 1,
                }}
              >
                {msg.sender !== "You" && !msg.isSystem && (
                  <span style={senderStyle}>{msg.sender}</span>
                )}
                <p style={messageTextStyle}>
                  {msg.text.split(/(@\w+)/g).map((part, index) => {
                    if (part.startsWith("@")) {
                      const raw = part.slice(1);
                      const match = mentionOptions.find(
                        (name) => name.toLowerCase() === raw.toLowerCase()
                      );
                      if (match) {
                        return (
                          <span
                            key={`${msg.id}-mention-${index}`}
                            style={mentionHighlightStyle}
                          >
                            @{match}
                          </span>
                        );
                      }
                    }
                    return <span key={`${msg.id}-part-${index}`}>{part}</span>;
                  })}
                </p>
                <span
                  style={{
                    ...timestampStyle,
                    color: msg.sender === "You"
                      ? "rgba(255,255,255,0.85)"
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
                onClick={() => handleSend(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(draft);
            }}
            style={formStyle}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <input
                value={draft}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft(value);
                  const match = value.match(/@(\w*)$/);
                  if (match) {
                    setMentionQuery(match[1].toLowerCase());
                    setShowMentions(true);
                  } else {
                    setMentionQuery("");
                    setShowMentions(false);
                  }
                }}
                placeholder={
                  activeThread.name ? `Message ${activeThread.name}` : "Type a message"
                }
                style={inputStyle}
              />
              {showMentions && filteredMentions.length > 0 && (
                <div style={mentionDropdownStyle}>
                  {filteredMentions.map((name) => (
                    <div
                      key={name}
                      style={mentionRowStyle}
                      onClick={() => {
                        setDraft((prev) => prev.replace(/@\w*$/, `@${name} `));
                        setShowMentions(false);
                        setMentionQuery("");
                      }}
                    >
                      @{name}
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
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      {isMobile ? (
        viewMode === "list" ? renderThreadList() : renderChatPane()
      ) : (
        <div style={splitLayoutStyle}>
          {renderThreadList()}
          {renderChatPane()}
        </div>
      )}
    </div>
  );
}

const pageStyle = {
  display: "flex",
  flexDirection: "column",
  background: "var(--habita-bg)",
  color: "var(--habita-text)",
  padding: "1rem",
  gap: "1.25rem",
  minHeight: "100%",
  boxSizing: "border-box",
};

const splitLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gap: "1.25rem",
  width: "100%",
};

const threadListStyle = {
  background: "rgba(74,144,226,0.08)",
  border: "1px solid rgba(74,144,226,0.25)",
  borderRadius: "12px",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const listHeaderStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const listTitleStyle = {
  margin: 0,
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const listHintStyle = {
  margin: 0,
  fontSize: "0.82rem",
  color: "var(--habita-muted)",
};

const threadSectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const sectionTitleStyle = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--habita-muted)",
};

const emptySectionNoteStyle = {
  fontSize: "0.78rem",
  color: "var(--habita-muted)",
};

const threadButtonStyle = {
  border: "1px solid rgba(74,144,226,0.2)",
  background: "rgba(74,144,226,0.12)",
  borderRadius: "10px",
  padding: "0.6rem 0.75rem",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  cursor: "pointer",
  color: "var(--habita-text)",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
};

const threadButtonActiveStyle = {
  background: "rgba(74,144,226,0.22)",
  borderColor: "rgba(74,144,226,0.4)",
};

const threadButtonNameStyle = {
  fontSize: "0.92rem",
  fontWeight: 600,
};

const threadButtonPreviewStyle = {
  fontSize: "0.78rem",
  color: "var(--habita-muted)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const chatPaneStyle = {
  background: "rgba(74,144,226,0.08)",
  border: "1px solid rgba(74,144,226,0.25)",
  borderRadius: "12px",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  minHeight: "60vh",
};

const emptyChatStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
  textAlign: "center",
};

const chatHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
};

const backButtonStyle = {
  border: "none",
  background: "transparent",
  color: "var(--habita-accent)",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
};

const chatTitleStyle = {
  margin: 0,
  fontSize: "1.2rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const chatSubtitleStyle = {
  margin: 0,
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const messagesWrapperStyle = {
  flex: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  paddingRight: "0.25rem",
};

const messageRowStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "0.6rem",
};

const avatarWrapperStyle = {
  position: "relative",
};

const avatarStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  background: "rgba(74,144,226,0.2)",
  color: "var(--habita-accent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: "0.85rem",
};

const avatarTooltipStyle = {
  position: "absolute",
  top: "-10px",
  left: "calc(100% + 12px)",
  background: "var(--habita-card)",
  border: "1px solid rgba(74,144,226,0.25)",
  borderRadius: "10px",
  padding: "0.55rem",
  zIndex: 5,
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  minWidth: "160px",
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

const bubbleStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  maxWidth: "70%",
  padding: "0.65rem 0.85rem",
  borderRadius: "12px",
};

const mentionHighlightStyle = {
  color: "var(--habita-accent)",
  fontWeight: 600,
  background: "rgba(74,144,226,0.15)",
  borderRadius: 6,
  padding: "0 3px",
};

const senderStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  fontWeight: 600,
};

const messageTextStyle = {
  margin: 0,
  fontSize: "0.9rem",
  lineHeight: 1.45,
  wordBreak: "break-word",
};

const timestampStyle = {
  fontSize: "0.68rem",
  color: "var(--habita-muted)",
};

const toolbarStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  borderTop: "1px solid rgba(74,144,226,0.25)",
  paddingTop: "0.75rem",
};

const quickReplyWrapperStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const quickReplyButtonStyle = {
  border: "1px solid rgba(74,144,226,0.3)",
  background: "rgba(74,144,226,0.12)",
  borderRadius: "999px",
  padding: "0.4rem 0.8rem",
  fontSize: "0.75rem",
  cursor: "pointer",
  color: "var(--habita-text)",
};

const formStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
};

const inputStyle = {
  flex: 1,
  borderRadius: "999px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "0.6rem 1.1rem",
  fontSize: "0.9rem",
  outline: "none",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
  minWidth: 0,
};

const mentionDropdownStyle = {
  position: "absolute",
  bottom: "110%",
  left: 0,
  right: 0,
  background: "var(--habita-card)",
  border: "1px solid rgba(74,144,226,0.3)",
  borderRadius: 8,
  padding: "0.3rem 0",
  zIndex: 10,
};

const mentionRowStyle = {
  padding: "0.4rem 0.6rem",
  cursor: "pointer",
  fontSize: "0.85rem",
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
  transition: "opacity 0.2s ease",
};
