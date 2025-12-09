const express = require("express")
const passport = require("passport")
const router = express.Router()
const { chatStore } = require("../services/chatStore")

const auth = passport.authenticate("jwt", { session: false })

router.get("/threads", auth, (req, res) => {
  const threads = chatStore.listThreads({
    tag: req.query.tag,
    contextType: req.query.contextType,
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
  const thread = chatStore.ensureThread({
    threadId,
    contextType,
    contextId,
    name,
    participants,
    tags,
  })
  res.status(201).json({ data: thread })
})

router.get("/threads/:id", auth, (req, res) => {
  const thread = chatStore.getThread({ threadId: req.params.id })
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" })
  }
  res.json({ data: thread })
})

router.patch("/threads/:id/read", auth, (req, res) => {
  const thread = chatStore.markThreadRead(req.params.id)
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" })
  }
  res.json({ data: thread })
})

router.get("/messages", auth, (req, res) => {
  const { threadId, contextType, contextId } = req.query
  if (!threadId && !contextType) {
    return res
      .status(400)
      .json({ error: "threadId or contextType must be provided" })
  }
  const messages = chatStore.listMessages({
    threadId,
    contextType,
    contextId,
  })
  res.json({ data: messages })
})

router.post("/messages", auth, (req, res) => {
  const { text, threadId, contextType, contextId, participants, name } = req.body
  const sender = req.user?.displayName || req.user?.username
  if (!text) {
    return res.status(400).json({ error: "text is required" })
  }
  if (!sender) {
    return res.status(400).json({ error: "Unable to determine sender from user profile" })
  }
  const { message, thread } = chatStore.addMessage({
    text,
    sender,
    threadId,
    contextType,
    contextId,
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
