import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTasks } from "../context/TasksContext";

const roommates = ["Alex", "Sam", "Jordan"];
const peopleOptions = ["You", ...roommates];

const filterOptions = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
];

const statusDisplay = {
  pending: {
    label: "Pending",
    fg: "#2563eb",
    bg: "rgba(37, 99, 235, 0.16)",
  },
  "in-progress": {
    label: "In Progress",
    fg: "#3f9da5",
    bg: "rgba(63, 157, 165, 0.18)",
  },
  completed: {
    label: "Completed",
    fg: "#1e3a8a",
    bg: "rgba(30, 58, 138, 0.16)",
  },
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

export default function Tasks() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const { tasks, addTask, updateTask, toggleTaskStatus, stats } = useTasks();
  const [filter, setFilter] = useState("all");
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const createDefaultForm = useCallback(
    () => ({
      title: "",
      due: todayISO,
      assignees: ["You"],
    }),
    [todayISO]
  );
  const [form, setForm] = useState(() => createDefaultForm());
  const [editDraft, setEditDraft] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const listTopRef = useRef(null);

  useEffect(() => {
    if (!location.state) {
      return;
    }
    const { openForm, filter: targetFilter, mineOnly } = location.state;
    let shouldReplace = false;

    if (openForm) {
      setShowForm(true);
      setEditingId(null);
      setForm(createDefaultForm());
      shouldReplace = true;
    }

    if (targetFilter) {
      setFilter(targetFilter);
      shouldReplace = true;
    }

    if (typeof mineOnly === "boolean") {
      setShowMineOnly(mineOnly);
      shouldReplace = true;
    }

    if (shouldReplace) {
      navigate("/tasks", { replace: true });
    }
  }, [location.state, navigate, createDefaultForm]);

  const filteredTasks = useMemo(() => {
    const byFilter =
      filter === "all"
        ? tasks
        : tasks.filter((task) => task.status === filter);

    const mineOnly = showMineOnly
      ? byFilter.filter(
          (task) =>
            (Array.isArray(task.assignees) &&
              task.assignees.some((person) => person === "You")) ||
            task.assignees === "You"
        )
      : byFilter;

    const dueValue = (value) => {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    };

    return [...mineOnly].sort(
      (a, b) => dueValue(a.due) - dueValue(b.due)
    );
  }, [tasks, filter, showMineOnly]);

  const helperText =
    "✨ Tap the status dot to move a task from pending → in progress → completed.";

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedTitle = form.title.trim();
    if (!trimmedTitle) {
      return;
    }
    const payload = {
      title: trimmedTitle,
      due: form.due || todayISO,
      assignees: form.assignees.length ? form.assignees : ["Unassigned"],
    };
    const isEditing = Boolean(editingId);
    if (isEditing) {
      updateTask(editingId, payload);
    } else {
      addTask({ id: Date.now(), status: "pending", ...payload });
    }
    setForm(createDefaultForm());
    setEditingId(null);
    setEditDraft(null);
    setShowForm(false);
    setFilter("all");
    if (!isEditing) {
      const scrollToTop = () => {
        if (listTopRef.current?.scrollIntoView) {
          listTopRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      };
      if (
        typeof window !== "undefined" &&
        typeof window.requestAnimationFrame === "function"
      ) {
        window.requestAnimationFrame(scrollToTop);
      } else {
        scrollToTop();
      }
    }
  };

  const toggleAssignee = (name) => {
    setForm((prev) => {
      const exists = prev.assignees.includes(name);
      if (exists) {
        const next = prev.assignees.filter((item) => item !== name);
        return { ...prev, assignees: next.length ? next : [] };
      }
      return { ...prev, assignees: [...prev.assignees, name] };
    });
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setShowForm(false);
    setEditDraft({
      title: task.title,
      due: task.due && task.due.includes("-") ? task.due : todayISO,
      assignees: Array.isArray(task.assignees)
        ? task.assignees
        : [task.assignees ?? "Unassigned"],
    });
  };

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Task List</h2>
          <span style={summaryBadgeStyle}>{stats.pending} open ✨</span>
        </div>
        <button
          type="button"
          style={headerAddButtonStyle}
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(createDefaultForm());
          }}
        >
          +
        </button>
      </header>

      {showForm && (
        <section style={{ ...formSectionStyle, marginTop: "0.5rem" }}>
          <div style={formHeaderStyle}>
            <h3 style={formTitleStyle}>
              {editingId ? "Edit Task" : "Add Task"}
            </h3>
            <button
              type="button"
              style={ghostButtonStyle}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(createDefaultForm());
              }}
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} style={formStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Task name</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="e.g. Book shared laundry slot"
                style={inputStyle}
                required
              />
            </label>
            <div style={fieldRowStyle}>
              <label style={{ ...fieldStyle, flex: 1 }}>
                <span style={fieldLabelStyle}>Due date</span>
                <input
                  type="date"
                  value={form.due}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, due: event.target.value }))
                  }
                  style={inputStyle}
                />
              </label>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <span style={fieldLabelStyle}>Assigned to</span>
                <div style={assigneeChipsWrapperStyle}>
                  {peopleOptions.map((person) => {
                    const active = form.assignees.includes(person);
                    return (
                      <button
                        key={person}
                        type="button"
                        onClick={() => toggleAssignee(person)}
                        style={{
                          ...assigneeChipStyle,
                          ...(active ? assigneeChipActiveStyle : {}),
                        }}
                      >
                        {person}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <button type="submit" style={submitButtonStyle}>
              {editingId ? "Update Task" : "Save Task"}
            </button>
          </form>
        </section>
      )}

      <section style={filtersSectionStyle}>
        <div style={filterChipRowStyle}>
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              style={{
                ...filterChipStyle,
                ...(filter === option.id ? filterChipActiveStyle : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label style={mineToggleStyle}>
          <input
            type="checkbox"
            checked={showMineOnly}
            onChange={(event) => setShowMineOnly(event.target.checked)}
            style={mineToggleInputStyle}
          />
          <span
            style={{
              ...mineToggleTrackStyle,
              background: showMineOnly
                ? "var(--habita-accent)"
                : "var(--habita-border)",
            }}
          >
            <span
              style={{
                ...mineToggleKnobStyle,
                background: showMineOnly
                  ? "var(--habita-button-text)"
                  : "var(--habita-card)",
                transform: showMineOnly ? "translateX(18px)" : "translateX(0)",
              }}
            />
          </span>
          <span
            style={{
              ...mineToggleLabelStyle,
              color: showMineOnly
                ? "var(--habita-accent)"
                : "var(--habita-muted)",
            }}
          >
            Only My Tasks
          </span>
        </label>
      </section>

      <section style={listSectionStyle} ref={listTopRef}>
        <p style={helperTextStyle}>{helperText}</p>

        {filteredTasks.length === 0 ? (
          <p style={emptyStateStyle}>No tasks in this view.</p>
        ) : (
          filteredTasks.map((task) => (
            <article key={task.id} style={taskCardStyle}>
              <div style={taskCardRowStyle}>
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(task.id)}
                  style={{
                    ...statusToggleStyle,
                    ...(task.status === "completed"
                      ? statusToggleCompletedStyle
                      : {}),
                  }}
                  aria-label="Toggle task status"
                >
                  {task.status === "completed" ? "✓" : ""}
                </button>
                <div style={taskContentStyle}>
                  <h3 style={taskTitleStyle}>{task.title}</h3>
                  <div style={taskMetaStyle}>
                    <span>Due: {formatDueLabel(task.due)}</span>
                    <span>
                      Assigned: {Array.isArray(task.assignees)
                        ? task.assignees.join(", ")
                        : task.assignees}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    ...statusPillStyle,
                    color: statusDisplay[task.status].fg,
                    backgroundColor: statusDisplay[task.status].bg,
                  }}
                >
                  {statusDisplay[task.status].label}
                </span>
                <button
                  type="button"
                  style={editButtonStyle}
                  onClick={() => handleEdit(task)}
                >
                  Edit
                </button>
              </div>
              {editingId === task.id && editDraft && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const trimmedTitle = editDraft.title.trim();
                    if (!trimmedTitle) return;
                    updateTask(task.id, {
                      title: trimmedTitle,
                      due: editDraft.due || todayISO,
                      assignees: editDraft.assignees.length
                        ? editDraft.assignees
                        : ["Unassigned"],
                    });
                    setEditingId(null);
                    setEditDraft(null);
                  }}
                  style={inlineFormStyle}
                >
                  <label style={inlineFieldStyle}>
                    <span style={inlineLabelStyle}>Task name</span>
                    <input
                      type="text"
                      value={editDraft.title}
                      onChange={(event) =>
                        setEditDraft((prev) => ({
                          ...prev,
                          title: event.target.value,
                        }))
                      }
                      style={inputStyle}
                      required
                    />
                  </label>
                  <div style={inlineRowStyle}>
                    <label style={{ ...inlineFieldStyle, flex: 1 }}>
                      <span style={inlineLabelStyle}>Due date</span>
                      <input
                        type="date"
                        value={editDraft.due}
                        onChange={(event) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            due: event.target.value,
                          }))
                        }
                        style={inputStyle}
                      />
                    </label>
                    <div style={{ ...inlineFieldStyle, flex: 1 }}>
                      <span style={inlineLabelStyle}>Assigned to</span>
                      <div style={assigneeChipsWrapperStyle}>
                        {peopleOptions.map((person) => {
                          const active = editDraft.assignees.includes(person);
                          return (
                            <button
                              key={person}
                              type="button"
                              onClick={() =>
                                setEditDraft((prev) => {
                                  const exists = prev.assignees.includes(
                                    person
                                  );
                                  if (exists) {
                                    const next = prev.assignees.filter(
                                      (item) => item !== person
                                    );
                                    return {
                                      ...prev,
                                      assignees: next.length ? next : [],
                                    };
                                  }
                                  return {
                                    ...prev,
                                    assignees: [...prev.assignees, person],
                                  };
                                })
                              }
                              style={{
                                ...assigneeChipStyle,
                                ...(active ? assigneeChipActiveStyle : {}),
                              }}
                            >
                              {person}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={inlineButtonRowStyle}>
                    <button
                      type="button"
                      style={ghostButtonStyle}
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" style={submitButtonStyle}>
                      Update
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))
        )}
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

const summaryBadgeStyle = {
  display: "inline-block",
  marginTop: "0.4rem",
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderRadius: "999px",
  padding: "0.3rem 0.7rem",
  fontSize: "0.75rem",
  fontWeight: 600,
};

const headerAddButtonStyle = {
  border: "none",
  borderRadius: "999px",
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  width: "38px",
  height: "38px",
  fontSize: "1.4rem",
  cursor: "pointer",
  boxShadow: "var(--habita-shadow)",
};

const filtersSectionStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const filterChipRowStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const filterChipStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "999px",
  background: "var(--habita-chip)",
  fontSize: "0.8rem",
  padding: "0.35rem 0.9rem",
  cursor: "pointer",
  color: "var(--habita-muted)",
};

const filterChipActiveStyle = {
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderColor: "var(--habita-accent)",
  boxShadow: "0 2px 10px rgba(74,144,226,0.35)",
};

const mineToggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  fontWeight: 600,
};

