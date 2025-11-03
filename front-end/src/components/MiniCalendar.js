import { useMemo } from "react";

export default function MiniCalendar({ monthDate = new Date(), eventsByISO = {}, onSelectDate, onExportICS }) {
  const { weeks, monthLabel } = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h4 style={titleStyle}>{monthLabel}</h4>
        <div style={actionsRowStyle}>
          <button type="button" style={linkButtonStyle} onClick={() => onExportICS?.("apple")}>Export .ics</button>
          <span style={{ color: "var(--habita-muted)" }}>·</span>
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
              aria-label={`${iso}${count > 0 ? `, ${count} items` : ""}`}
            >
              <span>{cell.day}</span>
              {count > 0 && <span style={badgeStyle}>{count}</span>}
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
  boxShadow: "var(--habita-shadow)",
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
  gap: "0.4rem",
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

const monthGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gridAutoRows: "28px",
  gap: "0.25rem",
  alignItems: "center",
};

const weekdayHeaderCellStyle = {
  fontSize: "0.68rem",
  color: "var(--habita-muted)",
  lineHeight: "28px",
  textAlign: "center",
};

const dayCellStyle = {
  position: "relative",
  background: "var(--habita-card)",
  border: "1px solid var(--habita-border)",
  borderRadius: "999px",
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--habita-text)",
  fontSize: "0.8rem",
  gap: "0.25rem",
  cursor: "pointer",
};

const outOfMonthStyle = {
  background: "var(--habita-chip)",
  color: "var(--habita-muted)",
};

const todayStyle = {
  outline: "none",
  borderColor: "var(--habita-accent)",
  boxShadow: "0 0 0 1.5px var(--habita-accent) inset",
};

const badgeStyle = {
  position: "absolute",
  bottom: "2px",
  right: "4px",
  fontSize: "0.65rem",
  background: "var(--habita-accent)",
  color: "white",
  borderRadius: "999px",
  padding: "0.05rem 0.3rem",
  lineHeight: 1,
};