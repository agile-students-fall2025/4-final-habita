import { useMemo } from "react";

export default function MiniCalendar({
  monthDate = new Date(),
  eventsByISO = {},
  moodEntriesByISO = {},
  onSelectDate,
  onExportICS,
  onMonthChange,
  titlePrefix,
  indicatorMode = "count",
}) {
  const { weeks, monthLabel } = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          {titlePrefix && <div style={titlePrefixStyle}>{titlePrefix}</div>}
          <h4 style={titleStyle}>{monthLabel}</h4>
        </div>
        <div style={actionsRowStyle}>
          <button
            type="button"
            style={navButtonStyle}
            onClick={() => onMonthChange?.(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => onExportICS?.("apple")}
          >
            Export .ics
          </button>
          <span style={headerSeparatorStyle} />
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => onExportICS?.("google")}
          >
            Add to Google
          </button>
          <button
            type="button"
            style={navButtonStyle}
            onClick={() => onMonthChange?.(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div style={monthGridStyle}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={weekdayHeaderCellStyle}>{d}</div>
        ))}
        {weeks.flat().map((cell) => {
          const iso = cell.iso;
          const events = eventsByISO[iso] || [];
          const typeCounts = indicatorMode === "types" ? bucketEventsByType(events) : null;
          const indicatorSegments =
            indicatorMode === "types" && typeCounts ? buildIndicatorSegments(typeCounts) : null;
          const moodSwatches = getMoodSwatches(moodEntriesByISO[iso]);
          const isToday = iso === new Date().toISOString().slice(0, 10);
          const hasEvents = events.length > 0;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate?.(iso)}
              style={{
                ...dayCellStyle,
                ...(cell.inMonth ? {} : outOfMonthStyle),
                ...(isToday ? todayStyle : {}),
              }}
              aria-label={`${iso}${hasEvents ? `, ${events.length} items` : ""}`}
            >
              <span style={dayNumberStyle}>{cell.day}</span>
              {indicatorMode === "types" ? (
                <div style={indicatorRowStyle}>
                  {hasEvents ? (
                    indicatorSegments && indicatorSegments.length > 0 ? (
                      indicatorSegments.map((segment, index) => (
                        <span
                          key={`${iso}-segment-${index}`}
                          style={{
                            ...indicatorSegmentStyle,
                            width: segment.width,
                            background: segment.color,
                          }}
                        />
                      ))
                    ) : (
                      <span style={indicatorPlaceholderStyle} />
                    )
                  ) : (
                    <span style={indicatorPlaceholderStyle} />
                  )}
                </div>
              ) : hasEvents ? (
                <span style={countBadgeStyle}>{events.length}</span>
              ) : (
                <span style={eventPlaceholderStyle} />
              )}
              <div style={moodDotRowStyle}>
                {moodSwatches.length === 0 ? (
                  <span style={moodDotPlaceholderStyle} />
                ) : (
                  moodSwatches.map((color, index) => (
                    <span
                      key={`${iso}-mood-${index}`}
                      style={{ ...moodDotStyle, backgroundColor: color }}
                    />
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const moodDotColors = {
  Happy: "#F5A623",
  Neutral: "#9B9B9B",
  Sad: "#4A90E2",
  Frustrated: "#D0021B",
};
const MAX_MOOD_SWATCHES = 3;

function buildMonthGrid(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - last.getDay()));

  const cells = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const inMonth = cursor.getMonth() === month;
    const iso = toISO(cursor);
    cells.push({ iso, day: cursor.getDate(), inMonth });
    cursor.setDate(cursor.getDate() + 1);
  }
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
  return { weeks, monthLabel };
}

function toISO(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bucketEventsByType(events = []) {
  return events.reduce(
    (acc, event) => {
      if (event?.type === "task") acc.tasks += 1;
      else if (event?.type === "bill") acc.bills += 1;
      else acc.reminders += 1;
      return acc;
    },
    { tasks: 0, bills: 0, reminders: 0 }
  );
}

function buildIndicatorSegments(counts = { tasks: 0, bills: 0, reminders: 0 }) {
  const total = counts.tasks + counts.bills + counts.reminders;
  if (total === 0) return [];

  const entries = [
    { key: "tasks", color: taskIndicatorColor },
    { key: "bills", color: billIndicatorColor },
    { key: "reminders", color: reminderIndicatorColor },
  ].filter((entry) => counts[entry.key] > 0);

  if (entries.length === 0) return [];

  let segments = entries.map((entry) => ({
    color: entry.color,
    width: Math.max(
      INDICATOR_MIN_WIDTH,
      (counts[entry.key] / total) * INDICATOR_TOTAL_WIDTH
    ),
  }));

  let currentWidth = segments.reduce((sum, segment) => sum + segment.width, 0);
  const difference = INDICATOR_TOTAL_WIDTH - currentWidth;
  if (Math.abs(difference) > 0.5) {
    const adjustIndex = segments.reduce(
      (bestIndex, segment, index) =>
        segment.width > segments[bestIndex].width ? index : bestIndex,
      0
    );
    segments[adjustIndex].width = Math.max(
      INDICATOR_MIN_WIDTH,
      segments[adjustIndex].width + difference
    );
  }

  return segments.map((segment) => ({
    color: segment.color,
    width: `${Math.max(INDICATOR_MIN_WIDTH, segment.width).toFixed(0)}px`,
  }));
}

function getMoodSwatches(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) return [];
  const seen = new Set();
  const colors = [];
  entries.forEach((entry) => {
    if (!entry?.label || seen.has(entry.label) || colors.length >= MAX_MOOD_SWATCHES) {
      return;
    }
    seen.add(entry.label);
    colors.push(moodDotColors[entry.label] || "var(--habita-border)");
  });
  return colors;
}

const containerStyle = {
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "1rem 1.2rem",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "0.5rem",
};

const titleStyle = {
  margin: 0,
  fontSize: "0.95rem",
  color: "var(--habita-text)",
};

const titlePrefixStyle = {
  margin: 0,
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const actionsRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
};

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "var(--habita-accent)",
  fontSize: "0.8rem",
  fontWeight: 600,
  padding: 0,
  cursor: "pointer",
};

const headerSeparatorStyle = {
  width: "1px",
  height: "14px",
  backgroundColor: "var(--habita-border)",
};

const navButtonStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "50%",
  width: "24px",
  height: "24px",
  background: "transparent",
  color: "var(--habita-text)",
  cursor: "pointer",
  fontSize: "0.85rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const monthGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gridAutoRows: "42px",
  gap: "0.3rem",
  alignItems: "center",
};

const moodDotRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "0.15rem",
  marginTop: "0.15rem",
  minHeight: "6px",
};

