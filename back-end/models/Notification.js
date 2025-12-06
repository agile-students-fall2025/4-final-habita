const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema({
  channelId: {
    type: String,
    required: true,
    default: "alerts",
    index: true,
  },
  type: {
    type: String,
    default: "system",
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  icon: String,

  mentions: {
    type: [String],
    default: [],
    index: true,
  },

  priority: {
    type: String,
    enum: ["low", "normal", "urgent"],
    default: "normal",
    index: true,
  },

  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  readAt: {
    type: Date,
    default: null,
  },
})

module.exports = mongoose.model("Notification", NotificationSchema)
