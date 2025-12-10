// back-end/models/ChatMessage.js
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true, // e.g. "task-<mongoTaskId>"
    index: true,
  },
  sender: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
