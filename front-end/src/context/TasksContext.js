import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "habita:tasks";

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const normalizeTask = (task, fallbackId) => {
  const normalizedAssignees = Array.isArray(task.assignees)
    ? task.assignees
    : task.assignee
    ? [task.assignee]
    : ["Unassigned"];
  const validStatuses = ["pending", "in-progress", "completed"];
  return {
    id: task.id ?? fallbackId ?? Date.now(),
    title: task.title ?? "Untitled task",
    due: task.due ?? addDays(0),
    assignees: normalizedAssignees,
    status: validStatuses.includes(task.status) ? task.status : "pending",
  };
};

const defaultTasks = [
  {
    title: "Take Out Trash",
    due: addDays(0),
    assignees: ["You"],
    status: "pending",
  },
  {
    title: "Clean Bathroom",
    due: addDays(2),
    assignees: ["Sam"],
    status: "in-progress",
  },
  {
    title: "Pay Electricity Bill",
    due: addDays(5),
    assignees: ["Alex"],
    status: "completed",
  },
  {
    title: "Restock Paper Towels",
    due: addDays(1),
    assignees: ["Jordan"],
    status: "pending",
  },
].map((task, index) => normalizeTask(task, index + 1));

const TasksContext = createContext(null);

const cycleStatus = (status) => {
  if (status === "pending") return "in-progress";
  if (status === "in-progress") return "completed";
  return "pending";
};

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(() => {
    if (typeof window === "undefined") {
      return defaultTasks;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((task, index) => normalizeTask(task, index + 1));
        }
      }
    } catch (error) {
      // ignore storage issues and fall back to defaults
    }
    return defaultTasks;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = (task) => {
    const next = normalizeTask({ status: "pending", ...task });
    setTasks((prev) => [next, ...prev]);
  };

  const updateTask = (taskId, updates) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  };

  const toggleTaskStatus = (taskId) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: cycleStatus(task.status) } : task
      )
    );
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pending = tasks.filter((task) => task.status !== "completed").length;
    const mine = tasks.filter((task) => {
      if (task.status === "completed") return false;
      if (Array.isArray(task.assignees)) {
        return task.assignees.includes("You");
      }
      return task.assignees === "You";
    }).length;
    return { total, completed, pending, mine };
  }, [tasks]);

  return (
    <TasksContext.Provider
      value={{ tasks, addTask, updateTask, toggleTaskStatus, stats }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
