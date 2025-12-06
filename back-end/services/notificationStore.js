const Notification = require("../models/Notification")
const { CHANNELS } = require("../data/notifications")

class NotificationStore {

  async list(filters = {}) {
    const query = {}

    if (filters.channelId || filters.channel) {
      query.channelId = filters.channelId || filters.channel
    }

    if (filters.mentions) {
      query.mentions = { $in: normalizeArrayFilter(filters.mentions) }
    }

    if (filters.priority) {
      query.priority = { $in: normalizeArrayFilter(filters.priority) }
    }

    if (filters.unread !== undefined) {
      const unread = normalizeBoolean(filters.unread)
      query.readAt = unread ? null : { $ne: null }
    }

    if (filters.search) {
      const regex = new RegExp(filters.search, "i")
      query.$or = [{ title: regex }, { body: regex }]
    }

    return Notification
      .find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec()
  }

  async findById(id) {
    return Notification.findById(id).lean().exec()
  }

  async add(payload) {
    return Notification.create({
      channelId: payload.channelId || "alerts",
      type: payload.type,
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      mentions: normalizeArrayFilter(payload.mentions),
      priority: payload.priority || "normal",
      context: payload.context || {},
      readAt: payload.read ? new Date() : null,
    })
  }

  async markRead(id, readState = true) {
    return Notification.findByIdAndUpdate(
      id,
      { readAt: readState ? new Date() : null },
      { new: true }
    ).exec()
  }

  async summary(filters = {}) {
    const notifications = await this.list(filters)

    const channels = CHANNELS.map((channel) => {
      const channelItems = notifications.filter(
        (x) => x.channelId === channel.id
      )

      return {
        ...channel,
        total: channelItems.length,
        unread: channelItems.filter((n) => !n.readAt).length,
        latest: channelItems[0] || null,
      }
    })

    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.readAt).length,
      channels,
      highlights: notifications.slice(0, 3),
    }
  }

  listChannels() {
    return CHANNELS
  }
}

const normalizeArrayFilter = (value) => {
  if (!value && value !== 0) return []
  if (Array.isArray(value)) return value.map(String)

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
  }
  return undefined
}

const notificationStore = new NotificationStore()

module.exports = {
  NotificationStore,
  notificationStore,
}
