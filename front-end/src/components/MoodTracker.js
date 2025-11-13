import { useEffect, useMemo, useState } from "react";
import { useUser } from "../context/UserContext";

const moods = [
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😊", label: "Happy" },
];

const roommates = [
  { name: "Alex", mood: "Happy" },
  { name: "Sam", mood: "Neutral" },
  { name: "Taylor", mood: "Happy" },
  { name: "Jordan", mood: "Sad" },
];

const encouragements = {
  Happy: { message: "Keep the good vibes going!", centered: true },
  Neutral: {
    message: "Take a tiny pause for yourself.",
    centered: false,
  },
  Sad: {
    message: "Go easy on yourself and reach out if you need support.",
    centered: false,
  },
  Frustrated: {
    message: "Deep breath—you've totally got this.",
    centered: false,
  },
};

const STORAGE_KEY = "habita:mood";
const HISTORY_KEY = "habita:mood-history";
const REACTIONS_KEY = "habita:mood-reactions";
const reactionOptions = ["👍", "🍪", "❤️"];
const moodAccentStyles = {
  Happy: { bg: "rgba(74,144,226,0.2)", fg: "#0f4da8" },
  Neutral: { bg: "rgba(155,155,155,0.2)", fg: "#4f4f4f" },
  Sad: { bg: "rgba(245,166,35,0.25)", fg: "#a87012" },
  Frustrated: { bg: "rgba(208,2,27,0.22)", fg: "#a30012" },
};
export default function MoodTracker({
  variant = "default",
  onMoodChange,
  onMoodHistoryChange,
  onCheckInRequest,
}) {
  const { user: currentUser } = useUser();
  const currentUserName = currentUser?.name || "You";
  const isCompact = variant === "compact";
  const [mood, setMood] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(!isCompact);
  const [moodHistory, setMoodHistory] = useState(() => loadMoodHistory());
  const [reactionLedger, setReactionLedger] = useState(() => loadReactionLedger());

  const todayKey = new Date().toISOString().slice(0, 10);

  const encouragement = mood ? encouragements[mood.label] : null;
  const timelineDays = useMemo(() => buildTimelineDays(moodHistory), [moodHistory]);
  const householdFeed = useMemo(
    () => moodHistory.filter((entry) => entry.date === todayKey).slice(0, 5),
    [moodHistory, todayKey]
  );
  const hasHistory = moodHistory.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      const existingMood = moods.find((m) => m.label === parsed.label);
      if (existingMood && parsed.date === todayKey) {
        setMood(existingMood);
        setIsLocked(true);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [todayKey]);

  useEffect(() => {
    if (typeof onMoodChange === "function") {
      onMoodChange(mood);
    }
  }, [mood, onMoodChange]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(moodHistory));
    }
    if (typeof onMoodHistoryChange === "function") {
      onMoodHistoryChange(moodHistory);
    }
  }, [moodHistory, onMoodHistoryChange]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(REACTIONS_KEY, JSON.stringify(reactionLedger));
    }
  }, [reactionLedger]);

  const handleSelectMood = (selectedMood) => {
    setMood(selectedMood);
    setIsLocked(true);
    const entry = {
      id: `mood-${Date.now()}`,
      userName: currentUserName,
      label: selectedMood.label,
      emoji: selectedMood.emoji,
      date: todayKey,
      timestamp: new Date().toISOString(),
      reactions: {},
    };
    setMoodHistory((prev) => {
      const filtered = prev.filter(
        (item) => !(item.userName === currentUserName && item.date === todayKey)
      );
      return [entry, ...filtered];
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ label: selectedMood.label, date: todayKey })
      );
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setMood(null);
    setMoodHistory((prev) =>
      prev.filter((item) => !(item.userName === currentUserName && item.date === todayKey))
    );
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    if (typeof onMoodChange === "function") {
      onMoodChange(null);
    }
  };

  const handleReaction = (entryId, emoji) => {
    if (reactionLedger[entryId]) return;
    setMoodHistory((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              reactions: {
                ...entry.reactions,
                [emoji]: (entry.reactions?.[emoji] || 0) + 1,
              },
            }
          : entry
      )
    );
    setReactionLedger((prev) => ({ ...prev, [entryId]: emoji }));
  };

  const shouldShowCheckIn = (entry) =>
    entry.userName !== currentUserName && (entry.label === "Sad" || entry.label === "Frustrated");

  return (
    <div
      style={{
        ...cardStyle,
        padding: isCompact ? "0.65rem 0.75rem" : cardStyle.padding,
        textAlign: isCompact ? "left" : cardStyle.textAlign,
      }}
    >
      <h3
        style={{
          ...titleStyle,
          textAlign: isCompact ? "left" : "center",
          marginBottom: isCompact ? "0.6rem" : titleStyle.marginBottom,
        }}
      >
        Your Mood Today
      </h3>
      {!isLocked && (
        <div
          style={{
            ...moodContainer,
            justifyContent: isCompact ? "flex-start" : moodContainer.justifyContent,
            marginBottom: isCompact ? "0.35rem" : moodContainer.marginBottom,
          }}
        >
          {moods.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => handleSelectMood(m)}
              style={{
                ...moodButton,
                backgroundColor:
                  mood?.label === m.label
                    ? moodAccentStyles[m.label].bg
                    : "var(--habita-card)",
                color:
                  mood?.label === m.label
                    ? moodAccentStyles[m.label].fg
                    : "var(--habita-text)",
                borderColor:
                  mood?.label === m.label
                    ? moodAccentStyles[m.label].fg
                    : "var(--habita-border)",
                fontSize: isCompact ? "0.95rem" : moodButton.fontSize,
                padding: isCompact ? "0.35rem 0.4rem" : moodButton.padding,
              }}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      )}
      {mood && (
        <div
          style={{
            ...selectedMoodWrapper,
            ...(isCompact ? compactSelectedMoodWrapper : {}),
            backgroundColor: moodAccentStyles[mood.label].bg,
            border: `1px solid ${moodAccentStyles[mood.label].fg}`,
            marginTop: isCompact ? "0.25rem" : selectedMoodWrapper.marginTop,
            padding: isCompact ? "0.5rem 0.6rem" : selectedMoodWrapper.padding,
          }}
          onDoubleClick={!isCompact && isLocked ? handleUnlock : undefined}
          title={
            !isCompact && isLocked ? "Double-click to change your mood" : undefined
          }
        >
          {isCompact ? (
            <div style={compactMoodRow}>
              <div style={compactMoodInfo}>
                <span
                  style={{
                    ...selectedMoodEmoji,
                    ...compactMoodEmoji,
                    color: moodAccentStyles[mood.label].fg,
                  }}
                >
                  {mood.emoji}
                </span>
                <div style={compactMoodTextGroup}>
                  <p style={compactMoodTitle}>
                    Feeling <strong>{mood.label}</strong>
                  </p>
                  {encouragement && (
                    <p style={compactEncouragement}>{encouragement.message}</p>
                  )}
                </div>
              </div>
              {isLocked && (
                <button
                  type="button"
                  style={compactChangeButton}
                  onClick={handleUnlock}
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                style={{
                  ...selectedMoodRow,
                  alignItems: selectedMoodRow.alignItems,
                }}
              >
                <span
                  style={{
                    ...selectedMoodEmoji,
                    color: moodAccentStyles[mood.label].fg,
                  }}
                >
                  {mood.emoji}
                </span>
                <div>
                  <p
                    style={{
                      ...textStyle,
                      textAlign: encouragement?.centered ? "center" : "left",
                    }}
                  >
                    You’re feeling <strong>{mood.label}</strong>{" "}
                    {mood.label === "Happy" ? "today!" : "today."}
                  </p>
                  {encouragement && (
                    <p
                      style={{
                        ...encouragementText,
                        textAlign: encouragement.centered ? "center" : "left",
                      }}
                    >
                      {encouragement.message}
                    </p>
                  )}
                </div>
              </div>
              {isLocked && (
                <button
                  type="button"
                  style={changeMoodButtonStyle}
                  onClick={handleUnlock}
                >
                  Change mood
                </button>
              )}
            </>
          )}
        </div>
      )}
      {hasHistory && (
        <>
          {isCompact && (
            <button
              type="button"
              onClick={() => setShowSnapshot((prev) => !prev)}
              style={toggleStatsButtonStyle}
            >
              {showSnapshot ? "Hide house vibes" : "Show house vibes"}
            </button>
          )}
          {(!isCompact || showSnapshot) && (
            <>
              <div style={timelineCardStyle}>
                <div style={timelineHeaderStyle}>
                  <p style={statsTitle}>House vibe (7 days)</p>
                  <span style={timelineHintStyle}>Dominant mood per day</span>
                </div>
                <div style={timelineStripStyle}>
                  {timelineDays.map((day) => (
                    <div
                      key={day.iso}
                      style={{
                        ...timelineDayStyle,
                        border:
                          day.isToday && day.mood
                            ? "1px solid var(--habita-accent)"
                            : "1px solid rgba(255,255,255,0.08)",
                        opacity: day.mood ? 1 : 0.5,
                      }}
                    >
                      <span style={timelineDayLabelStyle}>{day.weekday}</span>
                      <span style={timelineEmojiStyle}>{day.mood?.emoji ?? "–"}</span>
                      <span style={timelineMoodLabelStyle}>
                        {day.mood?.label ?? "No log"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={houseFeedCardStyle}>
                <div style={houseFeedHeaderStyle}>
                  <p style={statsTitle}>Household check-ins</p>
                  <span style={houseFeedHintStyle}>Tap a sticker to react</span>
                </div>
                {householdFeed.length === 0 ? (
                  <p style={emptyFeedStyle}>No moods logged today.</p>
                ) : (
                  householdFeed.map((entry) => (
                    <div key={entry.id} style={houseFeedRowStyle}>
                      <div style={houseFeedInfoStyle}>
                        <span style={houseFeedNameStyle}>
                          {entry.emoji} {entry.userName}
                        </span>
                        <span style={houseFeedMetaStyle}>
                          {formatRelativeDay(entry.date)} • {formatTimeLabel(entry.timestamp)}
                        </span>
                      </div>
                      <div style={houseFeedMoodStyle}>{entry.label}</div>
                      <div style={reactionRowStyle}>
                        {reactionOptions.map((emoji) => {
                          const count = entry.reactions?.[emoji] || 0;
                          const reacted = reactionLedger[entry.id] === emoji;
                          const disabled = Boolean(reactionLedger[entry.id]);
                          return (
                            <button
                              key={`${entry.id}-${emoji}`}
                              type="button"
                              style={reactionButtonStyle(disabled, reacted)}
                              onClick={() => handleReaction(entry.id, emoji)}
                              disabled={disabled}
                            >
                              {emoji}
                              {count > 0 && <span style={reactionCountStyle}>{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                      {shouldShowCheckIn(entry) && (
                        <button
                          type="button"
                          style={checkInButtonStyle}
                          onClick={() => onCheckInRequest?.(entry)}
                        >
                          Check in with {entry.userName}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "0.85rem 1rem",
  textAlign: "center",
};

const titleStyle = {
  marginBottom: "0.8rem",
  color: "var(--habita-text)",
  fontSize: "1rem",
};

const moodContainer = {
  display: "flex",
  justifyContent: "center",
  gap: "0.45rem",
  marginBottom: "0.6rem",
  flexWrap: "wrap",
};

const moodButton = {
  border: "1px solid var(--habita-border)",
  borderRadius: "8px",
  padding: "0.5rem 0.65rem",
  fontSize: "1.2rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
  backgroundColor: "var(--habita-card)",
};

const textStyle = {
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
  margin: 0,
};

const selectedMoodWrapper = {
  borderRadius: "10px",
  padding: "0.7rem 0.85rem",
  marginTop: "0.4rem",
  cursor: "default",
};

const selectedMoodRow = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
};

const selectedMoodEmoji = {
  fontSize: "1.8rem",
};

const encouragementText = {
  margin: "0.35rem 0 0",
  fontSize: "0.82rem",
  color: "var(--habita-muted)",
};

const changeMoodButtonStyle = {
  marginTop: "0.6rem",
  background: "transparent",
  border: "none",
  color: "var(--habita-accent)",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "underline",
  alignSelf: "flex-start",
};

const statsTitle = {
  margin: "0 0 0.5rem 0",
  color: "var(--habita-text)",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const toggleStatsButtonStyle = {
  marginTop: "0.6rem",
  background: "transparent",
  border: "none",
  color: "var(--habita-accent)",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  padding: 0,
  textAlign: "left",
};

const timelineCardStyle = {
  marginTop: "0.8rem",
  paddingTop: "0.6rem",
  borderTop: "1px solid var(--habita-border)",
  textAlign: "left",
};

const timelineHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.5rem",
};

const timelineHintStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
};

const timelineStripStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "0.35rem",
  marginTop: "0.5rem",
};

const timelineDayStyle = {
  borderRadius: "10px",
  padding: "0.4rem 0.35rem",
  background: "rgba(255,255,255,0.04)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.2rem",
  minHeight: "72px",
};

const timelineDayLabelStyle = {
  fontSize: "0.65rem",
  color: "var(--habita-muted)",
};

const timelineEmojiStyle = {
  fontSize: "1.1rem",
};

const timelineMoodLabelStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-text)",
  textAlign: "center",
};

const houseFeedCardStyle = {
  marginTop: "0.8rem",
  paddingTop: "0.8rem",
  borderTop: "1px solid var(--habita-border)",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const houseFeedHeaderStyle = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
};

const houseFeedHintStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
};

const houseFeedRowStyle = {
  border: "1px solid rgba(74,144,226,0.2)",
  borderRadius: "12px",
  padding: "0.65rem 0.75rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.45rem",
};

const houseFeedInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.1rem",
};

const houseFeedNameStyle = {
  fontWeight: 600,
  color: "var(--habita-text)",
};

const houseFeedMetaStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
};

const houseFeedMoodStyle = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--habita-accent)",
};

const reactionRowStyle = {
  display: "flex",
  gap: "0.4rem",
};

const reactionButtonStyle = (disabled, reacted) => ({
  border: "1px solid rgba(255,255,255,0.15)",
  background: reacted ? "rgba(74,144,226,0.25)" : "transparent",
  color: "var(--habita-text)",
  borderRadius: "999px",
  padding: "0.2rem 0.6rem",
  fontSize: "0.85rem",
  cursor: disabled && !reacted ? "not-allowed" : "pointer",
  opacity: disabled && !reacted ? 0.4 : 1,
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
});

const reactionCountStyle = {
  fontSize: "0.75rem",
  fontWeight: 600,
};

const emptyFeedStyle = {
  margin: 0,
  fontSize: "0.82rem",
  color: "var(--habita-muted)",
};

const checkInButtonStyle = {
  alignSelf: "flex-start",
  border: "none",
  background: "rgba(246,135,97,0.15)",
  color: "#f68761",
  borderRadius: "999px",
  padding: "0.25rem 0.75rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
};

const compactSelectedMoodWrapper = {
  borderRadius: "12px",
};

const compactMoodRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const compactMoodInfo = {
  display: "flex",
  alignItems: "center",
  gap: "0.55rem",
  flex: 1,
};

const compactMoodEmoji = {
  fontSize: "1.4rem",
};

const compactMoodTextGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "0.15rem",
};

const compactMoodTitle = {
  margin: 0,
  fontSize: "0.85rem",
  color: "var(--habita-text)",
};

const compactEncouragement = {
  margin: 0,
  fontSize: "0.72rem",
  color: "var(--habita-muted)",
};

const compactChangeButton = {
  background: "transparent",
  border: "1px solid var(--habita-accent)",
  borderRadius: "999px",
  padding: "0.2rem 0.65rem",
  color: "var(--habita-accent)",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
};

const formatTimeLabel = (value) => {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const formatRelativeDay = (iso) => {
  if (!iso) return "";
  const today = new Date().toISOString().slice(0, 10);
  if (iso === today) return "Today";
  const dayMs = 24 * 60 * 60 * 1000;
  const diff =
    (new Date(today).setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / dayMs;
  if (diff === -1) return "Tomorrow";
  if (diff === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
};

function buildTimelineDays(history = []) {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    const entries = history.filter((entry) => entry.date === iso);
    const counts = entries.reduce((acc, entry) => {
      const key = entry.label;
      acc[key] = acc[key] || { count: 0, emoji: entry.emoji, label: entry.label };
      acc[key].count += 1;
      return acc;
    }, {});
    const dominant =
      Object.values(counts).sort((a, b) => b.count - a.count)[0] || null;
    days.push({
      iso,
      weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
      isToday: i === 0,
      mood: dominant,
    });
  }
  return days;
}

function loadMoodHistory() {
  if (typeof window === "undefined") {
    return seedMoodHistory();
  }
  try {
    const stored = window.localStorage.getItem(HISTORY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : seedMoodHistory();
    }
    return seedMoodHistory();
  } catch {
    return seedMoodHistory();
  }
}

function loadReactionLedger() {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(REACTIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function seedMoodHistory() {
  const history = [];
  const now = new Date();
  roommates.forEach((roommate, index) => {
    for (let offset = 0; offset < 3; offset += 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - (offset + index));
      const iso = day.toISOString().slice(0, 10);
      const moodSource = moods[(index + offset) % moods.length];
      history.push({
        id: `seed-${roommate.name}-${offset}`,
        userName: roommate.name,
        label: moodSource.label,
        emoji: moodSource.emoji,
        date: iso,
        timestamp: new Date(day.getTime() + (index + offset + 8) * 60 * 60 * 1000).toISOString(),
        reactions: {},
      });
    }
  });
  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
