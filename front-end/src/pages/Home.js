import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MoodTracker from "../components/MoodTracker";
import { useTasks } from "../context/TasksContext";

export default function Home() {
  const navigate = useNavigate();
  const { tasks, stats } = useTasks();

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

  const completionPercent = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <header style={heroStyle}>
          <h2 style={heroTitleStyle}>Today at a Glance</h2>
          <p style={heroSubtitleStyle}>
            {stats.pending} tasks open • {stats.mine} for you •{" "}
            {upcomingTasks.length} due soon
          </p>
        </header>

        <section style={summaryGridStyle}>
          <div style={{ ...cardStyle, gap: "0.75rem" }}>
            <div>
              <h3 style={titleStyle}>📋 Tasks Overview</h3>
              <p style={textStyle}>{stats.pending} tasks still open.</p>
              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${completionPercent}%`,
                  }}
                />
              </div>
              <span style={progressLabelStyle}>
                {completionPercent}% complete ({stats.completed}/{stats.total})
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

          <div style={cardStyle}>
            <h3 style={titleStyle}>💰 Bill Summary</h3>
            <p style={textStyle}>1 unpaid bill: Internet $45 (Alex).</p>
            <p style={textStyle}>Groceries settled yesterday.</p>
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
