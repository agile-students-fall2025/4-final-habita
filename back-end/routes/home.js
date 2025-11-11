const express = require("express")
const router = express.Router()
const { homeStore } = require("../services/homeStore")

router.get("/summary", (req, res) => {
  const user = req.query.user || "You"
  const summary = homeStore.getSummary(user)
  res.json({ data: summary })
})

module.exports = router
