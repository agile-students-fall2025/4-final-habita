import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";

const roommateProfiles = {
  Alex: { role: "Organizer", fun: "Keeps the house calendar in check." },
  Sam: { role: "Bills Lead", fun: "Balances every split in seconds." },
  Jordan: { role: "Cleaning Crew", fun: "Owns the spotless kitchen playlist." },
};

const quickReplies = ["On my way!", "Can someone cover tonight?", "All set ✅"];
const mentionFallback = [];
const LAST_SEEN_STORAGE_KEY = "habita:chat:last-seen";
const MUTED_STORAGE_KEY = "habita:chat:muted";

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sectionDefinitions = [
  { key: "house", label: "House", matcher: (thread) => thread.contextType === "house" || (thread.tags || []).includes("house") },
  { key: "tasks", label: "Tasks", matcher: (thread) => thread.contextType === "task" },
  { key: "bills", label: "Bills", matcher: (thread) => thread.contextType === "bill" },
  { key: "direct", label: "Direct", matcher: (thread) => thread.contextType === "direct" },
  { key: "other", label: "Other", matcher: () => true },
];

const formatTimestamp = (value) => {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function Chat() {
  const {
    threads,
    messagesByThread,
    loadMessages,
    sendMessage,
    ensureThread,
    markThreadRead,
    status,
  } = useChat();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const currentUserName = user?.name || user?.username || "";

  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 900 : false));
  const [viewMode, setViewMode] = useState(isMobile ? "list" : "chat");
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [draft, setDraft] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [hoveredProfile, setHoveredProfile] = useState(null);
  const [currentAnchor, setCurrentAnchor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef(null);
  const normalizeName = useCallback(
    (name) => name || currentUserName,
    [currentUserName]
  );

  const [lastSeen, setLastSeen] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem(LAST_SEEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [mutedThreads, setMutedThreads] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(MUTED_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const markThreadAsRead = useCallback((threadId, totalMessages = 0) => {
    setLastSeen((prev) => {
      const nextCount = Math.max(totalMessages, 0);
      if (prev[threadId] === nextCount) return prev;
      return { ...prev, [threadId]: nextCount };
    });
  }, []);

  const toggleMuteThread = useCallback((threadId) => {
    setMutedThreads((prev) =>
      prev.includes(threadId) ? prev.filter((id) => id !== threadId) : [...prev, threadId]
    );
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_SEEN_STORAGE_KEY, JSON.stringify(lastSeen));
    }
  }, [lastSeen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTED_STORAGE_KEY, JSON.stringify(mutedThreads));
    }
  }, [mutedThreads]);

  const clearNavigationState = useCallback(() => {
    navigate(location.pathname, { replace: true, state: null });
  }, [navigate, location.pathname]);

  const { sections, threadMap, defaultThreadId, hasAnyThread } = useMemo(() => {
    const clones = sectionDefinitions.map((section) => ({
      ...section,
      threads: [],
    }));
    const defaultSection = clones.find((section) => section.key === "other");
    const addToSection = (thread) => {
      const target = clones.find((section) => section.matcher(thread)) || defaultSection;
      target.threads.push(thread);
    };
    threads.forEach(addToSection);
    const map = Object.fromEntries(threads.map((thread) => [thread.id, thread]));
    const defaultThread =
      clones.find((section) => section.threads.length > 0)?.threads[0]?.id ?? null;
    const hasAny = clones.some((section) => section.threads.length > 0);
    return { sections: clones, threadMap: map, defaultThreadId: defaultThread, hasAnyThread: hasAny };
  }, [threads]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      if (!mobile && !activeThreadId) {
        setViewMode("chat");
        setActiveThreadId(defaultThreadId);
      }
      if (mobile && !viewMode) {
        setViewMode("list");
      }
    };
    handleResize();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
    return () => {};
  }, [activeThreadId, defaultThreadId, viewMode]);

  useEffect(() => {
    if (!isMobile && !activeThreadId && defaultThreadId) {
      setActiveThreadId(defaultThreadId);
    }
  }, [isMobile, activeThreadId, defaultThreadId]);

  const activeThread = activeThreadId ? threadMap[activeThreadId] : null;
  const activePresentation = useMemo(
    () => getThreadPresentation(activeThread, currentUserName),
    [activeThread, currentUserName]
  );
  const activeMessages = activeThread ? messagesByThread[activeThread.id] || [] : [];

  useEffect(() => {
    if (!location?.state) return;
    const { openThreadId, openThreadContext } = location.state;
    if (openThreadId) {
      setActiveThreadId(openThreadId);
      setViewMode("chat");
      clearNavigationState();
      return;
    }
    if (openThreadContext) {
      ensureThread(openThreadContext)
        .then((thread) => {
          if (thread?.id) {
            setActiveThreadId(thread.id);
            setViewMode("chat");
          }
        })
        .finally(() => clearNavigationState());
    }
  }, [location?.state, ensureThread, clearNavigationState]);

  useEffect(() => {
    if (!activeThread) return;
    loadMessages({
      threadId: activeThread.id,
      contextType: activeThread.contextType,
      contextId: activeThread.contextId,
      name: activeThread.name,
      participants: activeThread.participants,
    });
  }, [activeThread, loadMessages]);

  useEffect(() => {
    if (!activeThread) return;
    markThreadRead(activeThread.id).catch(() => {});
    markThreadAsRead(activeThread.id, activeMessages.length);
  }, [activeThread, activeMessages.length, markThreadAsRead, markThreadRead]);

  const deriveThreadActivity = useCallback(
    (thread) => {
      const messageCount = thread.messageCount ?? 0;
      const readCount = Math.min(lastSeen[thread.id] ?? 0, messageCount);
      const unreadCount = Math.max(messageCount - readCount, thread.unreadCount || 0);
      const mentionCount = thread.mentionCount || 0;
      const muted = mutedThreads.includes(thread.id);
      return {
        unreadCount,
        mentionCount,
        muted,
        bold: !muted && mentionCount === 0 && unreadCount > 0,
        highlight: !muted && mentionCount > 0,
        readCount,
      };
    },
    [lastSeen, mutedThreads]
  );

  const getThreadMatchInfo = useCallback(
    (thread) => {
      const presentation = getThreadPresentation(thread, currentUserName);
      const displayName = presentation.title.toLowerCase();
      const lastSender = thread.lastMessage ? normalizeName(thread.lastMessage.sender) : "";
      const defaultPreview = thread.lastMessage
        ? `${lastSender}: ${thread.lastMessage.text}`
        : "No messages yet";
      if (!normalizedSearch) {
        return { matches: true, snippet: defaultPreview, presentation };
      }
      const nameMatch = displayName.includes(normalizedSearch);
      const lastMessageMatch =
        thread.lastMessage &&
        thread.lastMessage.text.toLowerCase().includes(normalizedSearch);
      return {
        matches: nameMatch || lastMessageMatch,
        snippet: lastMessageMatch ? defaultPreview : thread.lastMessage?.text || defaultPreview,
        presentation,
      };
    },
    [normalizedSearch, normalizeName]
  );

  const renderHighlighted = useCallback(
    (text) => {
      if (!normalizedSearch) return text;
      const regex = new RegExp(`(${escapeRegExp(normalizedSearch)})`, "ig");
      const parts = String(text).split(regex);
      const lowerTerm = normalizedSearch.toLowerCase();
      return parts.map((part, index) =>
        part.toLowerCase() === lowerTerm ? (
          <span key={`${part}-${index}`} style={searchHighlightStyle}>
            {part}
          </span>
        ) : (
          <Fragment key={`${part}-${index}`}>{part}</Fragment>
        )
      );
    },
    [normalizedSearch]
  );

  const mentionOptions = useMemo(() => {
    const set = new Set(mentionFallback);
    if (activeThread?.participants) {
      activeThread.participants.forEach((name) => set.add(name));
    }
    return Array.from(set);
  }, [activeThread]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThreadId, activeMessages.length]);

  const handleThreadSelect = (threadId, activity) => {
    if (!threadId) return;
    if (activity?.unreadCount > 0) {
      setCurrentAnchor({ threadId, index: activity.readCount });
    } else {
      setCurrentAnchor(null);
    }
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
    setCurrentAnchor(null);
  };

  const filteredSections = useMemo(() => {
    if (!normalizedSearch) return sections;
    return sections.map((section) => {
      const filtered = section.threads
        .map((thread) => {
          const info = getThreadMatchInfo(thread);
          return info.matches ? { thread, snippet: info.snippet, presentation: info.presentation } : null;
        })
        .filter(Boolean);
      return { ...section, threads: filtered };
    });
  }, [sections, normalizedSearch, getThreadMatchInfo]);

  const filteredMentions = useMemo(() => {
    if (!mentionQuery) return mentionOptions;
    return mentionOptions.filter((name) =>
      name.toLowerCase().startsWith(mentionQuery.toLowerCase())
    );
  }, [mentionOptions, mentionQuery]);

  const handleSendMessage = useCallback(
    async (text, options) => {
      const trimmed = text.trim();
      if (!trimmed || !activeThread) return;
      const normalized = normalizeMentions(trimmed, options);
      try {
        await sendMessage({
          threadId: activeThread.id,
          contextType: activeThread.contextType,
          contextId: activeThread.contextId,
          sender: currentUserName,
          text: normalized,
          name: activeThread.name,
          participants: activeThread.participants,
        });
        setDraft("");
        setShowMentions(false);
        setMentionQuery("");
        setCurrentAnchor(null);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("[chat] send failed", error);
      }
    },
    [activeThread, sendMessage, currentUserName]
  );

  const renderThreadList = () => (
    <div style={threadListStyle}>
      
      <div style={searchWrapperStyle}>
        <span style={searchIconStyle} aria-hidden="true">
          🔍
        </span>
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search chats or messages"
          style={searchInputStyle}
        />
        {searchTerm && (
          <button type="button" style={clearSearchButtonStyle} onClick={() => setSearchTerm("")}>
            Clear
          </button>
        )}
      </div>
      {filteredSections.map((section) => (
        <div key={section.key} style={threadSectionStyle}>
          <div style={sectionTitleStyle}>{section.label}</div>
          {section.threads.length === 0 ? (
            <div style={emptySectionNoteStyle}>
              {normalizedSearch ? "No matches in this section." : "Nothing here yet."}
            </div>
          ) : (
            section.threads.map((entry) => {
              const thread = entry.thread || entry;
              const activity = deriveThreadActivity(thread);
              const presentation =
                entry.presentation || getThreadPresentation(thread, currentUserName);
              const displayName = presentation.title;
              const nameContent = normalizedSearch
                ? renderHighlighted(displayName)
                : displayName;
              const threadMessages = messagesByThread[thread.id] || [];
const lastFromMessages =
  threadMessages.length > 0
    ? threadMessages[threadMessages.length - 1]
    : null;

// Prefer the "live" last message from messagesByThread,
// fall back to thread.lastMessage, then to any search snippet.
          const last = lastFromMessages || thread.lastMessage || null;

          let preview;
          if (last) {
            const senderLabel = normalizeName(last.sender);
            const baseText = entry.snippet || last.text || "";
            preview = `${senderLabel}: ${baseText}`;
          } else if (entry.snippet) {
            preview = entry.snippet;
          } else {
            preview = "No messages yet";
          }

          const previewContent = normalizedSearch
            ? renderHighlighted(preview)
            : preview;
              return (
                <button
                  key={thread.id}
                  type="button"
                  style={{
                    ...threadButtonStyle,
                    ...(thread.id === activeThreadId ? threadButtonActiveStyle : {}),
                  }}
                  onClick={() => handleThreadSelect(thread.id, activity)}
                >
                  <div style={threadRowLeftStyle}>
                    <div style={threadLabelColumnStyle}>
                      <span
                        style={{
                          ...threadButtonNameStyle,
                          fontWeight:
                            activity.highlight || activity.bold ? 700 : 500,
                          color: activity.highlight ? "#ff6b6b" : "var(--habita-text)",
                        }}
                      >
                        {nameContent}
                      </span>
                      {presentation.subtitle && (
                        <span style={threadSubtitleStyle}>{presentation.subtitle}</span>
                      )}
                      <span
                        style={{
                          ...threadButtonPreviewStyle,
                          fontWeight:
                            !activity.muted && activity.unreadCount > 0 ? 600 : 400,
                          color: activity.highlight ? "#ffb4a1" : "var(--habita-muted)",
                        }}
                      >
                        {previewContent}
                      </span>
                    </div>
                  </div>
                  <div style={threadRowRightStyle}>
                    {activity.mentionCount > 0 && (
                      <span style={mentionBadgeStyle}>{activity.mentionCount}</span>
                    )}
                    {!activity.highlight &&
                      !activity.muted &&
                      activity.mentionCount === 0 &&
                      activity.unreadCount > 0 && (
                        <span style={unreadBadgeStyle}>{activity.unreadCount}</span>
                      )}
                    <button
                      type="button"
                      style={muteToggleStyle(activity.muted)}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleMuteThread(thread.id);
                      }}
                      aria-label={activity.muted ? "Unmute channel" : "Mute channel"}
                    >
                      {activity.muted ? "Unmute" : "Mute"}
                    </button>
                  </div>
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
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "var(--habita-muted)",
              padding: "2rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              Select a chat from the list to start messaging.
            </p>
          </div>
        </div>
      );
    }

    const presentation = activePresentation;

    const mentionOptionsForThread = Array.from(
      new Set([...(activeThread.participants || []), ...mentionFallback])
    );


    return (
      <div style={chatPaneStyle}>
        {!isMobile && (
          <header style={chatHeaderStyle}>
            <div>
              <h2 style={chatTitleStyle}>{presentation.title}</h2>
              {presentation.subtitle && <p style={chatSubtitleStyle}>{presentation.subtitle}</p>}
            </div>
          </header>
        )}

        <div ref={scrollRef} style={messagesWrapperStyle}>
          {activeMessages.map((msg, index) => {
            const anchorIndex =
              currentAnchor?.threadId === activeThread.id ? currentAnchor.index : null;
            const showDivider =
              anchorIndex !== null &&
              index === anchorIndex &&
              anchorIndex !== activeMessages.length;
            const sender = normalizeName(msg.sender);
            const isSelf = sender === currentUserName;
            const mentionsMe =
              msg.text.includes(`@${currentUserName}`) || msg.text.includes("@You");
            return (
              <Fragment key={msg.id}>
                {showDivider && (
                  <div style={newDividerStyle}>
                    <span style={newDividerLineStyle} />
                    <span style={newDividerLabelStyle}>New messages</span>
                    <span style={newDividerLineStyle} />
                  </div>
                )}
                  <div
                    style={{
                      ...messageRowStyle,
                      justifyContent: isSelf ? "flex-end" : "flex-start",
                    }}
                  >
                  {!isSelf && (
                    <div
                      style={avatarWrapperStyle}
                      onMouseEnter={() => setHoveredProfile({ id: msg.id, name: sender })}
                      onMouseLeave={() => setHoveredProfile(null)}
                    >
                      <div style={avatarStyle}>{sender.charAt(0)}</div>
                      {hoveredProfile?.id === msg.id && (
                        <div style={avatarTooltipStyle}>
                          <strong style={tooltipTitleStyle}>{sender}</strong>
                          <span style={tooltipMetaStyle}>
                            {roommateProfiles[sender]?.role ?? "Participant"}
                          </span>
                          <span style={tooltipFunStyle}>
                            {roommateProfiles[sender]?.fun ?? "Stays in the loop."}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    style={{
                      ...bubbleStyle,
                      background:
                        isSelf
                          ? "var(--habita-accent)"
                          : mentionsMe
                          ? "rgba(255,223,0,0.20)"
                          : "var(--habita-card)",
                      border:
                        isSelf
                          ? "1px solid transparent"
                          : "1px solid rgba(74,144,226,0.25)",
                      color:
                        isSelf ? "var(--habita-button-text)" : "var(--habita-text)",
                    }}
                  >
                    {!isSelf && <span style={senderStyle}>{sender}</span>}
                    <p style={messageTextStyle}>
                      {msg.text.split(/(@\w+)/g).map((part, partIndex) => {
                        if (part.startsWith("@")) {
                          const raw = part.slice(1);
                          const match = mentionOptionsForThread.find(
                            (name) => name.toLowerCase() === raw.toLowerCase()
                          );
                          if (match) {
                            return (
                              <span key={`${msg.id}-mention-${partIndex}`} style={mentionHighlightStyle}>
                                @{match}
                              </span>
                            );
                          }
                        }
                        return <span key={`${msg.id}-part-${partIndex}`}>{part}</span>;
                      })}
                    </p>
                    <span
                      style={{
                        ...timestampStyle,
                        color: isSelf ? "rgba(255,255,255,0.85)" : "var(--habita-muted)",
                      }}
                    >
                      {msg.timestamp || formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>

        <div style={{ ...toolbarStyle, ...(isMobile ? { position: "sticky", bottom: 0, background: "var(--habita-card)", zIndex: 2 } : {}) }}>
          <div style={quickReplyWrapperStyle}>
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                style={quickReplyButtonStyle}
                onClick={() => handleSendMessage(reply, mentionOptionsForThread)}
              >
                {reply}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSendMessage(draft, mentionOptionsForThread);
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
                  presentation.title ? `Message ${presentation.title}` : "Type a message"
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

  const listHintCopy = status.loading
    ? "Loading chat history..."
    : hasAnyThread
    ? "Pick someone to message."
    : "No chats yet—start one from a task or bill.";

  const renderMobileHeaderAction = () => {
    if (viewMode !== "chat" || !activeThread) {
      return null;
    }
    if (activeThread.contextType === "task") {
      return (
        <button
          type="button"
          style={topHeaderLinkButtonStyle}
          onClick={() =>
            navigate("/tasks", { state: { openChatForTaskId: activeThread.contextId } })
          }
        >
          View task
        </button>
      );
    }
    if (activeThread.contextType === "bill") {
      return (
        <button
          type="button"
          style={topHeaderLinkButtonStyle}
          onClick={() =>
            navigate("/bills", { state: { openChatForBillId: activeThread.contextId } })
          }
        >
          View bill
        </button>
      );
    }
    return null;
  };

  return (
    <div style={pageStyle}>
      {isMobile && (
        <header style={topHeaderStyle}>
          <div style={topHeaderRowStyle}>
            <button
              type="button"
              style={backButtonStyle}
              onClick={() => {
                if (viewMode === "chat") {
                  handleBackToList();
                } else {
                  navigate("/home");
                }
              }}
            >
              ←
            </button>
            <div style={topHeaderTitleBlockStyle}>
              <h2 style={topHeaderTitleStyle}>
                {viewMode === "chat" ? activePresentation.title : "Chats"}
              </h2>
              {viewMode === "chat" ? (
                activePresentation.subtitle ? (
                  <p style={topHeaderSubtitleStyle}>{activePresentation.subtitle}</p>
                ) : null
              ) : (
                <p style={topHeaderSubtitleStyle}>{listHintCopy}</p>
              )}
            </div>
            {renderMobileHeaderAction()}
          </div>
        </header>
      )}
      {isMobile ? (
        viewMode === "list" ? (
          renderThreadList()
        ) : (
          renderChatPane()
        )
      ) : (
        <div style={splitLayoutStyle}>
          {renderThreadList()}
          {renderChatPane()}
        </div>
      )}
    </div>
  );
}

function normalizeMentions(text, names = mentionFallback) {
  return text.replace(/@(\w+)/g, (_match, raw) => {
    const target = names.find((name) => name.toLowerCase() === String(raw).toLowerCase());
    return target ? `@${target}` : `@${raw}`;
  });
}

const sanitizeThreadName = (value = "") => value.replace(/^#\s*/, "").trim();

function getThreadPresentation(thread, currentUser = "") {
  if (!thread) {
      return {
        title: "Conversation",
        subtitle: "",
        contextType: "other",
      };
  }
  const cleanedName = sanitizeThreadName(thread.name || "");
  const participants = Array.isArray(thread.participants) ? thread.participants : [];
  const others = participants.filter(
    (name) =>
      name &&
      name !== currentUser &&
      name.toLowerCase() !== "you"
  );
  const roommateCount = participants.length;
  const roommateSubtitle =
    roommateCount > 0
      ? `${roommateCount} roommate${roommateCount === 1 ? "" : "s"}`
      : "";

  switch (thread.contextType) {
    case "house":
      return {
        title: cleanedName || "House",
        subtitle: "",
        contextType: "house",
      };
    case "task":
      return {
        title: cleanedName || "Task",
        subtitle: "",
        contextType: "task",
      };
    case "bill":
      return {
        title: cleanedName || "Bill",
        subtitle: "",
        contextType: "bill",
      };
    case "direct":
      return {
        title: others[0] || cleanedName || "Direct chat",
        subtitle: "",
        contextType: "direct",
      };
    default:
      return {
        title: cleanedName || "Chat",
        subtitle: roommateSubtitle || "Conversation",
        contextType: thread.contextType || "other",
      };
  }
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

const topHeaderStyle = {
  position: "sticky",
  top: 0,
  zIndex: 5,
  backgroundColor: "var(--habita-bg)",
  padding: "0.4rem 0",
};

const topHeaderRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  width: "100%",
};

const topHeaderTitleBlockStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.15rem",
  flex: 1,
};

const topHeaderTitleStyle = {
  margin: 0,
  fontWeight: 600,
  color: "var(--habita-text)",
  fontSize: "1rem",
};

const topHeaderSubtitleStyle = {
  margin: 0,
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const topHeaderLinkButtonStyle = {
  border: "none",
  background: "rgba(74,144,226,0.12)",
  color: "var(--habita-accent)",
  borderRadius: "999px",
  padding: "0.25rem 0.8rem",
  fontSize: "0.75rem",
  fontWeight: 600,
};
const splitLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gap: "1.25rem",
  width: "100%",
};

const threadListStyle = {
  background: "var(--habita-card)",
  border: "1px solid var(--habita-border)",
  borderRadius: "12px",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const searchWrapperStyle = {
  display: "flex",
  gap: "0.4rem",
  alignItems: "center",
  border: "1px solid var(--habita-border)",
  borderRadius: "10px",
  padding: "0.35rem 0.5rem",
  background: "var(--habita-input)",
};

const searchInputStyle = {
  flex: 1,
  borderRadius: "6px",
  border: "none",
  padding: "0.4rem 0.25rem",
  fontSize: "0.85rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
  outline: "none",
};

const searchIconStyle = {
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
};

const clearSearchButtonStyle = {
  border: "none",
  background: "rgba(74,144,226,0.15)",
  color: "var(--habita-accent)",
  borderRadius: "8px",
  padding: "0.4rem 0.75rem",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const searchHighlightStyle = {
  background: "rgba(74,144,226,0.35)",
  color: "var(--habita-text)",
  borderRadius: 4,
  padding: "0 2px",
  fontWeight: 600,
};

const threadSubtitleStyle = {
  fontSize: "0.72rem",
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
  border: "1px solid rgba(74,144,226,0.25)",
  background: "var(--habita-card)",
  borderRadius: "10px",
  padding: "0.6rem 0.75rem",
  textAlign: "left",
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.75rem",
  cursor: "pointer",
  color: "var(--habita-text)",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
};

const threadButtonActiveStyle = {
  background: "rgba(74,144,226,0.12)",
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

const threadRowLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  minWidth: 0,
  flex: 1,
};

const threadLabelColumnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  minWidth: 0,
};

const threadRowRightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};

const mentionBadgeStyle = {
  background: "#ff6b6b",
  color: "#fff",
  borderRadius: "999px",
  padding: "0.05rem 0.55rem",
  fontSize: "0.7rem",
  fontWeight: 700,
  boxShadow: "0 0 0 2px rgba(255,255,255,0.15)",
};

const unreadBadgeStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderRadius: "999px",
  padding: "0.05rem 0.45rem",
  fontSize: "0.7rem",
  fontWeight: 600,
};

const muteToggleStyle = (muted) => ({
  border: "1px solid rgba(74,144,226,0.25)",
  background: muted ? "rgba(255,255,255,0.05)" : "rgba(74,144,226,0.12)",
  color: muted ? "var(--habita-muted)" : "var(--habita-accent)",
  borderRadius: "8px",
  padding: "0.2rem 0.5rem",
  fontSize: "0.72rem",
  cursor: "pointer",
});

const chatPaneStyle = {
  background: "var(--habita-card)",
  border: "1px solid var(--habita-border)",
  borderRadius: "12px",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  flex: 1,
  minHeight: 0,
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
  fontSize: "1.1rem",
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
  minHeight: 0,
};

const newDividerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  margin: "0.35rem 0",
};

const newDividerLineStyle = {
  flex: 1,
  height: "1px",
  background: "rgba(255,107,107,0.4)",
};

const newDividerLabelStyle = {
  fontSize: "0.65rem",
  color: "#ff6b6b",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
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
  color: "var(--habita-button-text)",
  fontWeight: 700,
  background: "var(--habita-accent)",
  borderRadius: 6,
  padding: "0 4px",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.25)",
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
  marginTop: "auto",
};

const quickReplyWrapperStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const quickReplyButtonStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "999px",
  padding: "0.35rem 0.8rem",
  fontSize: "0.75rem",
  cursor: "pointer",
  background: "var(--habita-chip)",
  color: "var(--habita-text)",
};

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
  boxSizing: "border-box",
};

const mentionDropdownStyle = {
  position: "absolute",
  bottom: "110%",
  left: 0,
  right: 0,
  background: "var(--habita-card)",
  border: "1px solid var(--habita-border)",
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
