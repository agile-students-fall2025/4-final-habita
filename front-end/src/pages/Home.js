import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoodTracker from "../components/MoodTracker";
import MiniCalendar from "../components/MiniCalendar";
import { useUser } from "../context/UserContext";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const goToTasks = (state = {}) => {
    navigate("/tasks", { state: { mineOnly: true, ...state } });
  };

  const goToBills = (state = {}) => {
    navigate("/bills", { state: { mineOnly: true, ...state } });
  };

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

  const userName = summary?.user || user?.name || "roomie";

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
        <div style={homeHeaderStyle}>
          <div>
            <h2 style={homeTitleStyle}>Home</h2>
            <p style={homeSubtitleStyle}>
              {loading
                ? "Syncing your dashboard…"
                : error
                ? error
                : `Welcome back, ${userName}!`}
            </p>
          </div>
        </div>

        <section style={singleCardSectionStyle}>
          <MoodTracker variant="compact" />
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
                <div style={singleListItemStyle}>
                  <div style={singleListTitleStyle}>{nextTask.title}</div>
                  <div style={singleListMetaStyle}>
                    {formatDueLabel(nextTask.due)} •{" "}
                    {nextTask.assignee || "You"}
                  </div>
                </div>
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
              },
            ])}
            {nextBill ? (
              <>
                <div style={cardDividerStyle} />
                <div>
                  <p style={cardSubheadingStyle}>Next bill</p>
                  <div style={singleListItemStyle}>
                    <div style={singleListTitleStyle}>{nextBill.title}</div>
                    <div style={singleListMetaStyle}>
                      {formatDueLabel(nextBill.dueDate)} • $
                      {calculateShare(nextBill).toFixed(2)}
                    </div>
                  </div>
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
            eventsByISO={eventsByISO}
            onSelectDate={(iso) =>
              goToTasks({ dueFilter: { type: "date", value: iso }, date: iso })
            }
            onExportICS={(target) => handleExportICS(target, summary)}
            onMonthChange={(direction) => {
              setCalendarDate((prev) => {
                const next = new Date(prev);
                next.setMonth(prev.getMonth() + direction);
                return next;
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}

function handleExportICS(target, summary) {
  const fileName = "habita-events.ics";
  const tasks = summary?.tasks?.items ?? [];
  const bills = summary?.bills?.items ?? [];
  const icsContent = generateICS(tasks, bills);
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

function generateICS(tasksData = [], billsData = []) {
  // Create ICS VCALENDAR with VEVENTS for tasks and bills
  const pad = (n) => String(n).padStart(2, "0");
  const toICSDate = (iso) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}${m}${day}`;
  };
  let tasks = tasksData;
  let bills = billsData;
  if ((!tasks || tasks.length === 0) && (!bills || bills.length === 0)) {
    try {
      const t = window.localStorage.getItem("habita:tasks");
      const b = window.localStorage.getItem("habita:bills");
      tasks = t ? JSON.parse(t) : [];
      bills = b ? JSON.parse(b) : [];
    } catch {
      tasks = [];
      bills = [];
    }
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

const homeHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.5rem 0",
  gap: "1rem",
};

const homeTitleStyle = {
  margin: 0,
  fontSize: "1.4rem",
  fontWeight: 700,
  color: "var(--habita-text)",
};

const homeSubtitleStyle = {
  margin: "0.15rem 0 0",
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
};

const homeSecondarySubtitleStyle = {
  margin: "0.15rem 0 0",
  fontSize: "0.85rem",
  color: "var(--habita-text)",
  fontWeight: 600,
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

const formatDueLabel = (value) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return new Date(parsed).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const singleListItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.1rem",
  padding: "0.5rem 0.65rem",
  borderRadius: "10px",
  backgroundColor: "rgba(74,144,226,0.08)",
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
