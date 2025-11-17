import { useMemo, useState, useCallback } from "react";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";
import { useNavigate } from "react-router-dom";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customEvents, setCustomEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);


  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const eventsByDate = useMemo(() => {
    const grouped = {};

    tasks.forEach((task) => {
      const date = task.due;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({
        id: `task-${task.id}`,
        type: "task",
        title: task.title,
        date: task.due,
        status: task.status,
        assignees: task.assignees,
      });
    });

    bills.forEach((bill) => {
      const date = bill.due;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({
        id: `bill-${bill.id}`,
        type: "bill",
        title: bill.title,
        date: bill.due,
        status: bill.status,
        amount: bill.amount,
      });
    });

    //custom calendar-only events
    customEvents.forEach((evt) => {
      const date = evt.date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(evt);
    });

    return grouped;
  }, [tasks, bills, customEvents]);


    const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const allEvents = [];

    tasks.forEach((task) => {
      const taskDate = new Date(task.due);
      if (taskDate >= now) {
        allEvents.push({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          date: task.due,
          status: task.status,
          assignees: task.assignees,
        });
      }
    });

    bills.forEach((bill) => {
      const billDate = new Date(bill.due);
      if (billDate >= now) {
        allEvents.push({
          id: `bill-${bill.id}`,
          type: "bill",
          title: bill.title,
          date: bill.due,
          status: bill.status,
          amount: bill.amount,
        });
      }
    });

    customEvents.forEach((evt) => {
      const evtDate = new Date(evt.date);
      if (evtDate >= now) {
        allEvents.push(evt);
      }
    });

    return allEvents
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
  }, [tasks, bills, customEvents]);

  const todayInfo = useMemo(() => {
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
    };
  }, []);

  const isToday = (day) => {
    return (
      day === todayInfo.day &&
      month === todayInfo.month &&
      year === todayInfo.year
    );
  };

  const getEventsForDay = useMemo(() => {
    return (day) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      return eventsByDate[dateStr] || [];
    };
  }, [year, month, eventsByDate]);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const handleEventClick = useCallback((event) => {
    if (event.type === "task") {
      navigate("/tasks");
    } else if (event.type === "bill") {
      navigate("/bills");
    }
  }, [navigate]);

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
          View all upcoming tasks and bills for your household
        </p>
      </section>

      <section style={calendarCardStyle}>
        <div style={calendarHeaderStyle}>
          <button
            type="button"
            style={navButtonStyle}
            onClick={previousMonth}
            aria-label="Previous month"
          >
            ‹
          </button>
          <h3 style={monthYearStyle}>
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            type="button"
            style={navButtonStyle}
            onClick={nextMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        <div style={addEventToggleRowStyle}>
          {!showAddEvent ? (
            <button
              type="button"
              style={addEventToggleButtonStyle}
              onClick={() => setShowAddEvent(true)}
            >
              + Add event
            </button>
          ) : (
            <form
              onSubmit={handleAddEvent}
              style={addEventFormStyle}
            >
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Event title"
                style={addEventInputStyle}
              />
              <input
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                style={addEventDateStyle}
              />
              <button type="submit" style={addEventSaveButtonStyle}>
                Save
              </button>
              <button
                type="button"
                style={addEventCancelButtonStyle}
                onClick={handleCancelAddEvent}
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        <div style={weekdaysStyle}>
          {WEEKDAY_NAMES.map((day) => (
            <div key={day} style={weekdayStyle}>
              {day}
            </div>
          ))}
        </div>

        <div style={daysGridStyle}>
          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const today = day && isToday(day);

            return (
              <div
                key={index}
                style={{
                  ...dayCell,
                  ...(day ? {} : emptyCellStyle),
                  ...(today ? todayCellStyle : {}),
                }}
              >
                {day && (
                  <>
                    <div
                      style={{
                        ...dayNumberStyle,
                        ...(today ? todayNumberStyle : {}),
                      }}
                    >
                      {day}
                    </div>
                    <div style={eventsContainerStyle}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          style={{
                            ...eventBadgeStyle,
                            ...(event.type === "task"
                              ? taskEventStyle
                              : event.type === "bill"
                              ? billEventStyle
                              : customEventStyle),
                          }}
                          onClick={() => handleEventClick(event)}
                          title={`${event.title}${
                            event.type === "bill"
                              ? ` - $${event.amount.toFixed(2)}`
                              : ""
                          }`}
                        >
                          <span style={eventIconStyle}>
                            {event.type === "task"
                              ? "✓"
                              : event.type === "bill"
                              ? "$"
                              : "•"}
                          </span>
                          <span style={eventTitleStyle}>{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div style={moreEventsStyle}>
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section style={upcomingCardStyle}>
        <h3 style={sectionTitleStyle}>Upcoming Deadlines</h3>
        <div style={upcomingListStyle}>
          {upcomingEvents.map((event) => (
              <div
                key={event.id}
                style={upcomingItemStyle}
                onClick={() => handleEventClick(event)}
              >
                <div style={upcomingLeftStyle}>
                  <span
                    style={{
                      ...upcomingIconStyle,
                      ...(event.type === "task"
                        ? taskIconColorStyle
                        : event.type === "bill"
                        ? billIconColorStyle
                        : eventIconGeneralColorStyle),
                    }}
                  >
                    {event.type === "task"
                      ? "✓"
                      : event.type === "bill"
                      ? "$"
                      : "•"}
                  </span>
                  <div>
                    <div style={upcomingTitleStyle}>{event.title}</div>
                    <div style={upcomingMetaStyle}>
                      {new Date(event.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {event.type === "task" && event.assignees && (
                        <span> • {event.assignees.join(", ")}</span>
                      )}
                      {event.type === "bill" && (
                        <span> • ${event.amount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    ...statusBadgeStyle,
                    ...(event.status === "completed" || event.status === "paid"
                      ? completedBadgeStyle
                      : event.status === "in-progress"
                      ? inProgressBadgeStyle
                      : pendingBadgeStyle),
                  }}
                >
                  {event.status === "completed"
                    ? "Completed"
                    : event.status === "paid"
                    ? "Paid"
                    : event.status === "in-progress"
                    ? "In Progress"
                    : event.status === "unpaid"
                    ? "Unpaid"
                    : event.status === "upcoming"
                    ? "Upcoming"
                    : "Pending"}

                </span>
              </div>
            ))}
        </div>
      </section>
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
  gap: "0.25rem",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "var(--habita-text)",
};

const subtitleStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
};

const calendarCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const calendarHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid var(--habita-border)",
};

const navButtonStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "8px",
  width: "36px",
  height: "36px",
  fontSize: "1.5rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
};

const monthYearStyle = {
  margin: 0,
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const weekdaysStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "0.5rem",
};

const weekdayStyle = {
  textAlign: "center",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "var(--habita-muted)",
  padding: "0.5rem 0",
};

const daysGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "0.5rem",
};

const dayCell = {
  minHeight: "80px",
  padding: "0.5rem",
  background: "var(--habita-chip)",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
};

const emptyCellStyle = {
  background: "transparent",
  border: "none",
};

const todayCellStyle = {
  border: "2px solid var(--habita-accent)",
  background: "rgba(74,144,226,0.08)",
};

const dayNumberStyle = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const todayNumberStyle = {
  color: "var(--habita-accent)",
  fontWeight: 700,
};

const eventsContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  flex: 1,
};

const eventBadgeStyle = {
  fontSize: "0.65rem",
  padding: "0.2rem 0.4rem",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  gap: "0.25rem",
  cursor: "pointer",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const taskEventStyle = {
  background: "rgba(63, 157, 165, 0.18)",
  color: "#3f9da5",
};

const billEventStyle = {
  background: "rgba(74, 144, 226, 0.18)",
  color: "#4a90e2",
};

const eventIconStyle = {
  fontSize: "0.7rem",
  flexShrink: 0,
};

const eventTitleStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontWeight: 600,
};

const moreEventsStyle = {
  fontSize: "0.65rem",
  color: "var(--habita-muted)",
  fontStyle: "italic",
  paddingLeft: "0.4rem",
};

const upcomingCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.8rem",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const upcomingListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
};

const upcomingItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.8rem",
  padding: "0.7rem 0.9rem",
  background: "var(--habita-chip)",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  cursor: "pointer",
};

const upcomingLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.8rem",
  flex: 1,
  minWidth: 0,
};

const upcomingIconStyle = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1rem",
  fontWeight: 600,
  flexShrink: 0,
};

