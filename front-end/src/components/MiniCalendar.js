import { useMemo } from "react";

export default function MiniCalendar({ monthDate = new Date(), eventsByISO = {}, onSelectDate, onExportICS }) {
  const { weeks, monthLabel } = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h4 style={titleStyle}>{monthLabel}</h4>
        <div style={actionsRowStyle}>
          <button type="button" style={linkButtonStyle} onClick={() => onExportICS?.("apple")}>Export .ics</button>
          <span style={headerSeparatorStyle} />
          <button type="button" style={linkButtonStyle} onClick={() => onExportICS?.("google")}>Add to Google</button>
        </div>
      </div>

      <div style={monthGridStyle}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={weekdayHeaderCellStyle}>{d}</div>
        ))}
        {weeks.flat().map((cell) => {
          const iso = cell.iso;
          const count = eventsByISO[iso]?.length || 0;
          const isToday = iso === new Date().toISOString().slice(0, 10);
          const hasEvents = count > 0;
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
              aria-label={`${iso}${hasEvents ? `, ${count} items` : ""}`}
            >
              <span style={dayNumberStyle}>{cell.day}</span>
              {hasEvents ? (
                <span style={countBadgeStyle}>{count}</span>
              ) : (
                <span style={eventPlaceholderStyle} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

const monthGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gridAutoRows: "42px",
  gap: "0.3rem",
  alignItems: "center",
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
  gap: "0.2rem",
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

const eventPlaceholderStyle = {
  width: "5px",
  height: "5px",
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
