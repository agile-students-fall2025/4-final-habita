// back-end/seedChat.js
require("dotenv").config()
const mongoose = require("mongoose")
const ChatThread = require("./models/ChatThread")
const { seedThreads } = require("./data/chat")

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env")
  process.exit(1)
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("Connected to MongoDB")

    await ChatThread.deleteMany({})
    console.log("Cleared existing chat threads")

    const docs = seedThreads.map((t) => ({
      name: t.name,
      contextType: t.contextType,
      contextId: t.contextId === undefined ? null : String(t.contextId),
      participants: t.participants || [],
      tags: t.tags || [],
      readBy: t.readBy || {},
      messages: t.messages || [],
      createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
    }))

    await ChatThread.insertMany(docs)
    console.log(`Inserted ${docs.length} chat thread(s)`)

    await mongoose.disconnect()
    console.log("Done")
    process.exit(0)
  } catch (err) {
    console.error("Error seeding chat threads:", err)
    process.exit(1)
  }
}

run()
