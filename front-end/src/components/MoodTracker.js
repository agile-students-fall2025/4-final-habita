import { useEffect, useState } from "react";

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
const moodColors = {
  Happy: "#4A90E2",
  Neutral: "#9B9B9B",
  Sad: "#F5A623",
  Frustrated: "#D0021B",
};
const moodAccentStyles = {
  Happy: { bg: "rgba(74,144,226,0.2)", fg: "#0f4da8" },
  Neutral: { bg: "rgba(155,155,155,0.2)", fg: "#4f4f4f" },
  Sad: { bg: "rgba(245,166,35,0.25)", fg: "#a87012" },
  Frustrated: { bg: "rgba(208,2,27,0.22)", fg: "#a30012" },
};
export default function MoodTracker({ variant = "default", onMoodChange }) {
  const isCompact = variant === "compact";
  const [mood, setMood] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(!isCompact);

  const todayKey = new Date().toISOString().slice(0, 10);

  const moodCounts = moods.reduce((acc, m) => {
    acc[m.label] = 0;
    return acc;
  }, {});

  roommates.forEach(({ mood: roommateMood }) => {
    moodCounts[roommateMood] += 1;
  });

  if (mood) {
    moodCounts[mood.label] += 1;
  }

  const showStats = Boolean(mood) && !isCompact;
  const totalCount = Object.values(moodCounts).reduce(
    (sum, value) => sum + value,
    0
  );
  const orderedMoods = [...moods].reverse();
  const encouragement = mood ? encouragements[mood.label] : null;

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

  const handleSelectMood = (selectedMood) => {
    setMood(selectedMood);
    setIsLocked(true);
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
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    if (typeof onMoodChange === "function") {
      onMoodChange(null);
    }
  };

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
      {showStats && (
        <>
          {isCompact && (
            <button
              type="button"
              onClick={() => setShowSnapshot((prev) => !prev)}
              style={toggleStatsButtonStyle}
            >
              {showSnapshot ? "Hide household snapshot" : "View household snapshot"}
            </button>
          )}
          {showSnapshot && (
            <div
              style={{
                ...statsWrapper,
                marginTop: isCompact ? "0.6rem" : statsWrapper.marginTop,
                paddingTop: isCompact ? "0.6rem" : statsWrapper.paddingTop,
              }}
            >
              <p style={statsTitle}>Household mood snapshot</p>
              {orderedMoods.map((m) => {
                const count = moodCounts[m.label];
                const percent = totalCount
                  ? Math.round((count / totalCount) * 100)
                  : 0;
                const label = count === 1 ? "person" : "people";
                const width =
                  percent === 0 && count > 0 ? 12 : Math.max(percent, 0);

                return (
                  <div key={m.label} style={barRow}>
                    <div style={barHeader}>
                      <span>
                        {m.emoji} {m.label}
                      </span>
                      <span style={barMeta}>
                        {count} {label} • {percent}%
                      </span>
                    </div>
                    <div style={barOuter}>
                      <div
                        style={{
                          ...barInner,
                          width: `${width}%`,
                          backgroundColor: moodColors[m.label],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <p style={statsHint}>Includes your latest update.</p>
            </div>
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

const statsWrapper = {
  marginTop: "0.8rem",
  textAlign: "left",
  borderTop: "1px solid var(--habita-border)",
  paddingTop: "0.8rem",
};


const statsTitle = {
  margin: "0 0 0.5rem 0",
  color: "var(--habita-text)",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const statsHint = {
  marginTop: "0.6rem",
  fontSize: "0.72rem",
  color: "var(--habita-muted)",
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

const barRow = {
  marginBottom: "0.65rem",
};

const barHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.78rem",
  color: "var(--habita-muted)",
  marginBottom: "0.25rem",
};

const barMeta = {
  fontWeight: 600,
  color: "var(--habita-text)",
};

const barOuter = {
  width: "100%",
  height: "8px",
  borderRadius: "999px",
  backgroundColor: "var(--habita-border)",
  overflow: "hidden",
};

const barInner = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 0.25s ease",
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
