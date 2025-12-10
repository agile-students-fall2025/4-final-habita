const ChatThread = require("../models/ChatThread")

// Ensure a household has an associated chat thread; returns the thread document.
const ensureHouseholdChatThread = async (household) => {
  if (!household) return null
  if (household.chatThreadId) {
    return ChatThread.findById(household.chatThreadId)
  }

  const thread = new ChatThread({
    name: household.name || "House",
    contextType: "house",
    contextId: household._id,
    tags: ["house"],
  })
  await thread.save()
  household.chatThreadId = thread._id
  await household.save()
  return thread
}

module.exports = {
  ensureHouseholdChatThread,
}
