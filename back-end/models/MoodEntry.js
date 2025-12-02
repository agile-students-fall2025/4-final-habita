const mongoose = require("mongoose")

const MoodEntrySchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    emoji: { type: String, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

MoodEntrySchema.index({ userName: 1, date: -1, timestamp: -1 })

module.exports = mongoose.model("MoodEntry", MoodEntrySchema)
