const { randomUUID } = require("crypto")
const { seedThreads, generateMessageId } = require("../data/chat")

const DEFAULT_USER = "User"
const mentionRegex = /@([\w-]+)/gi

class ChatStore {
  constructor(seed = seedThreads) {
    this._seed = seed
    this.reset()
  }

  reset() {
    this.threads = this._seed.map(cloneThread)
    this._reindex()
  }

  _reindex() {
    this.threadIndex = new Map()
    this.threads.forEach((thread) => {
      this.threadIndex.set(thread.id, thread)
      const key = this._toKey(thread.contextType, thread.contextId)
      if (key && key !== thread.id) {
        this.threadIndex.set(key, thread)
      }
    })
  }

  _toKey(contextType, contextId) {
    if (!contextType) return null
    if (contextType === "house") return "house"
    if (contextId === undefined || contextId === null) return contextType
    return `${contextType}-${contextId}`
  }

  listThreads(filters = {}) {
    const { tag, contextType, contextId } = filters
    const normalizeId = (value) =>
      value === undefined || value === null ? null : value.toString()
    const targetContextId = normalizeId(contextId)
    const list = this.threads.filter((thread) => {
      if (contextType && thread.contextType !== contextType) return false
      if (targetContextId !== null && normalizeId(thread.contextId) !== targetContextId) {
        return false
      }
      if (tag && !(thread.tags || []).includes(tag)) return false
      return true
    })
    return list.map((thread) => this._formatThread(thread))
  }

  getThread(query = {}) {
    const { threadId, contextType, contextId } = query
    if (!threadId && !contextType) return null
    const key = threadId || this._toKey(contextType, contextId)
    if (!key) return null
    return this.threadIndex.get(key) || null
  }

  ensureThread(metadata = {}) {
    const {
      threadId,
      contextType,
      contextId,
      name,
      participants = [DEFAULT_USER],
      tags = [],
    } = metadata
    const existing = this.getThread({ threadId, contextType, contextId })
    if (existing) {
      if (name && !existing.lockedName) {
        existing.name = name
      }
      if (participants?.length) {
        const merged = Array.from(
          new Set([...(existing.participants || []), ...participants])
        )
        existing.participants = merged
      }
      if (tags?.length) {
        const mergedTags = Array.from(
          new Set([...(existing.tags || []), ...tags])
        )
        existing.tags = mergedTags
      }
      return existing
    }
    const key =
      threadId || this._toKey(contextType, contextId) || randomUUID().slice(0, 6)
    const newThread = {
      id: key,
      name: name || `# ${contextType || "chat"}`,
      contextType: contextType || "direct",
      contextId: contextId ?? null,
      participants: participants?.length ? participants : [DEFAULT_USER],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readBy: {},
      tags,
      messages: [],
    }
    this.threads.unshift(newThread)
    this._reindex()
    return newThread
  }

  listMessages(query = {}) {
    const thread = this.ensureThread(query)
    return thread.messages.map((message) => this._formatMessage(message))
  }

  addMessage(payload = {}) {
    const {
      threadId,
      contextType,
      contextId,
      sender = DEFAULT_USER,
      text,
      participants,
      name,
      metadata,
    } = payload
    if (!text) {
      throw new Error("Message text required")
    }
    const thread = this.ensureThread({
      threadId,
      contextType,
      contextId,
      participants,
      name,
    })
    const createdAt = new Date().toISOString()
    const mentions = extractMentions(text)
    const message = {
      id: generateMessageId(),
      sender,
      text,
      createdAt,
      mentions,
      metadata: metadata || null,
    }
    thread.messages.push(message)
    thread.updatedAt = createdAt
    if (sender === DEFAULT_USER) {
      thread.readBy = {
        ...(thread.readBy || {}),
        [DEFAULT_USER]: createdAt,
      }
    }
    return {
      thread: this._formatThread(thread),
      message: this._formatMessage(message),
    }
  }

  markThreadRead(threadId, user = DEFAULT_USER) {
    const thread = this.getThread({ threadId })
    if (!thread) {
      return null
    }
    const now = new Date().toISOString()
    thread.readBy = {
      ...(thread.readBy || {}),
      [user]: now,
    }
    return this._formatThread(thread)
  }

  _formatThread(thread) {
    const lastMessage = thread.messages[thread.messages.length - 1] || null
    const unreadCount = this._countUnread(thread)
    const mentionCount = this._countMentions(thread, DEFAULT_USER)
    return {
      id: thread.id,
      name: thread.name,
      contextType: thread.contextType,
      contextId: thread.contextId,
      participants: thread.participants || [],
      tags: thread.tags || [],
      messageCount: thread.messages.length,
      unreadCount,
      mentionCount,
      latestActivityAt: thread.updatedAt || thread.createdAt,
      lastMessage: lastMessage ? this._formatMessage(lastMessage) : null,
    }
  }

  _formatMessage(message) {
    return {
      id: message.id,
      sender: message.sender,
      text: message.text,
      createdAt: message.createdAt,
      timestamp: message.timestamp || formatDisplayTime(message.createdAt),
      mentions: message.mentions || [],
      metadata: message.metadata || null,
    }
  }

  _countUnread(thread, user = DEFAULT_USER) {
    const readAt = thread.readBy?.[user]
    if (!readAt) return thread.messages.length
    const readTime = new Date(readAt).getTime()
    return thread.messages.filter(
      (message) =>
        new Date(message.createdAt).getTime() > readTime && message.sender !== user
    ).length
  }

  _countMentions(thread, user = DEFAULT_USER) {
    return thread.messages.filter((message) =>
      (message.mentions || []).some(
        (mention) => mention.toLowerCase() === user.toLowerCase()
      )
    ).length
  }
}

const cloneThread = (thread) => ({
  ...thread,
  participants: thread.participants ? [...thread.participants] : [],
  tags: thread.tags ? [...thread.tags] : [],
  readBy: thread.readBy ? { ...thread.readBy } : {},
  messages: thread.messages
    ? thread.messages.map((message) => ({ ...message }))
    : [],
})

const extractMentions = (text = "") => {
  const mentions = new Set()
  let match = mentionRegex.exec(text)
  while (match) {
    mentions.add(match[1])
    match = mentionRegex.exec(text)
  }
  mentionRegex.lastIndex = 0
  return Array.from(mentions)
}

const formatDisplayTime = (value) => {
  if (!value) return ""
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return String(value)
  return new Date(parsed).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const chatStore = new ChatStore()

module.exports = {
  ChatStore,
  chatStore,
}
