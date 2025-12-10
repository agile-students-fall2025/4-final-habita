const Bill = require("../models/Bill")
const User = require("../models/User")

class BillsStore {
  async list(userId) {
    if (!userId) return []

    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return []

    return await Bill.find({ householdId: user.householdId }).sort({ createdAt: -1 }).lean()
  }

  async get(userId, billId) {
    if (!userId || !billId) return null

    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null

    return await Bill.findOne({ _id: billId, householdId: user.householdId }).lean()
  }

  async create(userId, payload) {
    if (!userId) throw new Error("User ID required")

    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) {
      throw new Error("User must belong to a household to create bills")
    }

    const bill = new Bill({
      userId: user._id,
      createdBy: user.username || user.displayName || "",
      householdId: user.householdId,
      title: payload.title || "Untitled bill",
      amount: payload.amount || 0,
      dueDate: payload.dueDate || new Date().toISOString().slice(0, 10),
      payer: payload.payer || "You",
      receiver: payload.receiver || "",
      splitBetween: Array.isArray(payload.splitBetween) ? payload.splitBetween : [],
      splitType: payload.splitType || "even",
      customSplitAmounts: Object.assign({}, payload.customSplitAmounts || {}),
      paymentDirection: payload.paymentDirection || "none",
      payments: {},
      status: payload.status || "unpaid",
      description: payload.description || "",
    })

    await bill.save()
    return bill.toObject()
  }

  async update(userId, billId, updates) {
    if (!userId || !billId) return null

    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null

    const bill = await Bill.findOneAndUpdate(
      { _id: billId, householdId: user.householdId },
      { $set: updates },
      { new: true, runValidators: true }
    )

    return bill ? bill.toObject() : null
  }

  async delete(userId, billId) {
    if (!userId || !billId) return null

    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null

    const bill = await Bill.findOneAndDelete({ _id: billId, householdId: user.householdId })
    return bill ? bill.toObject() : null
  }

  /**
   * Toggle payment status for a person on a bill.
   * person: string (person's name)
   */
  async togglePayment(userId, billId, person) {
    if (!userId || !billId || !person) return null

    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null

    const bill = await Bill.findOne({ _id: billId, householdId: user.householdId })
    if (!bill) return null

    // Payments is already a plain object (or empty object)
    const payments = bill.payments || {}

    // Toggle the person's payment status
    const currentStatus = !!payments[person]
    payments[person] = !currentStatus

    // Auto-compute status: if all people in splitBetween are paid, mark bill as paid
    const splitList = Array.isArray(bill.splitBetween) ? bill.splitBetween : []
    let newStatus = bill.status
    if (splitList.length > 0) {
      const allPaid = splitList.every((p) => payments[p] === true)
      newStatus = allPaid ? "paid" : "unpaid"
    }

    // Use updateOne with $set to bypass Mongoose validation and cast issues
    const result = await Bill.updateOne(
      { _id: billId, householdId: user.householdId },
      { $set: { payments, status: newStatus } }
    )

    if (result.matchedCount === 0) return null

    // Fetch and return the updated bill
    return await Bill.findById(billId).lean()
  }

  /**
   * Update bill status to paid or unpaid.
   * When marking as paid, mark all people in splitBetween as paid.
   * When marking as unpaid, clear all payments.
   */
  async updateStatus(userId, billId, newStatus) {
    if (!userId || !billId || !newStatus) return null

    if (!["paid", "unpaid"].includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`)
    }

    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null

    const bill = await Bill.findOne({ _id: billId, householdId: user.householdId })
    if (!bill) return null

    const payments = bill.payments || {}

    if (newStatus === "paid") {
      // Mark all people in splitBetween (or payer) as paid
      const splitList = Array.isArray(bill.splitBetween) ? bill.splitBetween : []
      const people = splitList.length > 0 ? splitList : [bill.payer || ""]

      people.forEach((person) => {
        if (person) {
          payments[person] = true
        }
      })
    } else {
      // Mark as unpaid: clear all payments
      Object.keys(payments).forEach((key) => {
        payments[key] = false
      })
    }

    // Use updateOne with $set to bypass Mongoose validation and cast issues
    const result = await Bill.updateOne(
      { _id: billId, householdId: user.householdId },
      { $set: { payments, status: newStatus } }
    )

    if (result.matchedCount === 0) return null

    // Fetch and return the updated bill
    return await Bill.findById(billId).lean()
  }

  async getStats(userId) {
    if (!userId) return { total: 0, unpaid: 0, paid: 0, totalAmount: 0 }

    const bills = await this.list(userId)

    return {
      total: bills.length,
      unpaid: bills.filter((b) => b.status === "unpaid").length,
      paid: bills.filter((b) => b.status === "paid").length,
      totalAmount: bills.reduce((sum, b) => sum + b.amount, 0),
    }
  }
}

const billsStore = new BillsStore()
module.exports = { BillsStore, billsStore }
