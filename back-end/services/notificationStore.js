const { CHANNELS, seedNotifications, generateId } = require("../data/notifications")

class NotificationStore {
  constructor({ channels = CHANNELS, notifications = seedNotifications } = {}) {
    this.channels = channels
    this._seed = notifications
    this.reset()
  }

  reset() {
    this.notifications = this._seed.map((notification) => ({
      ...notification,
      mentions: Array.isArray(notification.mentions)
        ? [...notification.mentions]
        : [],
      context: notification.context ? { ...notification.context } : {},
    }))
  }

  list(filters = {}) {
    const { channelId, channel, mentions, unread, priority, search } = filters
    const normalizedChannel = channelId || channel
    const mentionFilters = normalizeArrayFilter(mentions)
    const normalizedPriority = normalizeArrayFilter(priority)
    const unreadFilter = normalizeBoolean(unread)
    let data = [...this.notifications]

    if (normalizedChannel) {
      data = data.filter((notification) => notification.channelId === normalizedChannel)
    }

    if (mentionFilters.length) {
      data = data.filter((notification) =>
        notification.mentions.some((mention) => mentionFilters.includes(mention))
      )
    }

    if (typeof unreadFilter === "boolean") {
      data = data.filter((notification) =>
        unreadFilter ? !notification.readAt : Boolean(notification.readAt)
      )
    }

    if (normalizedPriority.length) {
      data = data.filter((notification) =>
        normalizedPriority.includes(notification.priority || "normal")
      )
    }

    if (search) {
      const term = String(search).toLowerCase()
      data = data.filter((notification) => {
        const haystack = `${notification.title} ${notification.body}`.toLowerCase()
        return haystack.includes(term)
      })
    }

    return data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  findById(id) {
    return this.notifications.find((notification) => notification.id === id) || null
  }

  add(payload) {
    const now = new Date().toISOString()
    const channelId = payload.channelId && this.channelExists(payload.channelId)
      ? payload.channelId
      : "alerts"

    const notification = {
      id: generateId(),
      channelId,
      type: payload.type || "system",
      title: payload.title || "Untitled notification",
      body: payload.body || "",
      icon: payload.icon || deriveIcon(channelId, payload.type),
      mentions: normalizeArrayFilter(payload.mentions),
      priority: payload.priority || "normal",
      createdAt: payload.createdAt || now,
      readAt: payload.read ? now : null,
      context: payload.context || {},
    }

    this.notifications.unshift(notification)
    return notification
  }

  markRead(id, readState = true) {
    const notification = this.findById(id)
    if (!notification) {
      return null
    }

    notification.readAt = readState ? new Date().toISOString() : null
    return notification
  }

  summary(filters = {}) {
    const data = this.list(filters)
    const unreadData = data.filter((notification) => !notification.readAt)
    const channels = this.channels.map((channel) => {
      const channelNotifications = data.filter(
        (notification) => notification.channelId === channel.id
      )
      return {
        ...channel,
        total: channelNotifications.length,
        unread: channelNotifications.filter((notification) => !notification.readAt).length,
        latest: channelNotifications[0] || null,
      }
    })

    return {
      total: data.length,
      unread: unreadData.length,
      channels,
      highlights: data.slice(0, 3),
    }
  }

  channelExists(channelId) {
    return this.channels.some((channel) => channel.id === channelId)
  }

  listChannels() {
    return this.channels
  }
}

const normalizeArrayFilter = (value) => {
  if (!value && value !== 0) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map(String)
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") {
    return value
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
  }
  return undefined
}

const deriveIcon = (channelId, type) => {
  if (channelId === "chores") return "🧹"
  if (channelId === "bills") return "💰"
  if (channelId === "house-chat") return "💬"
  if (type && type.includes("alert")) return "⚠️"
  return "🔔"
}

const notificationStore = new NotificationStore()

module.exports = {
  NotificationStore,
  notificationStore,
}
