const { randomUUID } = require("crypto")

const roommates = ["You", "Alex", "Sam", "Jordan"]

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
        sender: "Alex",
        text: "Morning! Recycling pickup is tonight.",
        createdAt: "2025-01-10T13:12:00.000Z",
      },
      {
        id: "msg-002",
        sender: "Sam",
        text: "Thanks @You! I’ll tie up the bags after class.",
        createdAt: "2025-01-10T13:15:00.000Z",
      },
      {
        id: "msg-003",
        sender: "You",
        text: "I'll take them downstairs before dinner.",
        createdAt: "2025-01-10T13:17:00.000Z",
      },
      {
        id: "msg-004",
        sender: "Jordan",
        text: "Friendly reminder: quiet hours after 11pm.",
        createdAt: "2025-01-10T19:15:00.000Z",
      },
    ],
  },
  {
    id: "direct-sam",
    name: "Sam",
    contextType: "direct",
    contextId: "Sam",
    participants: ["You", "Sam"],
    tags: ["direct"],
    createdAt: "2025-01-09T20:00:00.000Z",
    updatedAt: "2025-01-10T16:05:00.000Z",
    readBy: {
      You: "2025-01-10T15:30:00.000Z",
    },
    messages: [
      {
        id: "msg-101",
        sender: "Sam",
        text: "Need to sync on rent split later?",
        createdAt: "2025-01-10T15:45:00.000Z",
      },
      {
        id: "msg-102",
        sender: "You",
        text: "Sure, free after 8pm.",
        createdAt: "2025-01-10T16:05:00.000Z",
      },
    ],
  },
  {
    id: "bill-884",
    name: "Utilities Past Due",
    contextType: "bill",
    contextId: "884",
    participants: roommates,
    tags: ["bills"],
    createdAt: "2025-01-09T18:00:00.000Z",
    updatedAt: "2025-01-10T21:30:00.000Z",
    readBy: {
      You: "2025-01-10T18:10:00.000Z",
    },
    messages: [
      {
        id: "msg-201",
        sender: "Alex",
        text: "Electric bill is due Friday. Everyone good to pay by then?",
        createdAt: "2025-01-10T20:45:00.000Z",
      },
      {
        id: "msg-202",
        sender: "You",
        text: "I’ll send my share tonight.",
        createdAt: "2025-01-10T21:30:00.000Z",
      },
    ],
  },
  {
    id: "task-231",
    name: "Take Out Trash",
    contextType: "task",
    contextId: "231",
    participants: ["You", "Sam"],
    tags: ["tasks"],
    createdAt: "2025-01-09T11:00:00.000Z",
    updatedAt: "2025-01-10T14:00:00.000Z",
    readBy: {
      You: "2025-01-10T13:59:00.000Z",
    },
    messages: [
      {
        id: "msg-301",
        sender: "Sam",
        text: "Can you cover trash duty tonight?",
        createdAt: "2025-01-10T14:00:00.000Z",
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
