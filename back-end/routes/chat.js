const express = require("express")
const router = express.Router()
const { chatStore } = require("../services/chatStore")

router.get("/threads", (req, res) => {
  const threads = chatStore.listThreads({
    tag: req.query.tag,
    contextType: req.query.contextType,
  })
  res.json({ data: threads })
})

router.post("/threads", (req, res) => {
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

router.get("/threads/:id", (req, res) => {
  const thread = chatStore.getThread({ threadId: req.params.id })
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" })
  }
  res.json({ data: thread })
})

router.patch("/threads/:id/read", (req, res) => {
  const thread = chatStore.markThreadRead(req.params.id)
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" })
  }
  res.json({ data: thread })
})

router.get("/messages", (req, res) => {
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

router.post("/messages", (req, res) => {
  const { text, sender, threadId, contextType, contextId, participants, name } =
    req.body
  if (!text || !sender) {
    return res.status(400).json({ error: "sender and text are required" })
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
