const express = require("express")
const router = express.Router()
const passport = require("passport")
const Task = require("../models/Task")

// Require authentication via JWT
const requireAuth = passport.authenticate("jwt", { session: false })

// ============================
// LIST TASKS (HOUSEHOLD SCOPE)
// ============================
router.get("/", requireAuth, async (req, res) => {
  try {
    const householdId = req.user.householdId

    const tasks = await Task.find({ householdId }).sort({ createdAt: -1 })
    res.json({ data: tasks })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =================
// LOAD SINGLE TASK
// =================
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const householdId = req.user.householdId

    const task = await Task.findOne({
      _id: req.params.id,
      householdId,
    })

    if (!task) return res.status(404).json({ error: "Task not found" })

    res.json({ data: task })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =================
// CREATE TASK
// =================
router.post("/", requireAuth, async (req, res) => {
  try {
    const householdId = req.user.householdId

    const newTask = await Task.create({
      ...req.body,
      householdId,
      createdBy: req.user.id,
    })

    res.status(201).json({ data: newTask })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =================
// UPDATE TASK
// =================
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const householdId = req.user.householdId

    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, householdId },
      req.body,
      { new: true }
    )

    if (!updated) return res.status(404).json({ error: "Task not found" })

    res.json({ data: updated })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =========================
// UPDATE STATUS DIRECTLY
// =========================
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const householdId = req.user.householdId

    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, householdId },
      { status: req.body.status },
      { new: true }
    )

    if (!updated) return res.status(404).json({ error: "Task not found" })

    res.json({ data: updated })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =====================
// CYCLE TASK STATUS
// =====================
router.patch("/:id/cycle", requireAuth, async (req, res) => {
  try {
    const householdId = req.user.householdId

    const task = await Task.findOne({
      _id: req.params.id,
      householdId,
    })

    if (!task) return res.status(404).json({ error: "Task not found" })

    const sequence = ["pending", "in-progress", "completed"]
    const idx = sequence.indexOf(task.status)
    task.status = sequence[(idx + 1) % sequence.length]

    await task.save()

    res.json({ data: task })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// =================
// DELETE TASK
// =================
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const householdId = req.user.householdId

    const deleted = await Task.findOneAndDelete({
      _id: req.params.id,
      householdId,
    })

    if (!deleted) return res.status(404).json({ error: "Task not found" })

    res.json({ data: deleted })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
