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

  const completionPercent = taskStats.total
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  return (
    <div
      style={{
        padding: "1.5rem",
        backgroundColor: "var(--habita-bg)",
        minHeight: "100vh",
      }}
    >
      <MoodTracker />
      <section style={summaryGridStyle}>
        <div style={cardStyle}>
          <h3 style={titleStyle}>📋 Task Summary</h3>
          <p style={textStyle}>{taskStats.pending} tasks still open.</p>
          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${completionPercent}%`,
              }}
            />
          </div>
          <span style={progressLabelStyle}>
            {completionPercent}% complete ({taskStats.completed}/{taskStats.total})
          </span>
        </div>

        <div style={cardStyle}>
          <h3 style={titleStyle}>🗓️ Upcoming Tasks</h3>
          {upcomingTasks.length === 0 ? (
            <p style={textStyle}>Everything is wrapped up. 🎉</p>
          ) : (
            <ul style={taskListStyle}>
              {upcomingTasks.map((task) => (
                <li key={task.id} style={taskListItemStyle}>
                  <span>{task.title}</span>
                  <span style={taskListMetaStyle}>{formatDueLabel(task.due)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={titleStyle}>💰 Bill Summary</h3>
          {billStats.unpaid > 0 ? (
            bills
              .filter(bill => bill.status === "unpaid")
              .slice(0, 2)
              .map((bill, index) => (
                <p key={bill.id} style={textStyle}>
                  {bill.title}: ${(bill.amount / bill.splitBetween.length).toFixed(2)} (your share)
                  {index === 0 && billStats.unpaid > 2 && ` + ${billStats.unpaid - 2} more`}
                </p>
              ))
          ) : (
            <p style={textStyle}>All bills are settled! 🎉</p>
          )}
        </div>
      </section>

      <h4 style={{ color: "var(--habita-muted)", marginBottom: "1rem" }}>Quick Actions</h4>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
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
  );
}

const cardStyle = {
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  boxShadow: "var(--habita-shadow)",
  padding: "1rem 1.2rem",
  textAlign: "left",
}; 

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "1.5rem",
  marginBottom: "2rem",
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

const buttonStyle = {
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "8px",
  padding: "0.7rem 1.2rem",
  cursor: "pointer",
  fontWeight: "500",
  boxShadow: "var(--habita-shadow)",
};
