const express = require("express")
const passport = require("passport")
const router = express.Router()
const { tasksStore } = require("../services/tasksStore")
const { billsStore } = require("../services/billsStore")

const auth = passport.authenticate("jwt", { session: false })

const todayISO = () => new Date().toISOString().slice(0, 10)

const calculateTaskStats = (tasks) => {
  const nowISO = todayISO()
  const nowTs = Date.parse(nowISO)
  const stats = {
    total: tasks.length,
    dueToday: 0,
    overdue: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  }
  tasks.forEach((task) => {
    const due = typeof task?.due === "string" ? task.due.slice(0, 10) : null
    if (due === nowISO && task.status !== "completed") stats.dueToday += 1
    const parsed = Date.parse(task.due)
    if (task.status !== "completed" && !Number.isNaN(parsed) && parsed < nowTs) {
      stats.overdue += 1
    }
    if (task.status === "pending") stats.pending += 1
    if (task.status === "in-progress") stats.inProgress += 1
    if (task.status === "completed") stats.completed += 1
  })
  return stats
}

const selectUpcomingTasks = (tasks) => {
  const compareValue = (task) => {
    const parsed = Date.parse(task.due)
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
  }
  return [...tasks]
    .filter((task) => task.status !== "completed")
    .sort((a, b) => compareValue(a) - compareValue(b))
    .slice(0, 3)
}

const shareForUser = (bill, userName) => {
  if (bill.status === "paid") return 0
  if (bill.paymentDirection === "incoming") return 0 // others owe me
  if (bill.paymentDirection === "outgoing") return Number(bill.amount || 0) // I owe the whole thing

  // General split
  const split = Array.isArray(bill.splitBetween) ? bill.splitBetween : []
  if (!split.includes(userName)) return 0
  if (bill.splitType === "custom" && bill.customSplitAmounts) {
    const custom = bill.customSplitAmounts[userName]
    return custom ? Number(custom) : 0
  }
  const divisor = split.length || 1
  return Number(bill.amount || 0) / divisor
}

const calculateBillStats = (bills, userName) => {
  const now = Date.now()
  const sevenDaysOut = now + 7 * 24 * 60 * 60 * 1000
  let paid = 0
  let unpaid = 0
  let dueSoon = 0
  let myShareDue = 0
  const outstanding = []

  bills.forEach((bill) => {
    const isPaid = bill.status === "paid"
    if (isPaid) {
      paid += 1
    } else {
      unpaid += 1
      outstanding.push(bill)
      myShareDue += shareForUser(bill, userName)
    }

    if (!isPaid) {
      const parsed = Date.parse(bill.dueDate)
      if (!Number.isNaN(parsed) && parsed >= now && parsed <= sevenDaysOut) {
        dueSoon += 1
      }
    }
  })

  return {
    outstanding,
    stats: { unpaid, paid, dueSoon, total: bills.length },
    myShareDue: Number(myShareDue.toFixed(2)),
  }
}

const buildEvents = (tasks, bills) => {
  const events = {}
  const add = (iso, entry) => {
    if (!iso) return
    if (!events[iso]) events[iso] = []
    events[iso].push(entry)
  }
  tasks.forEach((task) => {
    if (typeof task?.due === "string") {
      add(task.due.slice(0, 10), { type: "task", id: task.id, title: task.title })
    }
  })
  bills.forEach((bill) => {
    if (typeof bill?.dueDate === "string") {
      add(bill.dueDate.slice(0, 10), { type: "bill", id: bill.id, title: bill.title })
    }
  })
  return events
}

router.get("/summary", auth, async (req, res) => {
  try {
    const [rawTasks, rawBills] = await Promise.all([
      tasksStore.list(req.user.id),
      billsStore.list(req.user.id),
    ])

    const tasks = rawTasks.map((task) => ({ ...task, id: task.id || String(task._id) }))
    const bills = rawBills.map((bill) => ({ ...bill, id: bill.id || String(bill._id) }))

    const taskStats = calculateTaskStats(tasks)
    const upcomingTasks = selectUpcomingTasks(tasks)
    const { outstanding, stats: billStats, myShareDue } = calculateBillStats(bills, req.user.username)
    const comingDue = outstanding.slice(0, 2)
    const eventsByISO = buildEvents(tasks, bills)

    return res.json({
      data: {
        user: req.user.username,
        generatedAt: new Date().toISOString(),
        tasks: { stats: taskStats, upcoming: upcomingTasks, items: tasks },
        bills: {
          stats: billStats,
          comingDue,
          items: bills,
          outstanding,
          myShareDue,
        },
        eventsByISO,
      },
    })
  } catch (err) {
    console.error("Failed to load home summary", err)
    return res.status(500).json({ error: "Failed to load home summary" })
  }
})

module.exports = router
