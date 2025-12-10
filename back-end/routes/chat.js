const express = require("express")
const passport = require("passport")
const router = express.Router()
const { chatStore } = require("../services/chatStore")

const auth = passport.authenticate("jwt", { session: false })

const requireHousehold = (req, res) => {
  if (!req.user?.householdId) {
    res.status(403).json({ error: "Join a household to use chat" })
    return false
  }
  return true
}

router.get("/threads", auth, (req, res) => {
  if (!requireHousehold(req, res)) return
  const threads = chatStore.listThreads({
    tag: req.query.tag,
    contextType: req.query.contextType,
    contextId: req.query.contextType === "house" ? req.user.householdId : req.query.contextId,
  })
  res.json({ data: threads })
})

router.post("/threads", auth, (req, res) => {
  const { threadId, contextType, contextId, name, participants, tags } = req.body
  if (!contextType && !threadId) {
    return res.status(400).json({
      error: "contextType or threadId is required to ensure a thread",
    })
  }
  if (!requireHousehold(req, res)) return
  const thread = chatStore.ensureThread({
    threadId,
    contextType,
    contextId: contextType === "house" ? req.user.householdId : contextId,
    name,
    participants,
    tags,
  })
  res.status(201).json({ data: thread })
})

router.get("/threads/:id", auth, (req, res) => {
  if (!requireHousehold(req, res)) return
  const thread = chatStore.getThread({ threadId: req.params.id })
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" })
  }
  if (thread.contextType === "house" && String(thread.contextId) !== String(req.user.householdId)) {
    return res.status(403).json({ error: "Thread not available for this household" })
  }
  res.json({ data: thread })
})

router.patch("/threads/:id/read", auth, (req, res) => {
  if (!requireHousehold(req, res)) return
  const thread = chatStore.markThreadRead(req.params.id)
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" })
  }
  if (thread.contextType === "house" && String(thread.contextId) !== String(req.user.householdId)) {
    return res.status(403).json({ error: "Thread not available for this household" })
  }
  res.json({ data: thread })
})

router.get("/messages", auth, (req, res) => {
  if (!requireHousehold(req, res)) return
  const { threadId, contextType, contextId } = req.query
  if (!threadId && !contextType) {
    return res
      .status(400)
      .json({ error: "threadId or contextType must be provided" })
  }
  if (threadId) {
    const thread = chatStore.getThread({ threadId })
    if (thread && thread.contextType === "house") {
      if (String(thread.contextId) !== String(req.user.householdId)) {
        return res.status(403).json({ error: "Thread not available for this household" })
      }
    }
  }

  const messages = chatStore.listMessages({
    threadId,
    contextType,
    contextId: contextType === "house" ? req.user.householdId : contextId,
  })
  res.json({ data: messages })
})

router.post("/messages", auth, (req, res) => {
  if (!requireHousehold(req, res)) return
  const { text, threadId, contextType, contextId, participants, name } = req.body
  const sender = req.user?.displayName || req.user?.username
  if (!text) {
    return res.status(400).json({ error: "text is required" })
  }
  if (!sender) {
    return res.status(400).json({ error: "Unable to determine sender from user profile" })
  }
  if (threadId) {
    const thread = chatStore.getThread({ threadId })
    if (thread && thread.contextType === "house") {
      if (String(thread.contextId) !== String(req.user.householdId)) {
        return res.status(403).json({ error: "Thread not available for this household" })
      }
    }
  }
  const { message, thread } = chatStore.addMessage({
    text,
    sender,
    threadId,
    contextType,
    contextId: contextType === "house" ? req.user.householdId : contextId,
    participants,
    name,
    metadata: req.body.metadata,
  })
  res.status(201).json({
    data: {
      message,
      thread,
    },
  })
})

module.exports = router
