import Navbar from "./Navbar";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";
import { useChat } from "../context/ChatContext";
import { useUser } from "../context/UserContext";

function Dashboard({ children }) {
  const { tasks } = useTasks();
  const { stats } = useBills();
  const { threads } = useChat();
  const { user } = useUser();
  const myName = user?.name || user?.username || "";
  const location = useLocation();
  const isChat = location.pathname === "/chat";
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 900 : false));
  useEffect(() => {
    const onResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 900);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    return () => {};
  }, []);
  const hideChrome = isChat && isMobile;
  const unreadWindows = threads.filter((t) => (t.unreadCount || 0) > 0).length;

  const myTasks = tasks.filter((task) =>
    Array.isArray(task.assignees)
      ? task.assignees.includes(myName)
      : task.assignees === myName
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
      {!hideChrome && (
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
      )}
      {!hideChrome && (
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
      )}
      <div style={{ flex: 1, overflowY: "auto" }}>{children || <Outlet />}</div>
      {!hideChrome && <Navbar />}
    </div>
  );
}

export default Dashboard;
