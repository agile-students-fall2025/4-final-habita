// back-end/routes/chat.js

const express = require("express");
const ChatMessage = require("../models/ChatMessage");

const router = express.Router();

// GET /api/chats/:threadId/messages
router.get("/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const messages = await ChatMessage.find({ threadId }).sort({ createdAt: 1 });
    res.json({ data: messages });
  } catch (err) {
    console.error("Load messages failed:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST /api/chats/:threadId/messages
router.post("/:threadId/messages", async (req, res) => {
  try {
    const { threadId } = req.params;
    const { text, sender } = req.body;

    if (!threadId || !text?.trim()) {
      return res.status(400).json({ error: "Missing threadId or message text" });
    }

    const newMessage = await ChatMessage.create({
      threadId,
      sender: sender || "You",
      text: text.trim(),
      createdAt: new Date(),
    });

    res.json({ data: newMessage });
  } catch (err) {
    console.error("Send message failed:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
