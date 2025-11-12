const express = require("express")
const router = express.Router()
const { notificationStore } = require("../services/notificationStore")

router.get("/", (req, res) => {
  const data = notificationStore.list({
    channelId: req.query.channelId,
    channel: req.query.channel,
    mentions: req.query.mentions,
    unread: req.query.unread,
    priority: req.query.priority,
    search: req.query.search,
  })

  res.json({
    data,
    meta: {
      total: data.length,
      unread: data.filter((notification) => !notification.readAt).length,
    },
  })
})

router.get("/summary", (req, res) => {
  const summary = notificationStore.summary({
    mentions: req.query.mentions,
    channelId: req.query.channelId,
  })
  res.json(summary)
})

router.get("/channels", (_req, res) => {
  res.json({
    data: notificationStore.listChannels(),
  })
})

router.get("/:id", (req, res) => {
  const notification = notificationStore.findById(req.params.id)
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" })
  }
  res.json({ data: notification })
})

router.post("/", (req, res) => {
  const { title, body } = req.body
  if (!title || !body) {
    return res.status(400).json({ error: "title and body are required" })
  }

  const notification = notificationStore.add({
    title,
    body,
    channelId: req.body.channelId,
    type: req.body.type,
    mentions: req.body.mentions,
    priority: req.body.priority,
    icon: req.body.icon,
    context: req.body.context,
    read: req.body.read,
  })

  res.status(201).json({ data: notification })
})

router.patch("/:id/read", (req, res) => {
  const readState = normalizeBoolean(req.body.read ?? true)
  const notification = notificationStore.markRead(req.params.id, readState !== false)
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" })
  }

  res.json({ data: notification })
})

module.exports = router

function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
  }
  return undefined
}
