import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import ChatThread from "../components/ChatThread";


const roommates = ["Alex", "Sam", "Jordan"];
const peopleOptions = ["You", ...roommates];

const repeatOptions = [
  { id: "none", label: "Never" },
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Biweekly" },
  { id: "monthly", label: "Monthly" },
  { id: "every-3-months", label: "Every 3 Months" },
  { id: "every-6-months", label: "Every 6 Months" },
  { id: "yearly", label: "Yearly" },
  { id: "custom", label: "Custom" },
];

const repeatUnitOptions = [
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" },
  { id: "years", label: "Years" },
];


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

const ensureRepeat = (value) => {
  if (!value) return { type: "none", interval: 1, unit: "weeks" };
  if (typeof value === "string") return { type: value, interval: 1, unit: "weeks" };
  return {
    type: value.type || "none",
    interval:
      typeof value.interval === "number" && value.interval > 0 ? value.interval : 1,
    unit: value.unit || "weeks",
  };
};

const formatRepeatLabel = (repeat) => {
  if (!repeat || repeat.type === "none") return null;
  if (repeat.type === "custom") {
    const interval = repeat.interval || 1;
    const unit = repeat.unit || "weeks";
    const unitLabel = interval === 1 ? unit.replace(/s$/, "") : unit;
    return `Repeats every ${interval} ${unitLabel}`;
  }
  const preset = repeatOptions.find((option) => option.id === repeat.type);
  return preset ? preset.label : "Repeats";
};

