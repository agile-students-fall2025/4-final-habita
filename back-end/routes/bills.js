const express = require("express")
const router = express.Router()
const { billsStore } = require("../services/billsStore")

router.get("/", (req, res) => {
  res.json({ data: billsStore.list() })
})

router.get("/:id", (req, res) => {
  const bill = billsStore.get(req.params.id)
  if (!bill) return res.status(404).json({ error: "Bill not found" })
  res.json({ data: bill })
})

router.post("/", (req, res) => {
  const created = billsStore.create(req.body || {})
  res.status(201).json({ data: created })
})

router.patch("/:id", (req, res) => {
  const updated = billsStore.update(req.params.id, req.body || {})
  if (!updated) return res.status(404).json({ error: "Bill not found" })
  res.json({ data: updated })
})

router.patch("/:id/pay", (req, res) => {
  const updated = billsStore.togglePayment(req.params.id, req.body && req.body.person)
  if (!updated) return res.status(404).json({ error: "Bill not found" })
  res.json({ data: updated })
})

module.exports = router
