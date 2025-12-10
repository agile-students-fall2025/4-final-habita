const express = require("express")
const router = express.Router()
const { billsStore } = require("../services/billsStore")
const passport = require("passport")

// Middleware to require authentication
const requireAuth = passport.authenticate("jwt", { session: false })

// Get all bills for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const bills = await billsStore.list(req.user.id)
    res.json({ data: bills })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get stats for the authenticated user
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const stats = await billsStore.getStats(req.user.id)
    res.json({ data: stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get a specific bill
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const bill = await billsStore.get(req.user.id, req.params.id)
    if (!bill) return res.status(404).json({ error: "Bill not found" })
    res.json({ data: bill })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create a new bill
router.post("/", requireAuth, async (req, res) => {
  try {
    const created = await billsStore.create(req.user.id, req.body || {})
    res.status(201).json({ data: created })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update a bill
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const updated = await billsStore.update(req.user.id, req.params.id, req.body || {})
    if (!updated) return res.status(404).json({ error: "Bill not found" })
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Toggle payment status for a person
router.patch("/:id/pay", requireAuth, async (req, res) => {
  try {
    const updated = await billsStore.togglePayment(req.user.id, req.params.id, req.body?.person)
    if (!updated) return res.status(404).json({ error: "Bill not found" })
    res.json({ data: updated })
  } catch (error) {
    console.error('Error in PATCH /api/bills/:id/pay', { error: error.stack || error, params: req.params, body: req.body })
    res.status(500).json({ error: error.message })
  }
})

// Update bill status (paid/unpaid)
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const updated = await billsStore.updateStatus(req.user.id, req.params.id, req.body?.status)
    if (!updated) return res.status(404).json({ error: "Bill not found" })
    res.json({ data: updated })
  } catch (error) {
    console.error('Error in PATCH /api/bills/:id/status', { error: error.stack || error, params: req.params, body: req.body })
    res.status(500).json({ error: error.message })
  }
})

// Delete a bill
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await billsStore.delete(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: "Bill not found" })
    res.json({ data: deleted })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router