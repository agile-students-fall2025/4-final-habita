const addDays = (days) => {
  const date = new Date("2025-01-10T10:00:00.000Z")
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const billsData = [
  {
    id: 1,
    title: "Internet Bill",
    amount: 80.0,
    dueDate: addDays(3),
    payer: "Alex",
    splitBetween: ["Alex", "Sam", "Jordan", "You"],
    description: "Monthly internet bill",
    status: "unpaid",
    payments: {
      Alex: true,
      Sam: false,
      Jordan: false,
      You: false,
    },
    createdAt: addDays(-10),
  },
  {
    id: 2,
    title: "Electricity",
    amount: 120.0,
    dueDate: addDays(6),
    payer: "Sam",
    splitBetween: ["Alex", "Sam", "Jordan", "You"],
    description: "Monthly electricity bill",
    status: "paid",
    payments: {
      Alex: true,
      Sam: true,
      Jordan: true,
      You: true,
    },
    createdAt: addDays(-20),
  },
  {
    id: 3,
    title: "Groceries Reimbursement",
    amount: 45.5,
    dueDate: addDays(1),
    payer: "You",
    splitBetween: ["You", "Jordan"],
    description: "Weekend grocery run",
    status: "unpaid",
    payments: {
      You: true,
      Jordan: false,
    },
    createdAt: addDays(-2),
  },
]

module.exports = { billsData }
