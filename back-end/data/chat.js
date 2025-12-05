const { randomUUID } = require("crypto")

const roommates = ["You"]

const seedThreads = [
  {
    id: "house",
    name: "# house-chat",
    contextType: "house",
    contextId: null,
    participants: roommates,
    tags: ["house"],
    createdAt: "2025-01-08T17:00:00.000Z",
    updatedAt: "2025-01-10T19:15:00.000Z",
    readBy: {
      You: "2025-01-10T18:00:00.000Z",
    },
    messages: [
      {
        id: "msg-001",
        sender: "You",
        text: "Welcome to your new household chat.",
        createdAt: "2025-01-10T13:12:00.000Z",
      },
    ],
  },
]

const generateMessageId = () => `msg-${randomUUID().split("-")[0]}`

module.exports = {
  roommates,
  seedThreads,
  generateMessageId,
}
