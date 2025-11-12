const path = require("path")
const express = require("express")
const notificationsRouter = require("./routes/notifications")
const chatRouter = require("./routes/chat")
const homeRouter = require("./routes/home")
const billsRouter = require("./routes/bills")
const tasksRouter = require("./routes/tasks")

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const publicDir = path.join(__dirname, "public")
app.use(express.static(publicDir))

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "habita-notifications",
    timestamp: new Date().toISOString(),
  })
})

app.use("/api/notifications", notificationsRouter)
app.use("/api/chat", chatRouter)
app.use("/api/home", homeRouter)
app.use("/api/bills", billsRouter)
app.use("/api/tasks", tasksRouter)

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" })
})

module.exports = app
