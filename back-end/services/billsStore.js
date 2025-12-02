const Bill = require("../models/Bill")

class BillsStore {
  async list(userId) {
    if (!userId) return []
    return await Bill.find({ userId }).sort({ createdAt: -1 }).lean()
  }

  async get(userId, billId) {
    if (!userId || !billId) return null
    return await Bill.findOne({ _id: billId, userId }).lean()
  }

  async create(userId, payload) {
    if (!userId) throw new Error("User ID required")
    
    const bill = new Bill({
      userId,
      title: payload.title || "Untitled bill",
      amount: payload.amount || 0,
      dueDate: payload.dueDate || new Date().toISOString().slice(0, 10),
      payer: payload.payer || "You",
      splitBetween: payload.splitBetween || ["You"],
      splitType: payload.splitType || "even",
      customSplitAmounts: payload.customSplitAmounts || {},
      paymentDirection: payload.paymentDirection || "none",
      payments: payload.payments || {},
      status: payload.status || "unpaid",
      description: payload.description || "",
    })

    await bill.save()
    return bill.toObject()
  }

  async update(userId, billId, updates) {
    if (!userId || !billId) return null
    
    const bill = await Bill.findOneAndUpdate(
      { _id: billId, userId },
      { $set: updates },
      { new: true, runValidators: true }
    )
    
    return bill ? bill.toObject() : null
  }

  async delete(userId, billId) {
    if (!userId || !billId) return null
    
    const bill = await Bill.findOneAndDelete({ _id: billId, userId })
    return bill ? bill.toObject() : null
  }

  async togglePayment(userId, billId, person) {
    if (!userId || !billId) return null
    
    const bill = await Bill.findOne({ _id: billId, userId })
    if (!bill) return null

    const payments = bill.payments || new Map()
    payments.set(person, !payments.get(person))
    
    const allPaid = bill.splitBetween.every((p) => payments.get(p))
    bill.payments = payments
    bill.status = allPaid ? "paid" : "unpaid"
    
    await bill.save()
    return bill.toObject()
  }

  async updateStatus(userId, billId, newStatus) {
    if (!userId || !billId) return null
    
    const bill = await Bill.findOne({ _id: billId, userId })
    if (!bill) return null

    bill.status = newStatus
    
    if (newStatus === "paid") {
      const payments = new Map()
      bill.splitBetween.forEach((person) => payments.set(person, true))
      bill.payments = payments
    }
    
    await bill.save()
    return bill.toObject()
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