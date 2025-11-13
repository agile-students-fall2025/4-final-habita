import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoodTracker from "../components/MoodTracker";
import MiniCalendar from "../components/MiniCalendar";

export default function Home() {
  const navigate = useNavigate();
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

  const userName = summary?.user && summary.user !== "You" ? summary.user : "roomie";
  const headerTitle = useMemo(() => {
    if (loading) return "Syncing your dashboard…";
    if (error) return "Home";
    return `Welcome back, ${userName}!`;
  }, [loading, error, userName]);

  const headerMessage = useMemo(() => {
    if (loading) return "Fetching your personal snapshot…";
    if (error) return error;
    return "Your personal snapshot";
  }, [loading, error]);

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
            <h2 style={homeTitleStyle}>{headerTitle}</h2>
            <p style={homeSubtitleStyle}>{headerMessage}</p>
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
                hint: "Tasks scheduled for today",
                onClick: () => goToTasks({ dueFilter: "due-today" }),
              },
              {
                label: "Overdue",
                value: overdueCount,
                hint: "Past-due tasks",
                onClick: () => goToTasks({ dueFilter: "overdue" }),
              },
              {
                label: "Pending",
                value: pendingCount,
                onClick: () => goToTasks({ filter: "pending" }),
              },
              {
                label: "In progress",
                value: inProgressCount,
                onClick: () => goToTasks({ filter: "in-progress" }),
              },
              {
                label: "Completed",
                value: myCompletedCount,
                onClick: () => goToTasks({ filter: "completed" }),
              },
            ])}
            <div style={cardDividerStyle} />
            <div>
              <p style={cardSubheadingStyle}>Upcoming</p>
              {upcomingTasks.length === 0 ? (
                <p style={textStyle}>Everything is wrapped up.</p>
              ) : (
                <ul style={taskListStyle}>
                  {upcomingTasks.map((task) => (
                    <li key={task.id} style={taskListItemStyle}>
                      <span>{task.title}</span>
                      <span style={taskListMetaStyle}>
                        {formatDueLabel(task.due)}
                      </span>
                    </li>
                  ))}
                </ul>
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
              {
                label: "Unpaid",
                value: myBillStats.unpaid,
                onClick: () => goToBills({ filter: "unpaid", mine: true }),
              },
              {
                label: "Paid",
                value: myBillStats.paid,
                onClick: () => goToBills({ filter: "paid", mine: true }),
              },
            ])}
            {outstandingBills.length > 0 ? (
              <>
                <div style={cardDividerStyle} />
                <div>
                  <p style={cardSubheadingStyle}>Coming due</p>
                  <ul style={billListStyle}>
                    {topUnpaidBills.map((bill) => {
                      const share =
                        Array.isArray(bill.splitBetween) && bill.splitBetween.length
                          ? bill.amount / bill.splitBetween.length
                          : bill.amount;
                      return (
                        <li key={bill.id} style={billListItemStyle}>
                          <span>{bill.title}</span>
                          <span style={billMetaStyle}>
                            {formatDueLabel(bill.dueDate)} • ${share.toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {outstandingBills.length > topUnpaidBills.length && (
                    <span style={billMetaStyle}>
                      + {outstandingBills.length - topUnpaidBills.length} more waiting
                    </span>
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
  padding: "1rem 1.2rem",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
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
  gap: "0.75rem",
};

const statCardStyle = {
  background: "var(--habita-card)",
  border: "1px solid rgba(74,144,226,0.25)",
  borderRadius: "16px",
  padding: "0.7rem 0.8rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  minWidth: "120px",
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
  padding: "1.25rem",
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

const contentStyle = {
  maxWidth: "720px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const singleCardSectionStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1.25rem",
};

const cardsRowStyle = {
  display: "flex",
  gap: "1.25rem",
  flexWrap: "wrap",
  alignItems: "stretch",
};

const cardColumnStyle = {
  flex: "1 1 280px",
  minWidth: "260px",
};

const titleStyle = {
  margin: "0 0 0.3rem 0",
  fontSize: "1rem",
  color: "var(--habita-text)",
};

const textStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
};

const cardSubheadingStyle = {
  margin: "0 0 0.35rem 0",
  fontSize: "0.85rem",
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

const taskListStyle = {
  listStyle: "none",
  padding: 0,
  margin: "0.6rem 0 0",
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const taskListItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.85rem",
  color: "var(--habita-text)",
};

const taskListMetaStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
};

const billListStyle = {
  listStyle: "none",
  padding: 0,
  margin: "0.4rem 0 0",
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const billListItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.85rem",
  color: "var(--habita-text)",
};

const billMetaStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
};
