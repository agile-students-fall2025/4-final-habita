const mongoose = require("mongoose")

const RepeatSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "none",
      enum: [
        "none",
        "daily",
        "weekdays",
        "weekends",
        "weekly",
        "biweekly",
        "monthly",
        "every-3-months",
        "every-6-months",
        "yearly",
        "custom"
      ],
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
    // ✅ SHARED WITH ENTIRE HOUSEHOLD
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },

    // Optional: Keep creator for auditing if needed
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    due: {
      type: String, // ISO date
      required: true,
    },

    // Names only (handled by frontend/user context)
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

module.exports = mongoose.model("Task", TaskSchema)
