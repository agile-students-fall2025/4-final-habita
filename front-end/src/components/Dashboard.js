import Navbar from "./Navbar";
import { Outlet, Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";
import { useChat } from "../context/ChatContext";

function Dashboard({ children }) {
  const { tasks } = useTasks();
  const { stats } = useBills();
  const { threads } = useChat();
  const unreadWindows = threads.filter((t) => (t.unreadCount || 0) > 0).length;

  const myTasks = tasks.filter((task) =>
    Array.isArray(task.assignees)
      ? task.assignees.includes("You")
      : task.assignees === "You"
  );
  const openForMe = myTasks.filter((task) => task.status !== "completed").length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--habita-bg)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--habita-card)",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--habita-border)",
          zIndex: 1,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 600, color: "var(--habita-text)" }}>
          <Link
            to="/home"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            Habita
          </Link>
        </h2>
        <Link
          to="/chat"
          style={{
            background: "var(--habita-card)",
            borderRadius: "50%",
            border: "1px solid rgba(74,144,226,0.25)",
            padding: "0.5rem 0.6rem",
            cursor: "pointer",
            color: "var(--habita-text)",
            textDecoration: "none",
            display: "inline-block",
            position: "relative",
          }}
          aria-label="Open chat"
        >
          <span role="img" aria-label="chat">💬</span>
          {unreadWindows > 0 && (
              <span className="habita-badge-notification habita-badge-notification--overlay">
              {unreadWindows}
            </span>
          )}
        </Link>
      </header>
      <div
        style={{
          backgroundColor: "var(--habita-card)",
          padding: "10px 20px",
          borderBottom: "1px solid var(--habita-border)",
          fontWeight: 600,
          color: "var(--habita-text)",
        }}
      >
        Tasks open: {openForMe} ・ Unpaid bills: {stats.unpaid}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children || <Outlet />}</div>
      <Navbar />
    </div>
  );
}

export default Dashboard;
