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
export default function MoodTracker() {
  const [mood, setMood] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

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
      if (existingMood) {
        setMood(existingMood);
        setIsLocked(true);
      }
    } catch (error) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const handleSelectMood = (selectedMood) => {
    setMood(selectedMood);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ label: selectedMood.label })
      );
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>Your Mood Today</h3>
      {!isLocked && (
        <div style={moodContainer}>
          {moods.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => handleSelectMood(m)}
              style={{
                ...moodButton,
                backgroundColor: mood?.label === m.label ? "#4A90E2" : "white",
                color: mood?.label === m.label ? "white" : "black",
              }}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      )}
      {mood && (
        <div
          style={selectedMoodWrapper}
          onDoubleClick={isLocked ? handleUnlock : undefined}
          title={isLocked ? "Double-click to change your mood" : undefined}
        >
          <div style={selectedMoodRow}>
            <span style={selectedMoodEmoji}>{mood.emoji}</span>
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
            <p style={editHint}>Double-click to change your mood selection.</p>
          )}
        </div>
      )}
      {showStats && (
        <div style={statsWrapper}>
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
    </div>
  );
}

const cardStyle = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  padding: "0.85rem 1rem",
  textAlign: "center",
};

const titleStyle = {
  marginBottom: "0.8rem",
  color: "#333",
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
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "0.5rem 0.65rem",
  fontSize: "1.2rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
  backgroundColor: "white",
};

const textStyle = {
  fontSize: "0.9rem",
  color: "#555",
  margin: 0,
};

const selectedMoodWrapper = {
  backgroundColor: "rgba(74, 144, 226, 0.08)",
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
  color: "#4A4A4A",
};

const editHint = {
  margin: "0.5rem 0 0",
  fontSize: "0.72rem",
  color: "#888",
  fontStyle: "italic",
};

const statsWrapper = {
  marginTop: "0.8rem",
  textAlign: "left",
  borderTop: "1px solid rgba(0,0,0,0.05)",
  paddingTop: "0.8rem",
};


const statsTitle = {
  margin: "0 0 0.5rem 0",
  color: "#444",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const statsHint = {
  marginTop: "0.6rem",
  fontSize: "0.72rem",
  color: "#888",
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
  color: "#777",
  textAlign: "center",
};

const barRow = {
  marginBottom: "0.65rem",
};

const barHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.78rem",
  color: "#555",
  marginBottom: "0.25rem",
};

const barMeta = {
  fontWeight: 600,
  color: "#333",
};

const barOuter = {
  width: "100%",
  height: "8px",
  borderRadius: "999px",
  backgroundColor: "rgba(0,0,0,0.08)",
  overflow: "hidden",
};

const barInner = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 0.25s ease",
};
