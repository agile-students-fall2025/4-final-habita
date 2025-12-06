require("dotenv").config()
const mongoose = require("mongoose")
const Notification = require("./models/Notification")
const { seedNotifications } = require("./data/notifications")

mongoose.connect(process.env.MONGODB_URI)

const run = async () => {
  await Notification.deleteMany({})
  await Notification.insertMany(seedNotifications)

  console.log("Notifications seeded.")
  mongoose.disconnect()
}

run()
