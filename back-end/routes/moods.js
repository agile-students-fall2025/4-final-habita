const express = require("express")
const { body, validationResult } = require("express-validator")
const MoodEntry = require("../models/MoodEntry")

const router = express.Router()

const validators = [
  body("userName").isString().trim().notEmpty().withMessage("userName is required"),
  body("label").isString().trim().notEmpty().withMessage("label is required"),
  body("emoji").optional().isString().trim(),
  body("date")
    .isString()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("date must be YYYY-MM-DD"),
  body("timestamp").optional().isISO8601(),
]

router.get("/", async (req, res) => {
  const query = {}
  if (req.query.userName) {
    query.userName = req.query.userName
  }

  try {
    const entries = await MoodEntry.find(query).sort({ timestamp: -1 }).limit(200).lean().exec()
    return res.json({ success: true, data: entries })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to load mood entries", err)
    return res.status(500).json({ success: false, message: "Unable to load moods" })
  }
})

router.post("/", validators, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const entry = await new MoodEntry({
      userName: req.body.userName,
      label: req.body.label,
      emoji: req.body.emoji,
      date: req.body.date,
      timestamp: req.body.timestamp || undefined,
    }).save()

    return res.status(201).json({ success: true, data: entry })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to save mood entry", err)
    return res.status(500).json({ success: false, message: "Unable to save mood" })
  }
})

router.delete(
  "/",
  [
    body("userName").isString().trim().notEmpty().withMessage("userName is required"),
    body("date")
      .isString()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("date must be YYYY-MM-DD"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() })
    }

    try {
      const result = await MoodEntry.deleteMany({
        userName: req.body.userName,
        date: req.body.date,
      }).exec()
      return res.json({ success: true, deleted: result.deletedCount || 0 })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete mood entry", err)
      return res.status(500).json({ success: false, message: "Unable to delete mood" })
    }
  }
)

module.exports = router
