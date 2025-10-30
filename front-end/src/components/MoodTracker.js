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
  Happy: { message: "Keep spreading the good vibes! 💫", centered: true },
  Neutral: {
    message: "Steady pace today—take a mindful moment for yourself.",
    centered: false,
  },
  Sad: {
    message: "It's okay to feel low. Reach out to a roommate if you need support.",
    centered: false,
  },
  Frustrated: {
    message: "Deep breath—you've got this. Maybe share a chore to lighten the load.",
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
export default function MoodTracker({ variant = "default" }) {
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

  const showStats = Boolean(mood);
  const totalCount = Object.values(moodCounts).reduce(
    (sum, value) => sum + value,
    0
  );
  const orderedMoods = [...moods].reverse();
  const emojiSequence = orderedMoods.flatMap((m) =>
    Array.from({ length: moodCounts[m.label] }, (_, index) => ({
      emoji: m.emoji,
      key: `${m.label}-${index}`,
    }))
  );
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

  const handleSelectMood = (selectedMood) => {
    setMood(selectedMood);
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
  };

  return (
    <div
      style={{
        ...cardStyle,
        padding: isCompact ? "0.75rem 0.85rem" : cardStyle.padding,
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
            marginBottom: isCompact ? "0.45rem" : moodContainer.marginBottom,
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
                fontSize: isCompact ? "1.05rem" : moodButton.fontSize,
                padding: isCompact ? "0.45rem 0.55rem" : moodButton.padding,
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
            backgroundColor: moodAccentStyles[mood.label].bg,
            border: `1px solid ${moodAccentStyles[mood.label].fg}`,
            marginTop: isCompact ? "0.3rem" : selectedMoodWrapper.marginTop,
            padding: isCompact ? "0.6rem 0.7rem" : selectedMoodWrapper.padding,
          }}
          onDoubleClick={isLocked ? handleUnlock : undefined}
          title={isLocked ? "Double-click to change your mood" : undefined}
        >
          <div
            style={{
              ...selectedMoodRow,
              alignItems: isCompact ? "flex-start" : selectedMoodRow.alignItems,
              gap: isCompact ? "0.5rem" : selectedMoodRow.gap,
            }}
          >
            <span
              style={{
                ...selectedMoodEmoji,
                color: moodAccentStyles[mood.label].fg,
                fontSize: isCompact ? "1.5rem" : selectedMoodEmoji.fontSize,
              }}
            >
              {mood.emoji}
            </span>
            <div>
              <p
                  style={{
                    ...textStyle,
                    textAlign: encouragement?.centered ? "center" : "left",
                    fontSize: isCompact ? "0.84rem" : textStyle.fontSize,
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
                    fontSize: isCompact ? "0.78rem" : encouragementText.fontSize,
                    margin: isCompact ? "0.25rem 0 0" : encouragementText.margin,
                  }}
                >
                  {encouragement.message}
                </p>
              )}
            </div>
          </div>
          {isLocked && (
            <p style={editHint}>Double-click to change your mood selection.</p>
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
              {emojiSequence.length > 0 && (
                <div style={emojiBarWrapper}>
                  <div style={emojiBarRow}>
                    {emojiSequence.map((item) => (
                      <span key={item.key} style={emojiIcon}>
                        {item.emoji}
                      </span>
                    ))}
                  </div>
                  <p style={emojiBarHint}>One emoji per person today.</p>
                </div>
              )}
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
  boxShadow: "var(--habita-shadow)",
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

const editHint = {
  margin: "0.5rem 0 0",
  fontSize: "0.72rem",
  color: "var(--habita-muted)",
  fontStyle: "italic",
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

const emojiBarWrapper = {
  marginBottom: "0.7rem",
};

const emojiBarRow = {
  display: "flex",
  gap: "0.35rem",
  flexWrap: "wrap",
  justifyContent: "center",
};

const emojiIcon = {
  fontSize: "1.2rem",
};

const emojiBarHint = {
  marginTop: "0.3rem",
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
  textAlign: "center",
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
