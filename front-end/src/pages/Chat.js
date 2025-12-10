import React, { useState, useMemo } from "react";
import ChatThread from "../components/ChatThread";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";
import { useHousehold } from "../context/HouseholdContext";
import { useUser } from "../context/UserContext";

export default function Chat() {
  const { tasks } = useTasks();
  const { bills } = useBills();
  const { household } = useHousehold();
  const { user } = useUser();

  const myName = user?.username || user?.name || "";

  // ---- HOUSEHOLD CHAT THREAD ID ----
  const householdThreadId = useMemo(() => {
    if (household?._id) return `household-${household._id}`;
    return "household-unknown";
  }, [household]);

  // Active chat
  const [activeThreadId, setActiveThreadId] = useState(householdThreadId);

  // ---- COMPUTE CHAT TITLE ----
  const activeTitle = useMemo(() => {
    if (activeThreadId === householdThreadId) return "Household Chat";

    if (activeThreadId.startsWith("task-")) {
      const t = tasks.find((x) => `task-${x.id}` === activeThreadId);
      return t ? `Task: ${t.title}` : "Task Chat";
    }

    if (activeThreadId.startsWith("bill-")) {
      const b = bills.find((x) => `bill-${x.id}` === activeThreadId);
      return b ? `Bill: ${b.title}` : "Bill Chat";
    }

    return "Chat";
  }, [activeThreadId, householdThreadId, tasks, bills]);

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      
      {/* SIDEBAR */}
      <div
        style={{
          width: "280px",
          background: "var(--habita-card)",
          borderRight: "1px solid var(--habita-border)",
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Chats</h3>

        {/* HOUSEHOLD CHAT BUTTON */}
        <button
          onClick={() => setActiveThreadId(householdThreadId)}
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            background:
              activeThreadId === householdThreadId
                ? "var(--habita-accent-light)"
                : "white",
            border: "1px solid var(--habita-border)",
            borderRadius: "8px",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          🏠 Household Chat
        </button>

        {/* TASK CHATS */}
        <h4>Tasks</h4>
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveThreadId(`task-${t.id}`)}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              marginBottom: "0.35rem",
              background:
                activeThreadId === `task-${t.id}`
                  ? "var(--habita-accent-light)"
                  : "white",
              border: "1px solid var(--habita-border)",
              borderRadius: "8px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            📌 {t.title}
          </button>
        ))}

        {/* BILL CHATS */}
        <h4 style={{ marginTop: "1rem" }}>Bills</h4>
        {bills.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveThreadId(`bill-${b.id}`)}
            style={{
              display: "block",
              width: "100%",
              padding: "0.5rem",
              marginBottom: "0.35rem",
              background:
                activeThreadId === `bill-${b.id}`
                  ? "var(--habita-accent-light)"
                  : "white",
              border: "1px solid var(--habita-border)",
              borderRadius: "8px",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            💵 {b.title}
          </button>
        ))}
      </div>

      {/* MAIN CHAT WINDOW */}
      <div style={{ flex: 1, padding: "1rem", overflow: "hidden" }}>
        <ChatThread
          threadId={activeThreadId}
          title={activeTitle}
          currentUserName={myName}
        />
      </div>
    </div>
  );
}
