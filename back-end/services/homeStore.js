const { tasksData, billsData } = require("../data/home")

const DEFAULT_USER = "You"

class HomeStore {
  constructor({ tasks = tasksData, bills = billsData } = {}) {
    this.tasks = tasks
    this.bills = bills
  }

  getSummary(user = DEFAULT_USER) {
    const todayISO = this._todayISO()
    const todayTimestamp = Date.parse(todayISO)

    const userTasks = this.tasks.filter((task) => this._isAssigned(task, user))
    const userBills = this.bills.filter((bill) => this._isSplitWith(bill, user))

    const taskStats = this._calculateTaskStats(userTasks, todayISO, todayTimestamp)
    const upcomingTasks = this._selectUpcomingTasks(userTasks)

    const { outstandingBills, billStats, myShareDue } = this._calculateBillStats(
      userBills,
      user,
      todayTimestamp
    )
    const comingDue = outstandingBills.slice(0, 2)

    const eventsByISO = this._buildEventsMap()

    return {
      user,
      generatedAt: new Date().toISOString(),
      tasks: {
        stats: taskStats,
        upcoming: upcomingTasks,
        items: userTasks,
      },
      bills: {
        stats: billStats,
        comingDue,
        items: userBills,
        outstanding: outstandingBills,
        myShareDue,
      },
      eventsByISO,
    }
  }

  _todayISO() {
    return new Date().toISOString().slice(0, 10)
  }

  _isAssigned(task, user) {
    if (!task) return false
    if (Array.isArray(task.assignees)) {
      return task.assignees.includes(user)
    }
    return task.assignees === user
  }

  _isSplitWith(bill, user) {
    return Array.isArray(bill?.splitBetween) && bill.splitBetween.includes(user)
  }

  _calculateTaskStats(tasks, todayISO, todayTimestamp) {
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
      if (due === todayISO && task.status !== "completed") {
        stats.dueToday += 1
      }
      const parsed = Date.parse(task.due)
      if (task.status !== "completed" && !Number.isNaN(parsed) && parsed < todayTimestamp) {
        stats.overdue += 1
      }
      if (task.status === "pending") stats.pending += 1
      if (task.status === "in-progress") stats.inProgress += 1
      if (task.status === "completed") stats.completed += 1
    })
    return stats
  }

  _selectUpcomingTasks(tasks) {
    const compareValue = (task) => {
      const parsed = Date.parse(task.due)
      return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed
    }
    return [...tasks]
      .filter((task) => task.status !== "completed")
      .sort((a, b) => compareValue(a) - compareValue(b))
      .slice(0, 3)
  }

  _calculateBillStats(bills, user, todayTimestamp) {
    let paid = 0
    let unpaid = 0
    let dueSoon = 0
    let myShareDue = 0
    const sevenDaysOut = todayTimestamp + 7 * 24 * 60 * 60 * 1000
    const outstandingBills = []

    bills.forEach((bill) => {
      const userPaid =
        bill.payments && Object.prototype.hasOwnProperty.call(bill.payments, user)
          ? bill.payments[user]
          : bill.status === "paid"
      if (userPaid) {
        paid += 1
      } else {
        unpaid += 1
        outstandingBills.push(bill)
        const share = this._calculateShare(bill)
        myShareDue += share
      }

      if (bill.status === "unpaid") {
        const parsed = Date.parse(bill.dueDate)
        if (!Number.isNaN(parsed) && parsed >= todayTimestamp && parsed <= sevenDaysOut) {
          dueSoon += 1
        }
      }
    })

    const billStats = {
      unpaid,
      paid,
      dueSoon,
      total: bills.length,
    }

    return { outstandingBills, billStats, myShareDue: Number(myShareDue.toFixed(2)) }
  }

  _calculateShare(bill) {
    if (!Array.isArray(bill.splitBetween) || bill.splitBetween.length === 0) {
      return bill.amount
    }
    return bill.amount / bill.splitBetween.length
  }

  _buildEventsMap() {
    const events = {}
    const add = (iso, entry) => {
      if (!iso) return
      if (!events[iso]) events[iso] = []
      events[iso].push(entry)
    }
    this.tasks.forEach((task) => {
      if (typeof task?.due === "string") {
        add(task.due.slice(0, 10), { type: "task", id: task.id, title: task.title })
      }
    })
    this.bills.forEach((bill) => {
      if (typeof bill?.dueDate === "string") {
        add(bill.dueDate.slice(0, 10), { type: "bill", id: bill.id, title: bill.title })
      }
    })
    return events
  }
}

const homeStore = new HomeStore()

module.exports = {
  HomeStore,
  homeStore,
}
