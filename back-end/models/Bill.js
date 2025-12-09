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
      type: Map,
      of: Number,
      default: {},
    },
    paymentDirection: {
      type: String,
      enum: ["none", "incoming", "outgoing"],
      default: "none",
    },
    payments: {
      type: Map,
      of: Boolean,
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