const addDays = (days) => {
  const date = new Date("2025-01-10T10:00:00.000Z")
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const tasksData = [
  {
    id: "task-231",
    title: "Take Out Trash",
    due: addDays(0),
    assignees: ["You"],
    status: "pending",
  },
  {
    id: "task-115",
    title: "Laundry",
    due: addDays(1),
    assignees: ["Jordan", "You"],
    status: "in-progress",
  },
  {
    id: "task-420",
    title: "Clean Bathroom",
    due: addDays(-1),
    assignees: ["Sam"],
    status: "pending",
  },
  {
    id: "task-777",
    title: "Restock Paper Towels",
    due: addDays(2),
    assignees: ["You", "Alex"],
    status: "pending",
  },
  {
    id: "task-900",
    title: "Pay Electricity Bill",
    due: addDays(5),
    assignees: ["Alex"],
    status: "completed",
  },
]

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

module.exports = {
  tasksData,
  billsData,
}
