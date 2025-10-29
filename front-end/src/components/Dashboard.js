import Navbar from "./Navbar";
import { Outlet, Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";

function Dashboard({ children }) {
  const { tasks } = useTasks();
  const { stats } = useBills();

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
          boxShadow: "var(--habita-shadow)",
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
        <button
          style={{
            border: "none",
            background: "var(--habita-card)",
            borderRadius: "50%",
            boxShadow: "var(--habita-shadow)",
            padding: "0.5rem 0.6rem",
            cursor: "pointer",
            color: "var(--habita-text)",
          }}
        >
          🔔
        </button>
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
        🧹 {openForMe} of your tasks open ・ 💰 {stats.unpaid} unpaid bills
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children || <Outlet />}</div>
      <Navbar />
    </div>
  );
}

export default Dashboard;
