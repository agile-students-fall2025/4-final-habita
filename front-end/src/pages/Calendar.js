import { useCallback, useMemo, useState } from "react";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";
import { useNavigate } from "react-router-dom";
import MiniCalendar from "../components/MiniCalendar";

const toISO = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (iso) => {
  if (!iso) return "";
  const parsed = new Date(iso);
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const { tasks } = useTasks();
  const { bills } = useBills();
  const navigate = useNavigate();

  const [monthDate, setMonthDate] = useState(new Date());
  const [customEvents, setCustomEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDateISO, setSelectedDateISO] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const todayISO = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return toISO(now);
  }, []);

  const eventsByISO = useMemo(() => {
    const grouped = {};

    const addEvent = (event) => {
      if (!event?.date) return;
      const iso = event.date.slice(0, 10);
      if (!grouped[iso]) grouped[iso] = [];
      grouped[iso].push(event);
    };

    tasks.forEach((task) =>
      addEvent({
        id: `task-${task.id}`,
        type: "task",
        title: task.title,
        date: task.due,
        status: task.status,
        assignees: task.assignees,
      })
    );

    bills.forEach((bill) =>
      addEvent({
        id: `bill-${bill.id}`,
        type: "bill",
        title: bill.title,
        date: bill.due,
        status: bill.status,
        amount: bill.amount,
      })
    );

    customEvents.forEach((event) => addEvent(event));

    return grouped;
  }, [tasks, bills, customEvents]);

  const handleSelectDate = useCallback((iso) => {
    setSelectedDateISO(iso);
    setNewEventDate(iso);
    setDetailsOpen(true);
  }, []);

  const activeISO = selectedDateISO || todayISO;
  const activeEvents = eventsByISO[activeISO] || [];
  const activeLabel = formatDateLabel(activeISO);
  const detailsSubtitle = selectedDateISO ? "Household plan" : "Today's routine";

  const handleEventClick = useCallback(
    (event) => {
      if (event.type === "task") {
        navigate("/tasks");
      } else if (event.type === "bill") {
        navigate("/bills");
      }
    },
    [navigate]
  );

  const handleAddEventSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!newEventTitle.trim() || !newEventDate) return;

      setCustomEvents((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          type: "event",
          title: newEventTitle.trim(),
          date: newEventDate,
          status: "upcoming",
        },
      ]);

      setNewEventTitle("");
      setNewEventDate(activeISO);
      setShowAddEvent(false);
    },
    [newEventTitle, newEventDate, activeISO]
  );

  const handleOpenTasks = useCallback(() => {
    navigate("/tasks", {
      state: { dueFilter: { type: "date", value: activeISO }, date: activeISO },
    });
  }, [navigate, activeISO]);

  const handleOpenBills = useCallback(() => {
    navigate("/bills", {
      state: { fromCalendarDate: activeISO },
    });
  }, [navigate, activeISO]);

  const handleAddEvent = useCallback((e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) return;

    setCustomEvents((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        type: "event",
        title: newEventTitle.trim(),
        date: newEventDate,
        status: "upcoming",
      },
    ]);

    setNewEventTitle("");
    setNewEventDate("");
    setShowAddEvent(false);
  }, [newEventTitle, newEventDate]);

  const handleCancelAddEvent = useCallback(() => {
    setShowAddEvent(false);
    setNewEventTitle("");
    setNewEventDate("");
  }, []);

  return (
    <div style={pageStyle}>
      <section style={headerSectionStyle}>
        <h2 style={titleStyle}>Shared Calendar</h2>
        <p style={subtitleStyle}>
          A compact look at your household schedule. Tap a date to expand
          today's plan.
        </p>
      </section>

      <div style={cardsLayoutStyle}>
        <section style={thumbnailCardStyle}>
          <MiniCalendar
            titlePrefix="Household"
            monthDate={monthDate}
            eventsByISO={eventsByISO}
            indicatorMode="types"
            onSelectDate={handleSelectDate}
            onMonthChange={(direction) =>
              setMonthDate((prev) => {
                const next = new Date(prev);
                next.setMonth(prev.getMonth() + direction);
                return next;
              })
            }
          />
        </section>

        <section style={detailCardStyle}>
        <button
          type="button"
          style={detailToggleButtonStyle}
          onClick={() => setDetailsOpen((prev) => !prev)}
        >
          <div>
            <p style={detailToggleLabelStyle}>{detailsSubtitle}</p>
            <p style={detailToggleDateStyle}>{activeLabel}</p>
          </div>
          <span
            style={{
              ...detailToggleChipStyle,
              ...(detailsOpen ? detailToggleChipActiveStyle : {}),
            }}
          >
            {detailsOpen ? "Close" : "Open"}
          </span>
        </button>

        {detailsOpen && (
          <>
            <div style={detailListStyle}>
              {activeEvents.length === 0 ? (
                <p style={detailEmptyStyle}>
                  Nothing on the books for this day. Enjoy the downtime!
                </p>
              ) : (
                activeEvents.map((event) => (
                  <div
                    key={event.id}
                    style={detailItemStyle}
                    onClick={() => handleEventClick(event)}
                  >
                    <span
                      style={{
                        ...detailIconStyle,
                        ...(event.type === "task"
                          ? taskIconStyle
                          : event.type === "bill"
                          ? billIconStyle
                          : customIconStyle),
                      }}
                    >
                      {event.type === "task"
                        ? "✓"
                        : event.type === "bill"
                        ? "$"
                        : "•"}
                    </span>
                    <div style={detailTextStyle}>
                      <p style={detailTitleStyle}>{event.title}</p>
                      <p style={detailMetaStyle}>
                        {event.type === "task" && event.assignees?.length
                          ? `Assigned to ${event.assignees.join(", ")}`
                          : event.type === "bill" && event.amount
                          ? `$${event.amount.toFixed(2)}`
                          : "Custom reminder"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={detailActionsStyle}>
              <button
                type="button"
                style={detailPrimaryButtonStyle}
                onClick={handleOpenTasks}
              >
                Open this day in Tasks
              </button>
              <button
                type="button"
                style={detailSecondaryButtonStyle}
                onClick={handleOpenBills}
              >
                Review bills on this day
              </button>
              {showAddEvent ? (
                <form style={addEventFormStyle} onSubmit={handleAddEventSubmit}>
                  <input
                    type="text"
                    placeholder="Reminder title"
                    value={newEventTitle}
                    onChange={(event) => setNewEventTitle(event.target.value)}
                    style={addEventInputStyle}
                  />
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(event) => setNewEventDate(event.target.value)}
                    style={addEventDateInputStyle}
                  />
                  <div style={addEventButtonRowStyle}>
                    <button type="submit" style={addEventSaveStyle}>
                      Save event
                    </button>
                    <button
                      type="button"
                      style={addEventCancelStyle}
                      onClick={() => {
                        setShowAddEvent(false);
                        setNewEventTitle("");
                        setNewEventDate(activeISO);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  style={detailGhostButtonStyle}
                  onClick={() => {
                    setShowAddEvent(true);
                    setNewEventDate(activeISO);
                  }}
                >
                  + Add quick reminder
                </button>
              )}
            </div>
          </>
        )}
        </section>
      </div>
    </div>
  );
}

const pageStyle = {
  padding: "1.25rem",
  backgroundColor: "var(--habita-bg)",
  minHeight: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "1.25rem",
  color: "var(--habita-text)",
};

const headerSectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.6rem",
  fontWeight: 700,
};

const subtitleStyle = {
  margin: 0,
  fontSize: "0.95rem",
  color: "var(--habita-muted)",
};

const cardBaseStyle = {
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "0.9rem 1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const cardsLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1rem",
  alignItems: "start",
};

const thumbnailCardStyle = {
  ...cardBaseStyle,
};

const detailCardStyle = {
  ...cardBaseStyle,
  gap: "1rem",
};

const detailToggleButtonStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid var(--habita-border)",
  borderRadius: "10px",
  background: "var(--habita-chip)",
  padding: "0.7rem 0.85rem",
  cursor: "pointer",
};

const detailToggleLabelStyle = {
  margin: 0,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--habita-muted)",
};

const detailToggleDateStyle = {
  margin: 0,
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const detailToggleChipStyle = {
  fontSize: "0.8rem",
  fontWeight: 600,
  borderRadius: "999px",
  border: "1px solid var(--habita-border)",
  padding: "0.2rem 0.85rem",
  color: "var(--habita-text)",
  background: "transparent",
};

const detailToggleChipActiveStyle = {
  borderColor: "transparent",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
};

const detailListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.65rem",
};

const detailEmptyStyle = {
  margin: 0,
  color: "var(--habita-muted)",
  fontSize: "0.95rem",
  textAlign: "center",
  padding: "0.4rem 0",
};

const detailItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.8rem",
  borderRadius: "12px",
  border: "1px solid var(--habita-border)",
  padding: "0.65rem 0.8rem",
  cursor: "pointer",
  background: "var(--habita-chip)",
};

const detailIconStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: "1rem",
};

