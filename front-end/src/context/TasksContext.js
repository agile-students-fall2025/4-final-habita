import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const normalizeRepeat = (value) => {
  if (!value) return { type: "none", interval: 1, unit: "weeks" };
  if (typeof value === "string") return { type: value, interval: 1, unit: "weeks" };
  return {
    type: value.type || "none",
    interval:
      typeof value.interval === "number" && value.interval > 0 ? value.interval : 1,
    unit: value.unit || "weeks",
  };
};

const normalizeTask = (task, fallbackId) => {
  const normalizedAssignees = Array.isArray(task.assignees)
    ? task.assignees
    : task.assignee
    ? [task.assignee]
    : ["Unassigned"];
  const validStatuses = ["pending", "in-progress", "completed"];
  const id = task._id || task.id || fallbackId || String(Date.now());
  return {
    id,
    title: task.title ?? "Untitled task",
    due: task.due ?? new Date().toISOString().slice(0, 10),
    assignees: normalizedAssignees,
    status: validStatuses.includes(task.status) ? task.status : "pending",
    repeat: normalizeRepeat(task.repeat),
  };
};

const TasksContext = createContext(null);

const getCurrentUserName = () => {
  try {
    const stored = localStorage.getItem("habita:auth:user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.name || parsed.username || "";
    }
  } catch (_err) {
    /* ignore */
  }
  return "";
};

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("habita:auth:token");
  };

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        if (!token) {
          setTasks([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        setTasks(list.map((t, i) => normalizeTask(t, i + 1)));
        setError(null);
      } catch (err) {
        setError(err.message);
        setTasks([]);
        // eslint-disable-next-line no-console
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTask = async (task) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");
      const payload = {
        title: task.title,
        due: task.due,
        assignees: Array.isArray(task.assignees) ? task.assignees : ["Unassigned"],
        status: task.status || "pending",
        repeat: normalizeRepeat(task.repeat),
      };
      const res = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const data = await res.json();
      const created = normalizeTask(data.data);
      setTasks((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error("Error adding task:", err);
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");
      const body = { ...updates };
      if (updates?.repeat) body.repeat = normalizeRepeat(updates.repeat);
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const data = await res.json();
      const updated = normalizeTask(data.data);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      return updated;
    } catch (err) {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error("Error updating task:", err);
      throw err;
    }
  };

  const toggleTaskStatus = async (taskId) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_URL}/tasks/${taskId}/cycle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to toggle task status");
      const data = await res.json();
      const updated = normalizeTask(data.data);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      return updated;
    } catch (err) {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error("Error toggling task status:", err);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err.message);
      // eslint-disable-next-line no-console
      console.error("Error deleting task:", err);
      throw err;
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pending = tasks.filter((task) => task.status !== "completed").length;
    const me = getCurrentUserName();
    const mine = tasks.filter((task) => {
      if (task.status === "completed") return false;
      if (Array.isArray(task.assignees)) return task.assignees.includes(me);
      return task.assignees === me;
    }).length;
    return { total, completed, pending, mine };
  }, [tasks]);

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, toggleTaskStatus, deleteTask, stats, loading, error }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks must be used within a TasksProvider");
  return context;
}
