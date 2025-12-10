import React, { useState } from "react";
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

  // Stable household thread ID
  const householdThreadId = household?._id
    ? `household-${household._id}`
    : "household-default";

  const [activeThreadId, setActiveThreadId] = useState(householdThreadId);

  // Compute active title
  let activeTitle = "Household Chat";

  if (activeThreadId.startsWith("task-")) {
    const t = tasks.find((x) => `task-${x.id}` === activeThreadId);
    if (t) activeTitle = `Task: ${t.title}`;
  } else if (activeThreadId.startsWith("bill-")) {
    const b = bills.find((x) => `bill-${x.id}` === activeThreadId);
    if (b) activeTitle = `Bill: ${b.title}`;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
      }}
    >
      {/* LEFT SIDEBAR */}
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

        {/* Household */}
        <button
          onClick={() => setActiveThreadId(householdThreadId)}
          style={{
            display: "block",
            width: "100%",
            padding: "0.5rem",
            marginBottom: "0.5rem",
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

        {/* List all task chats */}
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

        {/* List all bill chats */}
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

      {/* MAIN CHAT VIEW */}
      <div
        style={{
          flex: 1,
          padding: "1rem",
          overflow: "hidden",
        }}
      >
        <ChatThread
          threadId={activeThreadId}
          title={activeTitle}
          currentUserName={myName}
        />
      </div>
    </div>
  );
}
