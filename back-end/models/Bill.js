const mongoose = require("mongoose")

const BillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: String,
      required: true,
    },
    payer: {
      type: String,
      default: "You",
    },
    splitBetween: {
      type: [String],
      default: ["You"],
    },
    splitType: {
      type: String,
      enum: ["even", "custom"],
      default: "even",
    },
    customSplitAmounts: {
      type: Object,
      default: {},
    },
    paymentDirection: {
      type: String,
      enum: ["none", "incoming", "outgoing", "personal"],
      default: "none",
    },
    // For personal bills: the person who should receive the money
    receiver: {
      type: String,
      default: "",
    },
    // Username of the user who created the bill (helps the frontend decide who can edit)
    createdBy: {
      type: String,
      default: "",
    },
    payments: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
)

const Bill = mongoose.model("Bill", BillSchema)

module.exports = Bill