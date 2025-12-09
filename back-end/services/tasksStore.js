const Task = require("../models/Task")
const User = require("../models/User")

class TasksStore {
  async list(userId) {
    if (!userId) return []
    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return []
    return await Task.find({ householdId: user.householdId }).sort({ due: 1, createdAt: -1 }).lean()
  }

  async get(userId, taskId) {
    if (!userId || !taskId) return null
    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null
    return await Task.findOne({ _id: taskId, householdId: user.householdId }).lean()
  }

  async create(userId, payload) {
    if (!userId) throw new Error("User ID required")
    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) {
      throw new Error("User must belong to a household to create tasks")
    }
    const task = new Task({
      userId,
      householdId: user.householdId,
      title: payload.title || "Untitled task",
      due: payload.due || new Date().toISOString().slice(0, 10),
      assignees: Array.isArray(payload.assignees) ? payload.assignees : ["Unassigned"],
      status: ["pending", "in-progress", "completed"].includes(payload.status) ? payload.status : "pending",
      repeat: {
        type: payload?.repeat?.type || "none",
        interval: typeof payload?.repeat?.interval === "number" && payload?.repeat?.interval > 0 ? payload.repeat.interval : 1,
        unit: payload?.repeat?.unit || "weeks",
      },
    })
    await task.save()
    return task.toObject()
  }

  async update(userId, taskId, updates) {
    if (!userId || !taskId) return null
    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null
    const normalized = { ...updates }
    if (updates?.repeat) {
      normalized.repeat = {
        type: updates.repeat.type || "none",
        interval: typeof updates.repeat.interval === "number" && updates.repeat.interval > 0 ? updates.repeat.interval : 1,
        unit: updates.repeat.unit || "weeks",
      }
    }
    const task = await Task.findOneAndUpdate(
      { _id: taskId, householdId: user.householdId },
      { $set: normalized },
      { new: true, runValidators: true }
    )
    return task ? task.toObject() : null
  }

  async delete(userId, taskId) {
    if (!userId || !taskId) return null
    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null
    const task = await Task.findOneAndDelete({ _id: taskId, householdId: user.householdId })
    return task ? task.toObject() : null
  }

  async updateStatus(userId, taskId, status) {
    if (!userId || !taskId) return null
    if (!["pending", "in-progress", "completed"].includes(status)) return null
    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null
    const task = await Task.findOneAndUpdate(
      { _id: taskId, householdId: user.householdId },
      { $set: { status } },
      { new: true, runValidators: true }
    )
    return task ? task.toObject() : null
  }

  async cycleStatus(userId, taskId) {
    if (!userId || !taskId) return null
    const user = await User.findById(userId).lean()
    if (!user || !user.householdId) return null
    const task = await Task.findOne({ _id: taskId, householdId: user.householdId })
    if (!task) return null
    const next =
      task.status === "pending" ? "in-progress" :
      task.status === "in-progress" ? "completed" : "pending"
    task.status = next
    await task.save()
    return task.toObject()
  }

  async getStats(userId) {
    if (!userId) return { total: 0, pending: 0, completed: 0 }
    const tasks = await this.list(userId)
    const total = tasks.length
    const completed = tasks.filter(t => t.status === "completed").length
    const pending = tasks.filter(t => t.status !== "completed").length
    return { total, pending, completed }
  }
}

const tasksStore = new TasksStore()
module.exports = { TasksStore, tasksStore }



