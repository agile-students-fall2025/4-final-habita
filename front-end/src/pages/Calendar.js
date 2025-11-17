import { useMemo, useState, useCallback } from "react";
import { useTasks } from "../context/TasksContext";
import { useBills } from "../context/BillsContext";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const createISOFromParts = (year, monthIndex, day) => {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

const isoFromDate = (date) =>
  createISOFromParts(date.getFullYear(), date.getMonth(), date.getDate());

const dateFromISO = (iso) => {
  const [year, month, day] = iso.split("-").map((part) => parseInt(part, 10));
  return new Date(year, month - 1, day);
};

export default function Calendar() {
  const { tasks } = useTasks();
  const { bills } = useBills();
  const { darkMode } = useUser();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateISO, setSelectedDateISO] = useState(null);
  const styles = useMemo(() => createCalendarStyles(darkMode), [darkMode]);

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
      if (!grouped[date]) {
        grouped[date] = [];
      }
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
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push({
        id: `bill-${bill.id}`,
        type: "bill",
        title: bill.title,
        date: bill.due,
        status: bill.status,
        amount: bill.amount,
      });
    });

    return grouped;
  }, [tasks, bills]);

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

    return allEvents
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
  }, [tasks, bills]);

  const todayInfo = useMemo(() => {
    const today = new Date();
    return {
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
      iso: isoFromDate(today),
    };
  }, []);
  const activeDateISO = selectedDateISO || todayInfo.iso;
  const selectedDate = useMemo(
    () => (selectedDateISO ? dateFromISO(selectedDateISO) : null),
    [selectedDateISO]
  );
  const selectedEvents = useMemo(
    () => (selectedDateISO ? eventsByDate[selectedDateISO] || [] : []),
    [eventsByDate, selectedDateISO]
  );
  const todayEvents = useMemo(
    () => eventsByDate[todayInfo.iso] || [],
    [eventsByDate, todayInfo]
  );
  const todayDateLabel = useMemo(() => {
    const tmp = new Date(todayInfo.year, todayInfo.month, todayInfo.day);
    return tmp.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [todayInfo]);
  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  const isToday = (day) => {
    if (!day) return false;
    const iso = createISOFromParts(year, month, day);
    return iso === todayInfo.iso;
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

  const monthNames = [
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

  const handleDaySelect = useCallback(
    (day) => {
      if (!day) return;
      setSelectedDateISO(createISOFromParts(year, month, day));
    },
    [year, month]
  );

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

  const handleResetToToday = useCallback(() => {
    setSelectedDateISO(null);
    setCurrentDate(new Date(todayInfo.year, todayInfo.month, 1));
  }, [todayInfo]);

  const handleShowTodayDetails = useCallback(() => {
    setSelectedDateISO(todayInfo.iso);
    setCurrentDate(new Date(todayInfo.year, todayInfo.month, 1));
  }, [todayInfo]);

  const handleCloseSelectedDetails = useCallback(() => {
    setSelectedDateISO(null);
  }, []);

  const handleOpenTasksForSelectedDate = useCallback(() => {
    if (!selectedDateISO) return;
    navigate("/tasks", {
      state: { dueFilter: { type: "date", value: selectedDateISO }, date: selectedDateISO },
    });
    setSelectedDateISO(null);
  }, [navigate, selectedDateISO]);

  return (
    <div style={styles.page}>
      <section style={styles.headerSection}>
        <h2 style={styles.title}>Shared Calendar</h2>
        <p style={styles.subtitle}>
          View all upcoming tasks and bills for your household
        </p>
      </section>

      <section style={styles.calendarCard}>
        <div style={styles.calendarHeader}>
          <div style={styles.calendarHeaderLeft}>
            <p style={styles.calendarYear}>{year}</p>
            <h3 style={styles.monthYear}>{monthNames[month]}</h3>
          </div>
          <div style={styles.calendarHeaderActions}>
            <button
              type="button"
              style={styles.navButton}
              onClick={previousMonth}
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              style={styles.navButton}
              onClick={nextMonth}
              aria-label="Next month"
            >
              ›
            </button>
            <button
              type="button"
              style={styles.todayPill}
              onClick={handleResetToToday}
            >
              Today
            </button>
          </div>
        </div>

        <div style={styles.weekdays}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} style={styles.weekday}>
              {day}
            </div>
          ))}
        </div>

        <div style={styles.daysGrid}>
          {calendarDays.map((day, index) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const today = day && isToday(day);
            const dayISO = day ? createISOFromParts(year, month, day) : null;
            const isSelectedDay = dayISO === activeDateISO;

            return (
              <div
                key={index}
                style={{
                  ...styles.dayCell,
                  ...(day ? {} : styles.emptyCell),
                  ...(today ? styles.todayCell : {}),
                  ...(isSelectedDay ? styles.selectedDayCell : {}),
                }}
                onClick={() => handleDaySelect(day)}
                role={day ? "button" : undefined}
                tabIndex={day ? 0 : -1}
                aria-pressed={isSelectedDay}
                onKeyDown={(event) => {
                  if (!day) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleDaySelect(day);
                  }
                }}
              >
                {day && (
                  <>
                    <div
                      style={{
                        ...styles.dayNumberWrapper,
                        ...(today ? styles.todayNumberWrapper : {}),
                      }}
                    >
                      <span
                        style={{
                          ...styles.dayNumber,
                          ...(today ? styles.todayNumber : {}),
                        }}
                      >
                        {day}
                      </span>
                    </div>
                    <div style={styles.eventBars}>
                      {dayEvents.length === 0 && (
                        <span style={styles.eventDotMuted} />
                      )}
                      {dayEvents.slice(0, 4).map((event) => (
                        <span
                          key={event.id}
                          style={{
                            ...styles.eventDot,
                            ...(event.type === "task"
                              ? styles.taskEventDot
                              : styles.billEventDot),
                          }}
                          title={`${event.title}${
                            event.type === "bill"
                              ? ` - $${event.amount.toFixed(2)}`
                              : ""
                          }`}
                          onClick={() => handleEventClick(event)}
                        />
                      ))}
                      {dayEvents.length > 4 && (
                        <div style={styles.moreEvents}>
                          +{dayEvents.length - 4}
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

      <section style={styles.todayCard}>
        <div style={styles.todayHeader}>
          <div>
            <p style={styles.todayLabel}>Today</p>
            <p style={styles.todayDate}>{todayDateLabel}</p>
          </div>
          {todayEvents.length > 0 && (
            <button
              type="button"
              style={styles.todayLink}
              onClick={handleShowTodayDetails}
            >
              View all
            </button>
          )}
        </div>
        <div style={styles.todayList}>
          {todayEvents.length === 0 ? (
            <p style={styles.todayEmptyText}>No deadlines or bills today.</p>
          ) : (
            todayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                style={styles.dayDetailItem}
                onClick={() => handleEventClick(event)}
              >
                <span
                  style={{
                    ...styles.dayDetailIcon,
                    ...(event.type === "task"
                      ? styles.taskIcon
                      : styles.billIcon),
                  }}
                >
                  {event.type === "task" ? "✓" : "$"}
                </span>
                <div style={styles.dayDetailText}>
                  <div style={styles.dayDetailTitleRow}>
                    <span style={styles.dayDetailTitle}>{event.title}</span>
                    <span style={styles.dayDetailType}>
                      {event.type === "task" ? "Task" : "Bill"}
                    </span>
                  </div>
                  <div style={styles.dayDetailMeta}>
                    {event.type === "task" && event.assignees?.length
                      ? `With ${event.assignees.join(", ")}`
                      : event.type === "bill" && event.amount
                      ? `$${event.amount.toFixed(2)} due`
                      : "Due today"}
                  </div>
                </div>
              </div>
            ))
          )}
          {todayEvents.length > 3 && (
            <p style={styles.todayMeta}>
              +{todayEvents.length - 3} more happening today
            </p>
          )}
        </div>
      </section>

      <section style={styles.upcomingCard}>
        <h3 style={styles.sectionTitle}>Upcoming Deadlines</h3>
        <div style={styles.upcomingList}>
          {upcomingEvents.map((event) => (
              <div
                key={event.id}
                style={styles.upcomingItem}
                onClick={() => handleEventClick(event)}
              >
                <div style={styles.upcomingLeft}>
                  <span
                    style={{
                      ...styles.upcomingIcon,
                      ...(event.type === "task"
                        ? styles.taskIcon
                        : styles.billIcon),
                    }}
                  >
                    {event.type === "task" ? "✓" : "$"}
                  </span>
                  <div>
                    <div style={styles.upcomingTitle}>{event.title}</div>
                    <div style={styles.upcomingMeta}>
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
                    ...styles.statusBadge,
                    ...(event.status === "completed" || event.status === "paid"
                      ? styles.completedBadge
                      : event.status === "in-progress"
                      ? styles.inProgressBadge
                      : styles.pendingBadge),
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
                    : "Pending"}
                </span>
              </div>
            ))}
        </div>
      </section>

      {selectedDateISO && (
        <div
          style={styles.daySheetOverlay}
          role="dialog"
          aria-modal="true"
          onClick={handleCloseSelectedDetails}
        >
          <div
            style={styles.daySheet}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={styles.daySheetHeader}>
              <div>
                <p style={styles.daySheetLabel}>{selectedDateLabel}</p>
                <p style={styles.daySheetSubtitle}>
                  {selectedEvents.length > 0
                    ? `${selectedEvents.length} ${
                        selectedEvents.length === 1 ? "deadline" : "deadlines"
                      }`
                    : "No tasks or bills scheduled"}
                </p>
              </div>
              <button
                type="button"
                style={styles.daySheetCloseButton}
                onClick={handleCloseSelectedDetails}
                aria-label="Close day details"
              >
                ×
              </button>
            </div>
            {selectedEvents.length === 0 ? (
              <p style={styles.daySheetEmpty}>
                This date is open. Tap another day to explore.
              </p>
            ) : (
              <div style={styles.daySheetList}>
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    style={styles.dayDetailItem}
                    onClick={() => handleEventClick(event)}
                  >
                    <span
                      style={{
                        ...styles.dayDetailIcon,
                        ...(event.type === "task"
                          ? styles.taskIcon
                          : styles.billIcon),
                      }}
                    >
                      {event.type === "task" ? "✓" : "$"}
                    </span>
                    <div style={styles.dayDetailText}>
                      <div style={styles.dayDetailTitleRow}>
                        <span style={styles.dayDetailTitle}>{event.title}</span>
                        <span style={styles.dayDetailType}>
                          {event.type === "task" ? "Task" : "Bill"}
                        </span>
                      </div>
                      <div style={styles.dayDetailMeta}>
                        {event.type === "task" && event.assignees?.length
                          ? `With ${event.assignees.join(", ")}`
                          : event.type === "bill" && event.amount
                          ? `$${event.amount.toFixed(2)} due`
                          : "Due this day"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={styles.daySheetActions}>
              <button
                type="button"
                style={styles.daySheetActionPrimary}
                onClick={handleOpenTasksForSelectedDate}
              >
                Open in Tasks
              </button>
              <button
                type="button"
                style={styles.daySheetActionSecondary}
                onClick={handleCloseSelectedDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function createCalendarStyles(isDarkMode) {
  const cardGradient = isDarkMode
    ? "linear-gradient(180deg, #0c111d 0%, #0b0d12 45%, #08090e 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #f4f6ff 100%)";
  const secondCardGradient = isDarkMode
    ? "linear-gradient(180deg, #090b12 0%, #070709 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%)";
  const borderTone = isDarkMode
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(37, 99, 235, 0.15)";
  const navButtonBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(74, 144, 226, 0.15)";
  const navButtonBorder = isDarkMode
    ? "1px solid rgba(255, 255, 255, 0.09)"
    : "1px solid rgba(74, 144, 226, 0.35)";
  const dayCellBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.02)"
    : "rgba(74, 144, 226, 0.08)";
  const dayCellBorder = isDarkMode
    ? "1px solid rgba(255, 255, 255, 0.04)"
    : "1px solid rgba(74, 144, 226, 0.18)";
  const emptyDotColor = isDarkMode
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(45, 47, 56, 0.18)";
  const upcomingItemBackground = isDarkMode
    ? "rgba(255, 255, 255, 0.03)"
    : "rgba(74, 144, 226, 0.08)";
  const statusPendingBg = isDarkMode
    ? "rgba(37, 99, 235, 0.16)"
    : "rgba(37, 99, 235, 0.1)";
  const statusProgressBg = isDarkMode
    ? "rgba(63, 157, 165, 0.18)"
    : "rgba(63, 157, 165, 0.12)";
  const statusCompleteBg = isDarkMode
    ? "rgba(30, 58, 138, 0.16)"
    : "rgba(30, 58, 138, 0.1)";

  return {
    page: {
      padding: "1.25rem",
      backgroundColor: "var(--habita-bg)",
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
      color: "var(--habita-text)",
    },
    headerSection: {
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
    },
    title: {
      margin: 0,
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "var(--habita-text)",
    },
    subtitle: {
      margin: 0,
      fontSize: "0.9rem",
      color: "var(--habita-muted)",
    },
    calendarCard: {
      background: cardGradient,
      borderRadius: "20px",
      border: `1px solid ${borderTone}`,
      padding: "1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      boxShadow: isDarkMode
        ? "0 18px 40px rgba(3, 5, 16, 0.45)"
        : "0 14px 30px rgba(63, 81, 181, 0.12)",
    },
    calendarHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingBottom: "0.75rem",
      borderBottom: `1px solid ${borderTone}`,
    },
    calendarHeaderLeft: {
      display: "flex",
      flexDirection: "column",
      gap: "0.2rem",
    },
    calendarHeaderActions: {
      display: "flex",
      gap: "0.4rem",
    },
    calendarYear: {
      margin: 0,
      fontSize: "0.9rem",
      textTransform: "uppercase",
      letterSpacing: "0.2rem",
      color: "var(--habita-muted)",
    },
    monthYear: {
      margin: 0,
      fontSize: "2rem",
      fontWeight: 700,
      color: "var(--habita-text)",
      letterSpacing: "-0.02em",
    },
    navButton: {
      background: navButtonBackground,
      color: "var(--habita-text)",
      border: navButtonBorder,
      borderRadius: "10px",
      width: "38px",
      height: "38px",
      fontSize: "1.35rem",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 600,
      transition: "background 0.2s ease, transform 0.1s ease",
    },
    todayPill: {
      border: "none",
      background: "var(--habita-accent)",
      color: "var(--habita-button-text)",
      borderRadius: "999px",
      padding: "0 0.9rem",
      fontWeight: 600,
      cursor: "pointer",
      height: "34px",
    },
    weekdays: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      gap: "0.35rem",
    },
    weekday: {
      textAlign: "center",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "var(--habita-muted)",
      padding: "0.35rem 0",
    },
    daysGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      gap: "0.3rem",
      gridAutoRows: "72px",
    },
    dayCell: {
      height: "72px",
      padding: "0.35rem 0.25rem",
      background: dayCellBackground,
      borderRadius: "16px",
      border: dayCellBorder,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "0.35rem",
      cursor: "pointer",
      transition: "border 0.2s ease, background 0.2s ease, transform 0.2s ease",
    },
    emptyCell: {
      opacity: 0,
      pointerEvents: "none",
    },
    todayCell: {
      border: "1.5px solid var(--habita-accent)",
      background: isDarkMode
        ? "rgba(74, 144, 226, 0.08)"
        : "rgba(74, 144, 226, 0.2)",
      boxShadow: "0 0 12px rgba(74, 144, 226, 0.35)",
    },
    selectedDayCell: {
      transform: "scale(1.02)",
      borderColor: "var(--habita-accent)",
      boxShadow: isDarkMode
        ? "0 8px 22px rgba(74, 144, 226, 0.15)"
        : "0 8px 22px rgba(74, 144, 226, 0.2)",
    },
    dayNumberWrapper: {
      width: "38px",
      height: "36px",
      borderRadius: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: isDarkMode
        ? "rgba(255, 255, 255, 0.04)"
        : "rgba(74, 144, 226, 0.12)",
      border: isDarkMode
        ? "1px solid rgba(255, 255, 255, 0.05)"
        : "1px solid rgba(74, 144, 226, 0.25)",
    },
    dayNumber: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "var(--habita-text)",
    },
    todayNumberWrapper: {
      background: "var(--habita-accent)",
      borderColor: "transparent",
      boxShadow: isDarkMode
        ? "0 5px 18px rgba(74, 144, 226, 0.45)"
        : "0 8px 24px rgba(74, 144, 226, 0.25)",
    },
    todayNumber: {
      color: "var(--habita-button-text)",
      fontWeight: 700,
    },
    eventBars: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.2rem",
      width: "100%",
      minHeight: "10px",
    },
    eventDot: {
      flex: "0 0 28px",
      height: "5px",
      borderRadius: "999px",
      cursor: "pointer",
      transition: "transform 0.1s ease",
    },
    eventDotMuted: {
      width: "16px",
      height: "3px",
      borderRadius: "999px",
      background: emptyDotColor,
    },
    taskEventDot: {
      background: "linear-gradient(90deg, #59c9cf, #38a2b2)",
    },
    billEventDot: {
      background: "linear-gradient(90deg, #7f8bff, #4a90e2)",
    },
    moreEvents: {
      fontSize: "0.65rem",
      color: "var(--habita-muted)",
      fontStyle: "italic",
    },
    todayCard: {
      background: secondCardGradient,
      borderRadius: "16px",
      border: `1px solid ${borderTone}`,
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    },
    todayHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    todayLabel: {
      margin: 0,
      fontSize: "0.85rem",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--habita-muted)",
    },
    todayDate: {
      margin: "0.15rem 0 0",
      fontSize: "1.1rem",
      fontWeight: 600,
      color: "var(--habita-text)",
    },
    todayLink: {
      border: "none",
      background: "transparent",
      color: "var(--habita-accent)",
      fontWeight: 600,
      cursor: "pointer",
    },
    todayList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.55rem",
    },
    dayDetailItem: {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      background: upcomingItemBackground,
      borderRadius: "14px",
      border: `1px solid ${borderTone}`,
      padding: "0.75rem",
      cursor: "pointer",
    },
    todayEmptyText: {
      margin: 0,
      color: "var(--habita-muted)",
      fontSize: "0.9rem",
    },
    todayMeta: {
      margin: 0,
      fontSize: "0.75rem",
      color: "var(--habita-muted)",
    },
    dayDetailIcon: {
      width: "38px",
      height: "38px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 600,
      flexShrink: 0,
    },
    dayDetailText: {
      flex: 1,
      minWidth: 0,
    },
    dayDetailTitleRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "0.5rem",
      alignItems: "center",
    },
    dayDetailTitle: {
      fontSize: "0.95rem",
      fontWeight: 600,
      color: "var(--habita-text)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    dayDetailType: {
      fontSize: "0.7rem",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "var(--habita-muted)",
      flexShrink: 0,
    },
    dayDetailMeta: {
      fontSize: "0.8rem",
      color: "var(--habita-muted)",
      marginTop: "0.2rem",
    },
    daySheetOverlay: {
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      background: "rgba(5,6,11,0.55)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      padding: "1rem",
      zIndex: 30,
    },
    daySheet: {
      width: "100%",
      maxWidth: "500px",
      background: secondCardGradient,
      borderRadius: "20px 20px 16px 16px",
      border: `1px solid ${borderTone}`,
      padding: "1rem",
      boxShadow: "0 24px 50px rgba(5,7,18,0.45)",
    },
    daySheetHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "0.6rem",
    },
    daySheetLabel: {
      margin: 0,
      fontSize: "1rem",
      fontWeight: 600,
      color: "var(--habita-text)",
    },
    daySheetSubtitle: {
      margin: "0.15rem 0 0",
      fontSize: "0.8rem",
      color: "var(--habita-muted)",
    },
    daySheetCloseButton: {
      border: "none",
      background: "rgba(255,255,255,0.08)",
      color: "var(--habita-text)",
      borderRadius: "999px",
      width: "32px",
      height: "32px",
      fontSize: "1.2rem",
      cursor: "pointer",
    },
    daySheetEmpty: {
      margin: "0.5rem 0",
      color: "var(--habita-muted)",
    },
    daySheetList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.55rem",
      margin: "0.5rem 0",
    },
    daySheetActions: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      marginTop: "0.8rem",
    },
    daySheetActionPrimary: {
      background: "var(--habita-accent)",
      color: "var(--habita-button-text)",
      border: "none",
      borderRadius: "12px",
      padding: "0.75rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    daySheetActionSecondary: {
      background: "transparent",
      color: "var(--habita-text)",
      border: `1px solid ${borderTone}`,
      borderRadius: "12px",
      padding: "0.7rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    upcomingCard: {
      background: secondCardGradient,
      borderRadius: "18px",
      border: `1px solid ${borderTone}`,
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.8rem",
      boxShadow: isDarkMode
        ? "0 18px 40px rgba(5, 7, 18, 0.55)"
        : "0 12px 28px rgba(63, 81, 181, 0.12)",
    },
    sectionTitle: {
      margin: 0,
      fontSize: "1rem",
      fontWeight: 600,
      color: "var(--habita-text)",
    },
    upcomingList: {
      display: "flex",
      flexDirection: "column",
      gap: "0.6rem",
    },
    upcomingItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "0.8rem",
      padding: "0.85rem 0.9rem",
      background: upcomingItemBackground,
      borderRadius: "12px",
      border: `1px solid ${borderTone}`,
      cursor: "pointer",
      boxShadow: isDarkMode
        ? "inset 0 0 0 1px rgba(255, 255, 255, 0.02)"
        : "0 4px 10px rgba(74, 144, 226, 0.16)",
    },
    upcomingLeft: {
      display: "flex",
      alignItems: "center",
      gap: "0.8rem",
      flex: 1,
      minWidth: 0,
    },
    upcomingIcon: {
      width: "36px",
      height: "36px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1rem",
      fontWeight: 600,
      flexShrink: 0,
    },
    taskIcon: {
      background: isDarkMode
        ? "rgba(63, 157, 165, 0.18)"
        : "rgba(63, 157, 165, 0.25)",
      color: "#3f9da5",
    },
    billIcon: {
      background: isDarkMode
        ? "rgba(74, 144, 226, 0.18)"
        : "rgba(74, 144, 226, 0.25)",
      color: "#4a90e2",
    },
    upcomingTitle: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "var(--habita-text)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    upcomingMeta: {
      fontSize: "0.75rem",
      color: "var(--habita-muted)",
      marginTop: "0.2rem",
    },
    statusBadge: {
      fontSize: "0.7rem",
      fontWeight: 600,
      padding: "0.25rem 0.6rem",
      borderRadius: "999px",
      whiteSpace: "nowrap",
      flexShrink: 0,
    },
    completedBadge: {
      backgroundColor: statusCompleteBg,
      color: "#1e3a8a",
    },
    inProgressBadge: {
      backgroundColor: statusProgressBg,
      color: "#3f9da5",
    },
    pendingBadge: {
      backgroundColor: statusPendingBg,
      color: "#2563eb",
    },
  };
}
