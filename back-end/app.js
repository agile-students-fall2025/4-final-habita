// back-end/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { bills, tasks, chats } from "./data/mockData.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// --- HEALTH CHECK ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", at: new Date().toISOString() });
});

// --- BILLS ROUTES ---
app.get("/api/bills", (req, res) => res.json(bills));

app.get("/api/bills/:id", (req, res) => {
  const bill = bills.find((b) => b.id === req.params.id);
  bill ? res.json(bill) : res.status(404).json({ error: "Bill not found" });
});

app.post("/api/bills", (req, res) => {
  const newBill = { id: "b" + (bills.length + 1), ...req.body };
  bills.push(newBill);
  res.status(201).json(newBill);
});

// --- TASKS ROUTES ---
app.get("/api/tasks", (req, res) => res.json(tasks));

app.patch("/api/tasks/:id/complete", (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.completed = !task.completed;
  res.json(task);
});

// --- CHATS ROUTES ---
app.get("/api/chats/general", (req, res) => {
  res.json(chats.filter((c) => c.contextType === "house"));
});

app.get("/api/chats/:contextType/:contextId", (req, res) => {
  const { contextType, contextId } = req.params;
  const filtered = chats.filter(
    (c) => c.contextType === contextType && (!contextId || c.contextId === contextId)
  );
  res.json(filtered);
});

app.get("/api/chats/:contextType", (req, res) => {
  const { contextType } = req.params;
  const filtered = chats.filter((c) => c.contextType === contextType);
  res.json(filtered);
});


app.post("/api/chats", (req, res) => {
  const { contextType, contextId, sender, text } = req.body;
  if (!contextType || !sender || !text)
    return res.status(400).json({ error: "Missing fields" });
  const msg = {
    id: "c" + (chats.length + 1),
    contextType,
    contextId,
    sender,
    text,
    timestamp: new Date().toISOString(),
  };
  chats.push(msg);
  res.status(201).json(msg);
});

export default app;