const moodDotStyle = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  display: "inline-flex",
};

const moodDotPlaceholderStyle = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  background: "transparent",
};

const weekdayHeaderCellStyle = {
  fontSize: "0.68rem",
  color: "var(--habita-muted)",
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const dayCellStyle = {
  position: "relative",
  background: "transparent",
  border: "none",
  borderRadius: "10px",
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.15rem",
  color: "var(--habita-text)",
  fontSize: "0.8rem",
  cursor: "pointer",
  transition: "background-color 0.2s ease, color 0.2s ease",
};

const outOfMonthStyle = {
  color: "var(--habita-muted)",
  opacity: 0.6,
};

const todayStyle = {
  backgroundColor: "rgba(74, 144, 226, 0.14)",
  color: "var(--habita-accent)",
};

const dayNumberStyle = {
  lineHeight: 1,
  fontWeight: 600,
};

const indicatorRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.15rem",
  minHeight: "6px",
};

const indicatorSegmentStyle = {
  height: "4px",
  borderRadius: "999px",
  display: "inline-block",
};

const indicatorPlaceholderStyle = {
  width: "20px",
  height: "4px",
  borderRadius: "999px",
  background: "rgba(107, 114, 128, 0.2)",
};

const taskIndicatorColor = "#3f9da5";
const billIndicatorColor = "#4a90e2";
const reminderIndicatorColor = "#9b9b9b";
const INDICATOR_TOTAL_WIDTH = 20;
const INDICATOR_MIN_WIDTH = 6;

const eventPlaceholderStyle = {
  width: "6px",
  height: "6px",
};

const countBadgeStyle = {
  minWidth: "14px",
  padding: "0 4px",
  height: "14px",
  borderRadius: "999px",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  fontSize: "0.65rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};
