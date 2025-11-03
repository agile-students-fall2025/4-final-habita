import { useMemo } from "react";

export default function MiniCalendar({ monthDate = new Date(), eventsByISO = {}, onSelectDate, onExportICS }) {
  const { weeks, monthLabel } = useMemo(() => buildMonthGrid(monthDate), [monthDate]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h4 style={titleStyle}>{monthLabel}</h4>
        <div style={actionsRowStyle}>
          <button type="button" style={linkButtonStyle} onClick={() => onExportICS?.("apple")}>
            Export .ics
          </button>
          <span style={{ color: "var(--habita-muted)" }}>·</span>
          <button type="button" style={linkButtonStyle} onClick={() => onExportICS?.("google")}>
            Add to Google
          </button>
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
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = focusShadow)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
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
