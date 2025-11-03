import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MoodTracker from "../components/MoodTracker";
import MiniCalendar from "../components/MiniCalendar";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";

export default function Home() {
  const navigate = useNavigate();
  const { tasks, stats: taskStats } = useTasks();
  const { bills, stats: billStats } = useBills();

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayTimestamp = Date.parse(todayISO);

  const goToTasks = (state) => {
    if (state) {
      navigate("/tasks", { state });
    } else {
      navigate("/tasks");
    }
  };

  const goToBills = (state) => {
    if (state) {
      navigate("/bills", { state });
    } else {
      navigate("/bills");
    }
  };

  const upcomingTasks = useMemo(() => {
    const compareValue = (task) => {
      const parsed = Date.parse(task.due);
      return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    };
    return tasks
      .filter((task) => task.status !== "completed")
      .sort((a, b) => compareValue(a) - compareValue(b))
      .slice(0, 3);
  }, [tasks]);

  const unpaidBills = useMemo(
    () => bills.filter((bill) => bill.status === "unpaid"),
    [bills]
  );

  const eventsByISO = useMemo(() => {
    const map = {};
    const add = (iso, item) => {
      if (!iso) return;
      if (!map[iso]) map[iso] = [];
      map[iso].push(item);
    };
    tasks.forEach((t) => {
      if (typeof t?.due === "string") add(t.due.slice(0, 10), { type: "task", id: t.id, title: t.title });
    });
    bills.forEach((b) => {
      if (typeof b?.dueDate === "string") add(b.dueDate.slice(0, 10), { type: "bill", id: b.id, title: b.title });
    });
    return map;
  }, [tasks, bills]);

  const pendingCount = useMemo(
    () => tasks.filter((task) => task.status === "pending").length,
    [tasks]
  );

  const inProgressCount = useMemo(
    () => tasks.filter((task) => task.status === "in-progress").length,
    [tasks]
  );

  const dueTodayCount = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.status === "completed") return false;
        if (typeof task.due !== "string") return false;
        return task.due.slice(0, 10) === todayISO;
      }).length,
    [tasks, todayISO]
  );

  const overdueCount = useMemo(
    () =>
      tasks.filter((task) => {
        if (task.status === "completed") return false;
        const parsed = Date.parse(task.due);
        if (Number.isNaN(parsed)) return false;
        return parsed < todayTimestamp;
      }).length,
    [tasks, todayTimestamp]
  );

  const topUnpaidBills = useMemo(() => unpaidBills.slice(0, 2), [unpaidBills]);

  const dueSoonBillCount = useMemo(() => {
    const sevenDaysOut = todayTimestamp + 7 * 24 * 60 * 60 * 1000;
    return unpaidBills.filter((bill) => {
      const parsed = Date.parse(bill.dueDate);
      if (Number.isNaN(parsed)) return false;
      return parsed >= todayTimestamp && parsed <= sevenDaysOut;
    }).length;
  }, [unpaidBills, todayTimestamp]);

  const myShareDue = useMemo(
    () =>
      unpaidBills.reduce((sum, bill) => {
        if (!Array.isArray(bill.splitBetween) || bill.splitBetween.length === 0) {
          return sum + bill.amount;
        }
        const share = bill.amount / bill.splitBetween.length;
        return bill.splitBetween.includes("You") ? sum + share : sum;
      }, 0),
    [unpaidBills]
  );

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
          <MoodTracker variant="compact" />
        </section>

        <section style={summaryGridStyle}>
          <div style={{ ...cardStyle }}>
            <MiniCalendar
              eventsByISO={eventsByISO}
              onSelectDate={(iso) => {
                // Navigate to tasks filtered to the selected date
                navigate("/tasks", { state: { date: iso } });
              }}
              onExportICS={(target) => handleExportICS(target)}
            />
          </div>
          <div style={{ ...cardStyle, gap: "1rem" }}>
            <div style={cardHeaderRowStyle}>
              <h3 style={titleStyle}>Tasks</h3>
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
                value: taskStats.completed,
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

          <div style={{ ...cardStyle, gap: "1rem" }}>
            <div style={cardHeaderRowStyle}>
              <h3 style={titleStyle}>Bills</h3>
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
                value: billStats.unpaid,
                onClick: () => goToBills({ filter: "unpaid" }),
              },
              {
                label: "Paid",
                value: billStats.paid,
                onClick: () => goToBills({ filter: "paid" }),
              },
            ])}
            {billStats.unpaid > 0 ? (
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
                  {billStats.unpaid > topUnpaidBills.length && (
                    <span style={billMetaStyle}>
                      + {billStats.unpaid - topUnpaidBills.length} more waiting
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p style={textStyle}>All bills are settled.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function handleExportICS(target) {
  const fileName = "habita-events.ics";
  const icsContent = generateICSFromStorage();
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

function generateICSFromStorage() {
  // Create ICS VCALENDAR with VEVENTS for tasks and bills
  const pad = (n) => String(n).padStart(2, "0");
  const toICSDate = (iso) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}${m}${day}`;
  };
  let tasks = [];
  let bills = [];
  try {
    const t = window.localStorage.getItem("habita:tasks");
    const b = window.localStorage.getItem("habita:bills");
    tasks = t ? JSON.parse(t) : [];
    bills = b ? JSON.parse(b) : [];
  } catch {
    // ignore
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
  backgroundColor: "rgba(74,144,226,0.08)",
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
  background: "rgba(74,144,226,0.12)",
  border: "1px solid rgba(74,144,226,0.2)",
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

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "1.25rem",
  alignItems: "start",
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
