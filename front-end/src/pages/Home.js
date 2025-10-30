import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MoodTracker from "../components/MoodTracker";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";

export default function Home() {
  const navigate = useNavigate();
  const { tasks, stats: taskStats } = useTasks();
  const { bills, stats: billStats } = useBills();

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

  const topUnpaidBills = unpaidBills.slice(0, 2);

  const completionPercent = taskStats.total
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <header style={heroStyle}>
          <h2 style={heroTitleStyle}>Today at a Glance</h2>
          <p style={heroSubtitleStyle}>
            {taskStats.pending} tasks open • {taskStats.mine} assigned to you •{" "}
            {billStats.unpaid} bills unpaid
          </p>
        </header>

        <section style={summaryGridStyle}>
          <div style={{ ...cardStyle, gap: "1rem" }}>
            <div style={cardHeaderRowStyle}>
              <h3 style={titleStyle}>📋 Tasks Overview</h3>
              <span style={cardBadgeStyle}>{taskStats.total} total</span>
            </div>
            <div style={cardMetricsRowStyle}>
              <span style={cardMetricStyle}>
                <strong>{taskStats.pending}</strong>
                <span>in progress</span>
              </span>
              <span style={cardMetricStyle}>
                <strong>{taskStats.completed}</strong>
                <span>completed</span>
              </span>
            </div>
            <div>
              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${completionPercent}%`,
                  }}
                />
              </div>
              <span style={progressLabelStyle}>
                {completionPercent}% complete ({taskStats.completed}/
                {taskStats.total})
              </span>
            </div>
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
              <span style={cardBadgeStyle}>{billStats.total} total</span>
            </div>
            <div style={cardMetricsRowStyle}>
              <span style={cardMetricStyle}>
                <strong>{billStats.unpaid}</strong>
                <span>unpaid</span>
              </span>
              <span style={cardMetricStyle}>
                <strong>{billStats.paid}</strong>
                <span>paid</span>
              </span>
            </div>
            {billStats.unpaid > 0 ? (
              <>
                <div style={cardDividerStyle} />
                <div>
                  <p style={cardSubheadingStyle}>📆 Coming due</p>
                  <ul style={billListStyle}>
                    {topUnpaidBills.map((bill) => {
                      const share = bill.splitBetween?.length
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

        <section style={secondaryGridStyle}>
          <MoodTracker variant="compact" />
          <div style={{ ...cardStyle, ...quickActionsCardStyle }}>
            <h3 style={titleStyle}>⚡ Quick Actions</h3>
            <div style={quickActionButtonsStyle}>
              <button
                style={buttonStyle}
                onClick={() => navigate("/tasks", { state: { openForm: true } })}
              >
                + Add Task
              </button>
              <button
                style={buttonStyle}
                onClick={() => navigate("/bills")}
              >
                + Add Bill
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
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

const cardBadgeStyle = {
  padding: "0.15rem 0.6rem",
  borderRadius: "999px",
  backgroundColor: "var(--habita-chip)",
  color: "var(--habita-muted)",
  fontSize: "0.75rem",
  fontWeight: 600,
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

const heroSubtitleStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const secondaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
};

const quickActionsCardStyle = {
  justifyContent: "space-between",
  gap: "0.75rem",
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

const cardMetricsRowStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const cardMetricStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.1rem",
  backgroundColor: "var(--habita-chip)",
  borderRadius: "8px",
  padding: "0.4rem 0.6rem",
  color: "var(--habita-text)",
  fontSize: "0.75rem",
  minWidth: "96px",
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

const quickActionButtonsStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const buttonStyle = {
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "8px",
  padding: "0.7rem 1.2rem",
  cursor: "pointer",
  fontWeight: "500",
  boxShadow: "var(--habita-shadow)",
  flex: "1 1 140px",
};
