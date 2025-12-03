const express = require("express")
const router = express.Router()
const passport = require("passport")
const { tasksStore } = require("../services/tasksStore")

// Require authentication via JWT
const requireAuth = passport.authenticate("jwt", { session: false })

// List tasks
router.get("/", requireAuth, async (req, res) => {
  try {
    const tasks = await tasksStore.list(req.user.id)
    res.json({ data: tasks })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const stats = await tasksStore.getStats(req.user.id)
    res.json({ data: stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get one
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const task = await tasksStore.get(req.user.id, req.params.id)
    if (!task) return res.status(404).json({ error: "Task not found" })
    res.json({ data: task })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create
router.post("/", requireAuth, async (req, res) => {
  try {
    const created = await tasksStore.create(req.user.id, req.body || {})
    res.status(201).json({ data: created })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const updated = await tasksStore.update(req.user.id, req.params.id, req.body || {})
    if (!updated) return res.status(404).json({ error: "Task not found" })
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update status
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const updated = await tasksStore.updateStatus(req.user.id, req.params.id, req.body?.status)
    if (!updated) return res.status(404).json({ error: "Task not found" })
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Cycle status
router.patch("/:id/cycle", requireAuth, async (req, res) => {
  try {
    const updated = await tasksStore.cycleStatus(req.user.id, req.params.id)
    if (!updated) return res.status(404).json({ error: "Task not found" })
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await tasksStore.delete(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: "Task not found" })
    res.json({ data: deleted })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
