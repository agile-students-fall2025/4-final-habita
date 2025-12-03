import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoodTracker from "../components/MoodTracker";
import MiniCalendar from "../components/MiniCalendar";
import { useUser } from "../context/UserContext";
import { useTasks } from "../context/TasksContext";

const MOOD_HISTORY_STORAGE_KEY = "habita:mood-history";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { tasks } = useTasks();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [moodHistory, setMoodHistory] = useState([]);
  const [selectedMoodISO, setSelectedMoodISO] = useState(null);

  const goToTasks = useCallback(
    (state = {}) => {
      navigate("/tasks", { state: { mineOnly: true, ...state } });
    },
    [navigate]
  );

  const goToBills = useCallback(
    (state = {}) => {
      navigate("/bills", { state: { mineOnly: true, ...state } });
    },
    [navigate]
  );

  const handleMoodHistoryChange = useCallback((history) => {
    setMoodHistory(history || []);
  }, []);

  const handleCheckInRequest = useCallback(
    (entry) => {
      if (!entry?.userName) return;
      navigate("/chat", {
        state: {
          openThreadContext: {
            contextType: "direct",
            contextId: entry.userName,
            name: entry.userName,
            participants: ["You", entry.userName],
          },
        },
      });
    },
    [navigate]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/home/summary");
        if (!response.ok) {
          throw new Error("Failed to load home summary");
        }
        const payload = await response.json();
        if (!cancelled) {
          setSummary(payload.data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load data");
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const tasksSummary = summary?.tasks ?? {
    stats: { dueToday: 0, overdue: 0, pending: 0, inProgress: 0, completed: 0 },
    upcoming: [],
    items: [],
  };

  const billsSummary = summary?.bills ?? {
    stats: { dueSoon: 0, unpaid: 0, paid: 0 },
    comingDue: [],
    myShareDue: 0,
  };

  const eventsByISO = summary?.eventsByISO ?? {};
  const moodEntriesByISO = useMemo(() => {
    return moodHistory.reduce((acc, entry) => {
      if (!entry?.date) return acc;
      if (!acc[entry.date]) acc[entry.date] = [];
      acc[entry.date].push(entry);
      return acc;
    }, {});
  }, [moodHistory]);
  const combinedEventsByISO = useMemo(() => {
    const clone = Object.fromEntries(
      Object.entries(eventsByISO).map(([iso, items]) => [iso, [...items]])
    );
    Object.entries(moodEntriesByISO).forEach(([iso, entries]) => {
      const moodEvents = entries.map((entry) => ({
        type: "mood",
        id: entry.id,
        title: `${entry.userName} (${entry.label})`,
      }));
      clone[iso] = [...(clone[iso] || []), ...moodEvents];
    });
    return clone;
  }, [eventsByISO, moodEntriesByISO]);
  const selectedMoodEntries = selectedMoodISO ? moodEntriesByISO[selectedMoodISO] || [] : [];

  const handleCalendarSelect = useCallback((iso) => {
    setSelectedMoodISO(iso);
  }, []);

  const dueTodayCount = tasksSummary.stats?.dueToday ?? 0;
  const overdueCount = tasksSummary.stats?.overdue ?? 0;
  const pendingCount = tasksSummary.stats?.pending ?? 0;
  const inProgressCount = tasksSummary.stats?.inProgress ?? 0;
  const myCompletedCount = tasksSummary.stats?.completed ?? 0;
  const upcomingTasks = tasksSummary.upcoming ?? [];

  const dueSoonBillCount = billsSummary.stats?.dueSoon ?? 0;
  const topUnpaidBills = billsSummary.comingDue ?? [];
  const myShareDue = billsSummary.myShareDue ?? 0;
  const outstandingBills = billsSummary.outstanding ?? [];
  const myBillStats = {
    unpaid: billsSummary.stats?.unpaid ?? 0,
    paid: billsSummary.stats?.paid ?? 0,
  };
  const nextTask = upcomingTasks[0] ?? null;
  const nextBill = topUnpaidBills[0] ?? null;
  const remainingBills =
    outstandingBills.length > 0
      ? Math.max(outstandingBills.length - (nextBill ? 1 : 0), 0)
      : 0;

  const matchedLocalNextTask = useMemo(() => {
    if (!nextTask || !Array.isArray(tasks) || tasks.length === 0) {
      return null;
    }
    const normalize = (value) =>
      typeof value === "string" ? value.trim().toLowerCase() : "";
    const byId = tasks.find((task) => task.id === nextTask.id);
    if (byId) return byId;
    const titleKey = normalize(nextTask.title);
    if (titleKey) {
      const byTitle = tasks.find((task) => normalize(task.title) === titleKey);
      if (byTitle) return byTitle;
    }
    const nextIso =
      typeof nextTask?.due === "string" ? nextTask.due.slice(0, 10) : null;
    if (nextIso) {
      const byDate = tasks.find(
        (task) =>
          typeof task?.due === "string" && task.due.slice(0, 10) === nextIso
      );
      if (byDate) return byDate;
    }
    return null;
  }, [nextTask, tasks]);

  const handleNextTaskClick = useCallback(() => {
    if (!nextTask) return;
    const navState = {
      highlightTaskTitle: nextTask.title,
      highlightTaskDue: nextTask.due,
    };
    if (matchedLocalNextTask) {
      if (typeof matchedLocalNextTask.due === "string") {
        navState.dueFilter = {
          type: "date",
          value: matchedLocalNextTask.due.slice(0, 10),
        };
      }
      navState.openChatForTaskId = matchedLocalNextTask.id;
    }
    goToTasks(navState);
  }, [goToTasks, nextTask, matchedLocalNextTask]);

  const userName = summary?.user || user?.name || null;

  const renderStatCards = (items) => (
    <div style={statCardsWrapStyle}>
      {items.map(({ label, value, hint, onClick }) => {
        const clickable = typeof onClick === "function";
        if (clickable) {
          return (
            <button
              key={label}
              type="button"
              style={statCardStyle}
              onClick={onClick}
            >
              <span style={statCardLabelStyle}>{label}</span>
              <span style={statCardValueStyle}>{value}</span>
              {hint && <span style={statCardHintStyle}>{hint}</span>}
            </button>
          );
        }
        return (
          <div key={label} style={{ ...statCardStyle, cursor: "default" }}>
            <span style={statCardLabelStyle}>{label}</span>
            <span style={statCardValueStyle}>{value}</span>
            {hint && <span style={statCardHintStyle}>{hint}</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <section style={singleCardSectionStyle}>
          <MoodTracker
            variant="compact"
            onMoodHistoryChange={handleMoodHistoryChange}
            onCheckInRequest={handleCheckInRequest}
          />
        </section>

        <section style={cardsRowStyle}>
          <div style={{ ...cardStyle, ...cardColumnStyle, gap: "1rem" }}>
            <div style={cardHeaderRowStyle}>
              <h3 style={titleStyle}>My Tasks</h3>
              <div style={cardHeaderActionsStyle}>
                <button
                  type="button"
                  style={cardLinkButtonStyle}
                  onClick={() => goToTasks()}
                >
                  View
                </button>
                <button
                  type="button"
                  style={cardIconButtonStyle}
                  onClick={() => goToTasks({ openForm: true })}
                  aria-label="Add task"
                >
                  +
                </button>
              </div>
            </div>
            {renderStatCards([
              {
                label: "Due today",
                value: dueTodayCount,
                hint: "Today's focus",
                onClick: () => goToTasks({ dueFilter: "due-today" }),
              },
              {
                label: "Overdue",
                value: overdueCount,
                hint: "Needs attention",
                onClick: () => goToTasks({ dueFilter: "overdue" }),
              },
            ])}
            <div style={cardDividerStyle} />
            <div>
              <p style={cardSubheadingStyle}>Next task</p>
              {!nextTask ? (
                <p style={textStyle}>Everything is wrapped up.</p>
              ) : (
                <button
                  type="button"
                  style={singleListButtonStyle}
                  onClick={handleNextTaskClick}
                  aria-label={nextTask.title ? `Open task "${nextTask.title}"` : "View upcoming tasks"}
                >
                  <div style={singleListTitleStyle}>{nextTask.title}</div>
                  <div style={singleListMetaStyle}>
                    {formatDueLabel(nextTask.due)} •{" "}
                    {nextTask.assignee || "You"}
                  </div>
                </button>
              )}
              {pendingCount + inProgressCount + myCompletedCount > 0 && (
                <p style={miniMetaStyle}>
                  + {pendingCount + inProgressCount + myCompletedCount} more tasks
                  in your queue
                </p>
              )}
            </div>
          </div>

          <div style={{ ...cardStyle, ...cardColumnStyle, gap: "1rem" }}>
            <div style={cardHeaderRowStyle}>
              <h3 style={titleStyle}>My Bills</h3>
              <div style={cardHeaderActionsStyle}>
                <button
                  type="button"
                  style={cardLinkButtonStyle}
                  onClick={() => goToBills()}
                >
                  View
                </button>
                <button
                  type="button"
                  style={cardIconButtonStyle}
                  onClick={() => goToBills({ openForm: true })}
                  aria-label="Add bill"
                >
                  +
                </button>
              </div>
            </div>
            {renderStatCards([
              {
                label: "Due this week",
                value: dueSoonBillCount,
                hint: "Upcoming payments",
                onClick: () => goToBills({ dueFilter: "due-week" }),
              },
              {
                label: "Your share",
                value: `$${myShareDue.toFixed(2)}`,
                hint: "Outstanding split",
                onClick: () => goToBills({ filter: "unpaid" }),
              },
            ])}
            {nextBill ? (
              <>
                <div style={cardDividerStyle} />
                <div>
                  <p style={cardSubheadingStyle}>Next bill</p>
                  <button
                    type="button"
                    style={singleListButtonStyle}
                    onClick={() => {
                      const state = {
                        filter: nextBill?.status === "paid" ? "paid" : "unpaid",
                      };
                      if (nextBill?.id) {
                        state.openChatForBillId = nextBill.id;
                      }
                      goToBills(state);
                    }}
                    aria-label={nextBill.title ? `Open bill "${nextBill.title}"` : "View bills"}
                  >
                    <div style={singleListTitleStyle}>{nextBill.title}</div>
                    <div style={singleListMetaStyle}>
                      {formatDueLabel(nextBill.dueDate)} • $
                      {calculateShare(nextBill).toFixed(2)}
                    </div>
                  </button>
                  {(remainingBills > 0 || myBillStats.unpaid > 1) && (
                    <p style={miniMetaStyle}>
                      + {remainingBills || myBillStats.unpaid - 1} more bills waiting
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p style={textStyle}>All of your bills are settled.</p>
            )}
          </div>
        </section>

        <div style={{ ...cardStyle, marginTop: "1rem" }}>
          <MiniCalendar
            titlePrefix="Calendar"
            monthDate={calendarDate}
            eventsByISO={combinedEventsByISO}
            moodEntriesByISO={moodEntriesByISO}
            onSelectDate={handleCalendarSelect}
            onExportICS={(target) => handleExportICS(target, summary, moodHistory)}
            onMonthChange={(direction) => {
              setCalendarDate((prev) => {
                const next = new Date(prev);
                next.setMonth(prev.getMonth() + direction);
                return next;
              });
            }}
          />
        </div>
        {selectedMoodISO && (
          <div style={moodSheetStyle}>
            <div style={moodSheetHeaderStyle}>
              <div>
                <p style={moodSheetTitleStyle}>{formatFullDate(selectedMoodISO)}</p>
                <span style={moodSheetSubtitleStyle}>
                  {selectedMoodEntries.length > 0
                    ? `${selectedMoodEntries.length} mood ${
                        selectedMoodEntries.length === 1 ? "entry" : "entries"
                      }`
                    : "No mood logs yet"}
                </span>
              </div>
            </div>
            {selectedMoodEntries.length === 0 ? (
              <p style={textStyle}>No one has logged a mood for this day yet.</p>
            ) : (
              <ul style={moodSheetListStyle}>
                {selectedMoodEntries.map((entry) => (
                  <li key={entry.id} style={moodSheetListItemStyle}>
                    <div>
                      <p style={moodSheetPersonStyle}>
                        {entry.emoji} {entry.userName}
                      </p>
                      <span style={moodSheetMetaStyle}>
                        {entry.label} • {formatTimeOfDay(entry.timestamp)}
                      </span>
                    </div>
                    {(entry.label === "Sad" || entry.label === "Frustrated") && (
                      <button
                        type="button"
                        style={moodSheetCheckInButtonStyle}
                        onClick={() => handleCheckInRequest(entry)}
                      >
                        Check in
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div style={moodSheetActionsStyle}>
              <button
                type="button"
                style={moodSheetActionButtonStyle}
                onClick={() =>
                  selectedMoodISO &&
                  goToTasks({ dueFilter: { type: "date", value: selectedMoodISO }, date: selectedMoodISO })
                }
              >
                View tasks for this day
              </button>
              <button
                type="button"
                style={moodSheetGhostButtonStyle}
                onClick={() => setSelectedMoodISO(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function handleExportICS(target, summary, moods = []) {
  const fileName = "habita-events.ics";
  const tasks = summary?.tasks?.items ?? [];
  const bills = summary?.bills?.items ?? [];
  const icsContent = generateICS(tasks, bills, moods);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  if (target === "google") {
    // Google Calendar import supports uploading .ics; provide a helper open + download fallback
    window.open("https://calendar.google.com/calendar/u/0/r/settings/export", "_blank");
  }
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

function generateICS(tasksData = [], billsData = [], moodsData = []) {
  // Create ICS VCALENDAR with VEVENTS for tasks and bills
  const pad = (n) => String(n).padStart(2, "0");
  const toICSDate = (iso) => {
    const token = typeof iso === "string" ? iso.slice(0, 10) : "";
    return /^\d{4}-\d{2}-\d{2}$/.test(token) ? token.replace(/-/g, "") : "";
  };
  let tasks = tasksData;
  let bills = billsData;
  let moods = moodsData;
  if (
    (!tasks || tasks.length === 0) &&
    (!bills || bills.length === 0) &&
    (!moods || moods.length === 0)
  ) {
    try {
      if (typeof window !== "undefined") {
        const t = window.localStorage.getItem("habita:tasks");
        const b = window.localStorage.getItem("habita:bills");
        const m = window.localStorage.getItem(MOOD_HISTORY_STORAGE_KEY);
        tasks = t ? JSON.parse(t) : [];
        bills = b ? JSON.parse(b) : [];
        moods = m ? JSON.parse(m) : [];
      }
    } catch {
      tasks = [];
      bills = [];
      moods = [];
    }
    tasks = tasks || [];
    bills = bills || [];
    moods = moods || [];
  }
  const events = [];
  tasks.forEach((t) => {
    if (!t?.due) return;
    const uid = `task-${t.id || Math.random().toString(36).slice(2)}@habita`;
    const dt = toICSDate(t.due.slice(0, 10));
    events.push([
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${escapeICS(`Task: ${t.title}`)}`,
      "END:VEVENT",
    ].join("\r\n"));
  });
  bills.forEach((b) => {
    if (!b?.dueDate) return;
    const uid = `bill-${b.id || Math.random().toString(36).slice(2)}@habita`;
    const dt = toICSDate(b.dueDate.slice(0, 10));
    events.push([
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${escapeICS(`Bill: ${b.title}`)}`,
      "END:VEVENT",
    ].join("\r\n"));
  });
  moods.forEach((m) => {
    if (!m?.date) return;
    const uid = `mood-${m.id || Math.random().toString(36).slice(2)}@habita`;
    const dt = toICSDate(m.date);
    events.push(
      [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${dt}`,
        `DTEND;VALUE=DATE:${dt}`,
        `SUMMARY:${escapeICS(`Mood: ${m.userName} (${m.label})`)}`,
        "END:VEVENT",
      ].join("\r\n")
    );
  });
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Habita//Calendar//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
  return body;
}

function calculateShare(bill) {
  if (!bill) return 0;
  if (Array.isArray(bill.splitBetween) && bill.splitBetween.length) {
    return bill.amount / bill.splitBetween.length;
  }
  return bill.amount ?? 0;
}

function escapeICS(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

const cardStyle = {
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "0.85rem 1rem",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const cardHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "0.5rem",
};

const cardHeaderActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};


const cardLinkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "var(--habita-accent)",
  fontSize: "0.8rem",
  fontWeight: 600,
  padding: 0,
  cursor: "pointer",
};

const cardIconButtonStyle = {
  border: "none",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderRadius: "50%",
  width: "32px",
  height: "32px",
  fontSize: "1.2rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statCardsWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.6rem",
};

const statCardStyle = {
  background: "var(--habita-card)",
  border: "1px solid rgba(74,144,226,0.25)",
  borderRadius: "16px",
  padding: "0.55rem 0.65rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  minWidth: "110px",
  cursor: "pointer",
  alignItems: "flex-start",
};

const statCardLabelStyle = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--habita-muted)",
};

const statCardValueStyle = {
  fontSize: "0.95rem",
  color: "var(--habita-text)",
  fontWeight: 600,
};

const statCardHintStyle = {
  fontSize: "0.72rem",
  color: "var(--habita-muted)",
};

const cardDividerStyle = {
  width: "100%",
  height: "1px",
  backgroundColor: "var(--habita-border)",
};

const pageStyle = {
  padding: "1rem",
  backgroundColor: "var(--habita-bg)",
  minHeight: "100vh",
};

const contentStyle = {
  maxWidth: "680px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "1.2rem",
};

const singleCardSectionStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1.25rem",
};

const cardsRowStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "0.9rem",
  alignItems: "stretch",
};

const cardColumnStyle = {
  flex: "1 1 280px",
  minWidth: "260px",
};

const titleStyle = {
  margin: "0 0 0.15rem 0",
  fontSize: "0.95rem",
  color: "var(--habita-text)",
};

const textStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
};

const cardSubheadingStyle = {
  margin: "0 0 0.2rem 0",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const formatDueLabel = (iso) => {
  const token = typeof iso === "string" ? iso.slice(0, 10) : "";
  const m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso || "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatFullDate = (iso) => {
  const token = typeof iso === "string" ? iso.slice(0, 10) : "";
  const m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso || "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const formatTimeOfDay = (value) => {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const singleListItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.1rem",
  padding: "0.5rem 0.65rem",
  borderRadius: "10px",
  backgroundColor: "rgba(74,144,226,0.08)",
};

const singleListButtonStyle = {
  ...singleListItemStyle,
  border: "none",
  width: "100%",
  textAlign: "left",
  background: singleListItemStyle.backgroundColor,
  cursor: "pointer",
  font: "inherit",
};

const singleListTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const singleListMetaStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
};

const miniMetaStyle = {
  fontSize: "0.72rem",
  color: "var(--habita-muted)",
  marginTop: "0.3rem",
};

const moodSheetStyle = {
  background: "var(--habita-card)",
  border: "1px solid rgba(74,144,226,0.25)",
  borderRadius: "12px",
  padding: "1rem",
  marginTop: "0.75rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const moodSheetHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "0.5rem",
};

const moodSheetTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const moodSheetSubtitleStyle = {
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const moodSheetListStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const moodSheetListItemStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "10px",
  padding: "0.55rem 0.75rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
};

const moodSheetPersonStyle = {
  margin: 0,
  fontWeight: 600,
  color: "var(--habita-text)",
};

const moodSheetMetaStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
};

const moodSheetActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
};

const moodSheetActionButtonStyle = {
  border: "none",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderRadius: "999px",
  padding: "0.45rem 0.85rem",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};

const moodSheetGhostButtonStyle = {
  border: "1px solid var(--habita-border)",
  background: "transparent",
  color: "var(--habita-text)",
  borderRadius: "999px",
  padding: "0.45rem 0.85rem",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};

const moodSheetCheckInButtonStyle = {
  border: "none",
  background: "rgba(246,135,97,0.15)",
  color: "#f68761",
  borderRadius: "999px",
  padding: "0.25rem 0.6rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
};