const detailTextStyle = {
  flex: 1,
  minWidth: 0,
};

const detailTitleStyle = {
  margin: 0,
  fontSize: "0.95rem",
  fontWeight: 600,
  color: "var(--habita-text)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const detailMetaStyle = {
  margin: "0.2rem 0 0",
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const detailActionsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const detailPrimaryButtonStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.5rem 0.9rem",
  fontWeight: 600,
  fontSize: "0.85rem",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  cursor: "pointer",
};

const detailSecondaryButtonStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "999px",
  padding: "0.5rem 0.9rem",
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
  background: "transparent",
  color: "var(--habita-text)",
};

const detailGhostButtonStyle = {
  border: "none",
  borderRadius: "999px",
  padding: "0.5rem 0.9rem",
  fontWeight: 600,
  fontSize: "0.85rem",
  cursor: "pointer",
  background: "rgba(74, 144, 226, 0.08)",
  color: "var(--habita-accent)",
};

const addEventFormStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  border: "1px solid var(--habita-border)",
  borderRadius: "10px",
  padding: "0.85rem",
  background: "var(--habita-chip)",
};

const addEventInputStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "10px",
  padding: "0.6rem 0.75rem",
  fontSize: "0.95rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
};

const addEventDateInputStyle = {
  ...addEventInputStyle,
};

const addEventButtonRowStyle = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const addEventSaveStyle = {
  flex: 1,
  border: "none",
  borderRadius: "10px",
  padding: "0.6rem",
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  fontWeight: 600,
  cursor: "pointer",
};

const addEventCancelStyle = {
  flex: 1,
  borderRadius: "10px",
  border: "1px solid var(--habita-border)",
  padding: "0.6rem",
  background: "transparent",
  color: "var(--habita-text)",
  fontWeight: 600,
  cursor: "pointer",
};

const taskIconStyle = {
  background: "rgba(63, 157, 165, 0.2)",
  color: "#3f9da5",
};

const billIconStyle = {
  background: "rgba(74, 144, 226, 0.2)",
  color: "#4a90e2",
};

const customIconStyle = {
  background: "rgba(107, 114, 128, 0.2)",
  color: "#6b7280",
};
