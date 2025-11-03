import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoodTracker from "../components/MoodTracker";
import MiniCalendar from "../components/MiniCalendar";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";

export default function Home() {
  const navigate = useNavigate();
  const { tasks, stats: taskStats } = useTasks();
  const { bills, stats: billStats } = useBills();

  const MOOD_EMOJI = useMemo(
    () => ({
      Happy: "😊",
      Neutral: "😐",
      Sad: "😢",
      Frustrated: "😤",
    }),
    []
  );

  const [currentMood, setCurrentMood] = useState(null);
  const handleMoodChange = useCallback((nextMood) => {
    if (nextMood) {
      setCurrentMood({ label: nextMood.label, emoji: nextMood.emoji });
    } else {
      setCurrentMood(null);
    }
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayTimestamp = Date.parse(todayISO);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem("habita:mood");
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (parsed?.label && MOOD_EMOJI[parsed.label]) {
        setCurrentMood({ label: parsed.label, emoji: MOOD_EMOJI[parsed.label] });
      }
    } catch (error) {
      // ignore malformed storage
    }
  }, [MOOD_EMOJI]);

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

  const openTaskCount = pendingCount + inProgressCount;
  const heroMoodText = currentMood
    ? `${currentMood.emoji} ${currentMood.label}`
    : "Tap to log mood";

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <section style={singleCardSectionStyle}>
          <MoodTracker variant="compact" onMoodChange={handleMoodChange} />
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
              <h3 style={titleStyle}>📋 Tasks Overview</h3>
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
            <div style={cardSnapshotRowStyle}>
              <button
                type="button"
                style={cardSnapshotButtonStyle}
                onClick={() => goToTasks({ filter: "pending", mineOnly: false })}
              >
                <span style={cardSnapshotValueStyle}>{dueTodayCount}</span>
                <span style={cardSnapshotLabelStyle}>due today</span>
              </button>
              <button
                type="button"
                style={cardSnapshotButtonStyle}
                onClick={() => goToTasks({ filter: "pending", mineOnly: false })}
              >
                <span style={cardSnapshotValueStyle}>{overdueCount}</span>
                <span style={cardSnapshotLabelStyle}>overdue</span>
              </button>
            </div>
            <p style={cardSummaryTextStyle}>
              <button
                type="button"
                style={cardSummaryLinkStyle}
                onClick={() => goToTasks({ filter: "pending" })}
              >
                {pendingCount} pending
              </button>
              <span> • </span>
              <button
                type="button"
                style={cardSummaryLinkStyle}
                onClick={() => goToTasks({ filter: "in-progress" })}
              >
                {inProgressCount} in progress
              </button>
              <span> • </span>
              <button
                type="button"
                style={cardSummaryLinkStyle}
                onClick={() => goToTasks({ filter: "completed" })}
              >
                {taskStats.completed} completed
              </button>
            </p>
            <div style={cardDividerStyle} />
            <div>
              <p style={cardSubheadingStyle}>🗓️ Upcoming</p>
              {upcomingTasks.length === 0 ? (
                <p style={textStyle}>Everything is wrapped up. 🎉</p>
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
              <h3 style={titleStyle}>💰 Bills Overview</h3>
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
            <div style={cardSnapshotRowStyle}>
              <div style={cardSnapshotItemStyle}>
                <span style={cardSnapshotValueStyle}>{dueSoonBillCount}</span>
                <span style={cardSnapshotLabelStyle}>due this week</span>
              </div>
              <div style={cardSnapshotItemStyle}>
                <span style={cardSnapshotValueStyle}>
                  ${myShareDue.toFixed(2)}
                </span>
                <span style={cardSnapshotLabelStyle}>your share</span>
              </div>
            </div>
            <p style={cardSummaryTextStyle}>
              <button
                type="button"
                style={cardSummaryLinkStyle}
                onClick={() => goToBills({ filter: "unpaid" })}
              >
                {billStats.unpaid} unpaid
              </button>
              <span> • </span>
              <button
                type="button"
                style={cardSummaryLinkStyle}
                onClick={() => goToBills({ filter: "paid" })}
              >
                {billStats.paid} paid
              </button>
            </p>
            {billStats.unpaid > 0 ? (
              <>
                <div style={cardDividerStyle} />
                <div>
                  <p style={cardSubheadingStyle}>📆 Coming due</p>
                  <ul style={billListStyle}>
                    {topUnpaidBills.map((bill) => {
                      const share = Array.isArray(bill.splitBetween) && bill.splitBetween.length
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
              <p style={textStyle}>All bills are settled! 🎉</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function handleExportICS(target) {
  const url = new URL(window.location.href);
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
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  boxShadow: "var(--habita-shadow)",
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
  border: "1px solid var(--habita-border)",
  background: "var(--habita-card)",
  color: "var(--habita-accent)",
  borderRadius: "8px",
  width: "32px",
  height: "32px",
  fontSize: "1.2rem",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "var(--habita-shadow)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardBadgeStyle = {
  padding: "0.15rem 0.6rem",
  borderRadius: "999px",
  backgroundColor: "var(--habita-chip)",
  color: "var(--habita-muted)",
  fontSize: "0.75rem",
  fontWeight: 600,
};

const cardSnapshotRowStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const cardSnapshotItemStyle = {
  backgroundColor: "var(--habita-chip)",
  borderRadius: "10px",
  padding: "0.45rem 0.6rem",
  display: "flex",
  flexDirection: "column",
  minWidth: "96px",
  gap: "0.15rem",
};

const cardSnapshotButtonStyle = {
  ...cardSnapshotItemStyle,
  border: "1px solid transparent",
  outline: "none",
  cursor: "pointer",
  textAlign: "left",
};

const cardSnapshotValueStyle = {
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "var(--habita-text)",
  lineHeight: 1.1,
};

const cardSnapshotLabelStyle = {
  fontSize: "0.7rem",
  color: "var(--habita-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
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

const heroStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
  color: "var(--habita-text)",
};

const heroTitleStyle = {
  margin: 0,
  fontSize: "1.35rem",
  fontWeight: 600,
};

const heroStatsRowStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
  margin: 0,
  marginTop: "0.25rem",
};

const heroStatBadgeStyle = {
  background: "var(--habita-chip)",
  color: "var(--habita-text)",
  borderRadius: "999px",
  padding: "0.3rem 0.7rem",
  fontSize: "0.8rem",
  fontWeight: 600,
};

const heroCaptionStyle = {
  margin: "0.4rem 0 0 0",
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
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

const cardSummaryTextStyle = {
  margin: 0,
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  flexWrap: "wrap",
};

const cardSummaryLinkStyle = {
  background: "transparent",
  border: "none",
  color: "var(--habita-accent)",
  fontSize: "0.8rem",
  fontWeight: 600,
  padding: 0,
  cursor: "pointer",
  textDecoration: "none",
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

const progressTrackStyle = {
  width: "100%",
  height: "8px",
  borderRadius: "999px",
  backgroundColor: "var(--habita-border)",
  marginTop: "0.8rem",
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  backgroundImage: "linear-gradient(90deg, var(--habita-accent), #9ecbff)",
  transition: "width 0.3s ease",
};

const progressLabelStyle = {
  display: "block",
  marginTop: "0.4rem",
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
  fontWeight: 600,
};