export default function Tasks() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const { tasks, addTask, updateTask, toggleTaskStatus, stats } = useTasks();
  const [filter, setFilter] = useState("all");
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dueFilter, setDueFilter] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);
  const createDefaultForm = useCallback(
    () => ({
      title: "",
      due: todayISO,
      assignees: ["You"],
      repeat: ensureRepeat(),
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
    const {
      openForm,
      filter: targetFilter,
      mineOnly,
      dueFilter: targetDueFilter,
      date: targetDate,
      openChatForTaskId,
    } = location.state;
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

    if (targetDueFilter || targetDate) {
      if (targetDueFilter === "date" && targetDate) {
        setDueFilter({ type: "date", value: targetDate.slice(0, 10) });
      } else if (targetDueFilter) {
        setDueFilter(targetDueFilter);
      } else if (targetDate) {
        setDueFilter({ type: "date", value: targetDate.slice(0, 10) });
      }
      shouldReplace = true;
    }

    if (openChatForTaskId) {
      const targetId = `task-card-${openChatForTaskId}`;
      const scrollToTarget = () => {
        const el = document.getElementById(targetId);
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      window.requestAnimationFrame(scrollToTarget);
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

    const mineOnlyList = showMineOnly
      ? byFilter.filter(
          (task) =>
            (Array.isArray(task.assignees) &&
              task.assignees.some((person) => person === "You")) ||
            task.assignees === "You"
        )
      : byFilter;

    const applyDueFilter = (list) => {
      if (!dueFilter) {
        return list;
      }
      if (typeof dueFilter === "object" && dueFilter.type === "date") {
        const target = dueFilter.value.slice(0, 10);
        return list.filter((task) =>
          typeof task?.due === "string" && task.due.slice(0, 10) === target
        );
      }
      if (dueFilter === "due-today") {
        return list.filter(
          (task) =>
            typeof task?.due === "string" && task.due.slice(0, 10) === todayISO
        );
      }
      if (dueFilter === "overdue") {
        const todayValue = Date.parse(todayISO);
        return list.filter((task) => {
          const parsed = Date.parse(task.due);
          return !Number.isNaN(parsed) && parsed < todayValue;
        });
      }
      return list;
    };

    const withDueApplied = applyDueFilter(mineOnlyList);

    const dueValue = (value) => {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    };

    return [...withDueApplied].sort(
      (a, b) => dueValue(a.due) - dueValue(b.due)
    );
  }, [tasks, filter, showMineOnly, dueFilter, todayISO]);

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
      repeat: ensureRepeat(form.repeat),
    };
    const createdTaskId = Date.now();
    const isEditing = Boolean(editingId);
    if (isEditing) {
      updateTask(editingId, payload);
    } else {
      addTask({ id: createdTaskId, status: "pending", ...payload });
    }
    setForm(createDefaultForm());
    setEditingId(null);
    setEditDraft(null);
    setShowForm(false);
    setFilter("all");
    setDueFilter(null);
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
      repeat: ensureRepeat(task.repeat),
    });
  };

  return (
    <div style={pageStyle}>
      <section style={headerStyle}>
        <div style={headerTextStyle}>
          <h2 style={titleStyle}>Tasks</h2>
          <p style={headerSubtitleStyle}>
            {stats.pending} active ・ {stats.completed} completed
          </p>
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
      </section>

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
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Repeat</span>
              <select
                value={form.repeat.type}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    repeat:
                      nextType === "custom"
                        ? {
                            type: "custom",
                            interval: prev.repeat.interval || 1,
                            unit: prev.repeat.unit || "weeks",
                          }
                        : { type: nextType, interval: 1, unit: "weeks" },
                  }));
                }}
                style={selectStyle}
              >
                {repeatOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.repeat.type === "custom" && (
                <div style={customRepeatRowStyle}>
                  <label style={customRepeatFieldStyle}>
                    <span style={fieldLabelStyle}>Every</span>
                    <input
                      type="number"
                      min="1"
                      value={form.repeat.interval}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          repeat: {
                            ...prev.repeat,
                            interval: Math.max(1, Number(event.target.value) || 1),
                          },
                        }))
                      }
                      style={customRepeatInputStyle}
                    />
                  </label>
                  <label style={customRepeatFieldStyle}>
                    <span style={fieldLabelStyle}>Unit</span>
                    <select
                      value={form.repeat.unit}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          repeat: { ...prev.repeat, unit: event.target.value },
                        }))
                      }
                      style={selectStyle}
                    >
                      {repeatUnitOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </label>
            <button type="submit" style={submitButtonStyle}>
              {editingId ? "Update Task" : "Save Task"}
            </button>
          </form>
        </section>
      )}

      <section style={filtersSectionStyle}>
        <div style={filterChipRowStyle}>
          {filterOptions.map((option) => {
            const isActive = filter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={(event) => {
                  setFilter(option.id);
                  setDueFilter(null);
                  event.currentTarget.blur();
                }}
                style={{
                  ...filterChipStyle,
                  backgroundColor: isActive
                    ? "rgba(74,144,226,0.18)"
                    : "var(--habita-chip)",
                  color: isActive ? "var(--habita-accent)" : "var(--habita-muted)",
                  borderColor: isActive
                    ? "var(--habita-accent)"
                    : "var(--habita-border)",
                  fontWeight: isActive ? 700 : 600,
                }}
              >
                {option.label}
              </button>
            );
          })}
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
          filteredTasks.map((task) => {
            const repeatLabel = formatRepeatLabel(task.repeat)
            return (
              <article id={`task-card-${task.id}`} key={task.id} style={taskCardStyle}>
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
                    {repeatLabel && (
                      <span style={repeatBadgeStyle}>
                        {repeatLabel}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    ...statusPillStyle,
                    color: statusDisplay[task.status]?.fg ?? "var(--habita-text)",
                    backgroundColor: statusDisplay[task.status]?.bg ?? "rgba(0,0,0,0.04)",
                  }}
                >
                  {statusDisplay[task.status]?.label ?? task.status ?? "Unknown"}
                </span>
                <button
                  type="button"
                  style={{ ...editButtonStyle, color: "var(--habita-accent)" }}
                  onClick={() => setChatOpen(task.id)}
                >
                  Chat 💬
                </button>
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
                      repeat: ensureRepeat(editDraft.repeat),
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
                <label style={inlineFieldStyle}>
                  <span style={inlineLabelStyle}>Repeat</span>
                  <select
                    value={editDraft.repeat?.type || "none"}
                    onChange={(event) => {
                      const nextType = event.target.value
                      setEditDraft((prev) => ({
                        ...prev,
                        repeat:
                          nextType === "custom"
                            ? {
                                type: "custom",
                                interval: prev.repeat?.interval || 1,
                                unit: prev.repeat?.unit || "weeks",
                              }
                            : { type: nextType, interval: 1, unit: "weeks" },
                      }))
                    }}
                    style={selectStyle}
                  >
                    {repeatOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {editDraft.repeat?.type === "custom" && (
                    <div style={customRepeatRowStyle}>
                      <label style={customRepeatFieldStyle}>
                        <span style={fieldLabelStyle}>Every</span>
                        <input
                          type="number"
                          min="1"
                          value={editDraft.repeat.interval}
                          onChange={(event) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              repeat: {
                                ...prev.repeat,
                                interval: Math.max(
                                  1,
                                  Number(event.target.value) || 1
                                ),
                              },
                            }))
                          }
                          style={customRepeatInputStyle}
                        />
                      </label>
                      <label style={customRepeatFieldStyle}>
                        <span style={fieldLabelStyle}>Unit</span>
                        <select
                          value={editDraft.repeat.unit}
                          onChange={(event) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              repeat: {
                                ...prev.repeat,
                                unit: event.target.value,
                              },
                            }))
                          }
                          style={selectStyle}
                        >
                          {repeatUnitOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  )}
                </label>
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
            )
          })
        )}
      </section>

      {chatOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999,
        }}>
          <div style={{
            background: "var(--habita-bg)",
            borderRadius: "16px",
            padding: "1rem",
            width: "90%",
            maxWidth: "480px",
            height: "70%",
            display: "flex",
            flexDirection: "column",
          }}>
            <button
              onClick={() => setChatOpen(null)}
              style={{ alignSelf: "flex-end", border: "none", background: "transparent", fontSize: "1.5rem", cursor: "pointer" }}
            >
              ✕
            </button>
            <ChatThread
              contextType="task"
              contextId={chatOpen}
              title={`Task Chat: ${tasks.find(t => t.id === chatOpen)?.title}`}
              participants={["Alex", "Sam", "Jordan", "You"]}
              onAfterSend={(threadId) => {
                setChatOpen(null);
                navigate("/chat", { state: { openThreadId: threadId } });
              }}
            />

          </div>
        </div>
      )}

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
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--habita-card)",
  padding: "1rem 1.25rem",
  borderRadius: "16px",
  border: "1px solid rgba(74,144,226,0.25)",
};

const headerTextStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.2rem",
};

const titleStyle = {
  margin: 0,
  fontSize: "1.25rem",
  fontWeight: 600,
  color: "var(--habita-text)",
};

const headerSubtitleStyle = {
  margin: 0,
  fontSize: "0.8rem",
  color: "var(--habita-muted)",
};

const headerAddButtonStyle = {
  border: "none",
  backgroundColor: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  fontSize: "1.5rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "transform 0.2s ease",
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
  fontWeight: 600,
  transition: "all 0.2s ease",
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
  margin: "0",
  padding: "1.2rem 0",
  textAlign: "center",
  fontSize: "0.85rem",
  color: "var(--habita-muted)",
};

const taskCardStyle = {
  background: "var(--habita-card)",
  borderRadius: "12px",
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "0.9rem 1rem",
  display: "flex",
  flexDirection: "column",
};

const taskCardRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.8rem",
};

const statusToggleStyle = {
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  border: "1.5px solid var(--habita-accent)",
  background: "var(--habita-card)",
  color: "var(--habita-accent)",
  fontWeight: 600,
  fontSize: "0.75rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const statusToggleCompletedStyle = {
  background: "var(--habita-accent)",
  color: "var(--habita-button-text)",
  borderColor: "var(--habita-accent)",
  fontSize: "0.8rem",
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

const repeatBadgeStyle = {
  padding: "0.15rem 0.45rem",
  borderRadius: "999px",
  background: "rgba(74,144,226,0.18)",
  color: "var(--habita-accent)",
  fontSize: "0.72rem",
  fontWeight: 600,
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
  border: "1px solid rgba(74,144,226,0.25)",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
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

const selectStyle = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: "linear-gradient(45deg, transparent 50%, var(--habita-accent) 50%), linear-gradient(135deg, var(--habita-accent) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 12px) calc(50% - 2px), calc(100% - 7px) calc(50% - 2px)",
  backgroundSize: "5px 5px, 5px 5px",
  backgroundRepeat: "no-repeat",
  paddingRight: "1.8rem",
  cursor: "pointer",
};

const customRepeatRowStyle = {
  display: "flex",
  gap: "0.6rem",
  marginTop: "0.5rem",
  flexWrap: "wrap",
};

const customRepeatFieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
  minWidth: "120px",
  flex: 1,
};

const customRepeatInputStyle = {
  ...inputStyle,
  width: "100%",
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