const taskIconColorStyle = {
  background: "rgba(63, 157, 165, 0.18)",
  color: "#3f9da5",
};

const billIconColorStyle = {
  background: "rgba(74, 144, 226, 0.18)",
  color: "#4a90e2",
};

const upcomingTitleStyle = {
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "var(--habita-text)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const upcomingMetaStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  marginTop: "0.2rem",
};

const statusBadgeStyle = {
  fontSize: "0.7rem",
  fontWeight: 600,
  padding: "0.25rem 0.6rem",
  borderRadius: "999px",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const completedBadgeStyle = {
  backgroundColor: "rgba(30, 58, 138, 0.16)",
  color: "#1e3a8a",
};

const inProgressBadgeStyle = {
  backgroundColor: "rgba(63, 157, 165, 0.18)",
  color: "#3f9da5",
};

const pendingBadgeStyle = {
  backgroundColor: "rgba(37, 99, 235, 0.16)",
  color: "#2563eb",
};

const addEventToggleRowStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "0.5rem",
};

const addEventToggleButtonStyle = {
  border: "1px solid var(--habita-border)",
  background: "var(--habita-chip)",
  color: "var(--habita-text)",
  borderRadius: "999px",
  padding: "0.25rem 0.8rem",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const addEventFormStyle = {
  display: "flex",
  gap: "0.4rem",
  flexWrap: "wrap",
  alignItems: "center",
  width: "100%",
};

const addEventInputStyle = {
  flex: 2,
  minWidth: "140px",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  padding: "0.35rem 0.5rem",
  fontSize: "0.8rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
};

const addEventDateStyle = {
  flex: 1,
  minWidth: "120px",
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  padding: "0.35rem 0.5rem",
  fontSize: "0.8rem",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
};

const addEventSaveButtonStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "999px",
  padding: "0.35rem 0.9rem",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
};

const addEventCancelButtonStyle = {
  background: "transparent",
  color: "var(--habita-muted)",
  border: "none",
  borderRadius: "999px",
  padding: "0.35rem 0.6rem",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const customEventStyle = {
  background: "rgba(234,179,8,0.18)", // amber-ish
  color: "#b45309",
};

const eventIconGeneralColorStyle = {
  background: "rgba(234,179,8,0.18)",
  color: "#b45309",
};

