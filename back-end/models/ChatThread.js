const mongoose = require("mongoose");

const ChatThreadSchema = new mongoose.Schema({
  // ✅ This prevents the ObjectId crash you saw:
  threadKey: { type: String, unique: true, index: true },


  name: String,

  participants: [String],
  tags: [String],

  messageCount: { type: Number, default: 0 },
  unreadCount: { type: Number, default: 0 },
  mentionCount: { type: Number, default: 0 },

  latestActivityAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatThread", ChatThreadSchema);