const mineToggleInputStyle = {
  opacity: 0,
  width: 0,
  height: 0,
  position: "absolute",
};

const mineToggleTrackStyle = {
  position: "relative",
  width: "38px",
  height: "20px",
  borderRadius: "999px",
  background: "var(--habita-border)",
  transition: "background-color 0.2s ease",
  display: "inline-flex",
  alignItems: "center",
};

const mineToggleKnobStyle = {
  position: "absolute",
  left: "2px",
  width: "16px",
  height: "16px",
  borderRadius: "50%",
  background: "var(--habita-card)",
  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
  transition: "transform 0.2s ease",
};

const mineToggleLabelStyle = {
  color: "var(--habita-muted)",
};

const listSectionStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const helperTextStyle = {
  margin: 0,
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  paddingLeft: "0.4rem",
};

const emptyStateStyle = {
  margin: 0,
  padding: "1.5rem",
  textAlign: "center",
  fontSize: "0.9rem",
  color: "var(--habita-muted)",
  backgroundColor: "var(--habita-card)",
  borderRadius: "12px",
  boxShadow: "var(--habita-shadow)",
};

const taskCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  padding: "0.9rem 1rem",
  display: "flex",
  flexDirection: "column",
  boxShadow: "var(--habita-shadow)",
};

const taskCardRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.8rem",
};

const statusToggleStyle = {
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  border: "1.5px solid var(--habita-accent)",
  background: "var(--habita-card)",
  color: "white",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const statusToggleCompletedStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
};

const taskContentStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const taskTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  color: "var(--habita-text)",
};

const taskMetaStyle = {
  display: "flex",
  gap: "0.9rem",
  flexWrap: "wrap",
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const statusPillStyle = {
  borderRadius: "999px",
  fontSize: "0.7rem",
  fontWeight: 600,
  padding: "0.25rem 0.6rem",
};

const editButtonStyle = {
  border: "none",
  background: "transparent",
  color: "var(--habita-accent)",
  fontSize: "0.75rem",
  fontWeight: 600,
  cursor: "pointer",
};

const formSectionStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
  boxShadow: "var(--habita-shadow)",
};

const formHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const formTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  color: "var(--habita-text)",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const fieldRowStyle = {
  display: "flex",
  gap: "0.8rem",
  flexWrap: "wrap",
};

const fieldLabelStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  fontWeight: 600,
};

const inputStyle = {
  borderRadius: "8px",
  border: "1px solid var(--habita-border)",
  padding: "0.55rem 0.7rem",
  fontSize: "0.9rem",
  outline: "none",
  background: "var(--habita-input)",
  color: "var(--habita-text)",
};

const assigneeChipsWrapperStyle = {
  display: "flex",
  gap: "0.45rem",
  flexWrap: "wrap",
};

const assigneeChipStyle = {
  border: "1px solid var(--habita-border)",
  borderRadius: "999px",
  padding: "0.35rem 0.8rem",
  fontSize: "0.75rem",
  cursor: "pointer",
  background: "var(--habita-card)",
  color: "var(--habita-muted)",
};

const assigneeChipActiveStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderColor: "var(--habita-accent)",
  boxShadow: "0 2px 8px rgba(74,144,226,0.3)",
};

const submitButtonStyle = {
  alignSelf: "flex-end",
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  border: "none",
  borderRadius: "999px",
  padding: "0.55rem 1.2rem",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
};

const ghostButtonStyle = {
  background: "transparent",
  border: "none",
  color: "var(--habita-accent)",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.85rem",
};

const inlineFormStyle = {
  marginTop: "0.9rem",
  paddingTop: "0.9rem",
  borderTop: "1px solid var(--habita-border)",
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
};

const inlineFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

const inlineLabelStyle = {
  fontSize: "0.75rem",
  color: "var(--habita-muted)",
  fontWeight: 600,
};

const inlineRowStyle = {
  display: "flex",
  gap: "0.8rem",
  flexWrap: "wrap",
};

const inlineButtonRowStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.6rem",
};
