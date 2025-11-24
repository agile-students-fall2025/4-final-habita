const mongoose = require("mongoose")

const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn("MONGODB_URI not set; skipping MongoDB connection.")
    return
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return
  }

  mongoose.set("strictQuery", false)
  await mongoose.connect(uri)
  console.log("Connected to MongoDB")
}

const disconnectFromDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
}
