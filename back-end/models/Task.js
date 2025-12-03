const mongoose = require("mongoose")

const RepeatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "none",
      enum: ["none", "daily", "weekdays", "weekends", "weekly", "biweekly", "monthly", "every-3-months", "every-6-months", "yearly", "custom"],
    },
    interval: {
      type: Number,
      default: 1,
      min: 1,
    },
    unit: {
      type: String,
      default: "weeks",
      enum: ["days", "weeks", "months", "years"],
    },
  },
  { _id: false }
)

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    due: {
      type: String, // ISO date (YYYY-MM-DD)
      required: true,
    },
    assignees: {
      type: [String],
      default: ["Unassigned"],
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
      index: true,
    },
    repeat: {
      type: RepeatSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
)

const Task = mongoose.model("Task", TaskSchema)

module.exports = Task



