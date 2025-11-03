import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";

export default function Notifications() {
  const { tasks } = useTasks();
  const { bills } = useBills();

  const openForMeTasks = tasks.filter((task) => {
    const assignedToMe = Array.isArray(task.assignees)
      ? task.assignees.includes("You")
      : task.assignees === "You";
    return assignedToMe && task.status !== "completed";
  });

  const unpaidForMeBills = bills.filter((bill) => {
    const involvesMe = Array.isArray(bill.splitBetween)
      ? bill.splitBetween.includes("You")
      : false;
    const myUnpaid = bill.payments && bill.payments["You"] === false;
    return bill.status === "unpaid" && involvesMe && myUnpaid;
  });

  const notifications = [
    ...openForMeTasks.map((t) => ({
      id: `task-${t.id}`,
      icon: "🧹",
      title: t.title,
      detail: "You have a new task",
      time: formatDate(t.due),
    })),
    ...unpaidForMeBills.map((b) => ({
      id: `bill-${b.id}`,
      icon: "💰",
      title: b.title,
      detail: `Your share of ${b.amount} is unpaid`,
      time: formatDate(b.dueDate),
    })),
  ];

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>Notifications</h2>
        <span style={badgeStyle}>{notifications.length}</span>
      </header>

      <section style={listStyle}>
        {notifications.length === 0 ? (
          <p style={emptyStyle}>No notifications for you.</p>
        ) : (
          notifications.map((item) => (
            <article key={item.id} style={cardStyle}>
              <div style={cardIconStyle}>{item.icon}</div>
              <div style={cardContentStyle}>
                <strong style={cardTitleStyle}>{item.title}</strong>
                <p style={cardDetailStyle}>{item.detail}</p>
              </div>
              <span style={timeStyle}>{item.time}</span>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return String(value);
  const d = new Date(parsed);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const pageStyle = {
  padding: "1.25rem",
  backgroundColor: "var(--habita-bg)",
  minHeight: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  color: "var(--habita-text)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.2rem",
  color: "var(--habita-text)",
};

const badgeStyle = {
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderRadius: "999px",
  padding: "0.2rem 0.6rem",
  fontSize: "0.75rem",
  fontWeight: 700,
};

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const emptyStyle = {
  margin: 0,
  textAlign: "center",
  color: "var(--habita-muted)",
  background: "var(--habita-card)",
  padding: "1rem",
  borderRadius: "12px",
  boxShadow: "var(--habita-shadow)",
};

const cardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.8rem",
  background: "var(--habita-card)",
  borderRadius: "12px",
  padding: "0.8rem 0.9rem",
  boxShadow: "var(--habita-shadow)",
};

const cardIconStyle = {
  fontSize: "1.2rem",
};

const cardContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
  flex: 1,
};

const cardTitleStyle = {
  fontSize: "0.95rem",
  color: "var(--habita-text)",
};

const cardDetailStyle = {
  margin: 0,
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const timeStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
};


