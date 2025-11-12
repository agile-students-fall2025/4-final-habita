const { billsData } = require("../data/bills")

class BillsStore {
  constructor({ bills = billsData } = {}) {
    // keep an in-memory copy
    this.bills = bills.map((b) => ({ ...b }))
  }

  _findIndex(id) {
    return this.bills.findIndex((b) => String(b.id) === String(id))
  }

  list() {
    return this.bills
  }

  get(id) {
    return this.bills.find((b) => String(b.id) === String(id)) || null
  }

  create(payload) {
    const nextId = this.bills.length ? Math.max(...this.bills.map((b) => Number(b.id))) + 1 : 1
    const bill = Object.assign(
      {
        id: nextId,
        title: "Untitled bill",
        amount: 0,
        dueDate: new Date().toISOString().slice(0, 10),
        payer: "You",
        splitBetween: ["You"],
        description: "",
        status: "unpaid",
        payments: {},
        createdAt: new Date().toISOString(),
      },
      payload
    )
    this.bills.unshift(bill)
    return bill
  }

  update(id, updates) {
    const idx = this._findIndex(id)
    if (idx === -1) return null
    this.bills[idx] = Object.assign({}, this.bills[idx], updates)
    return this.bills[idx]
  }

  togglePayment(id, person) {
    const bill = this.get(id)
    if (!bill) return null
    const payments = Object.assign({}, bill.payments || {})
    if (person) payments[person] = !payments[person]
    const allPaid = Array.isArray(bill.splitBetween) && bill.splitBetween.every((p) => payments[p])
    bill.payments = payments
    bill.status = allPaid ? "paid" : bill.status
    return bill
  }
}

const billsStore = new BillsStore()
module.exports = { BillsStore, billsStore }
