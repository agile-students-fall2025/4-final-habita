require("dotenv").config()

const path = require("path")
const express = require("express")
const passport = require("passport")
const configureJwtStrategy = require("./config/jwt-config")
const notificationsRouter = require("./routes/notifications")
const chatRoutes = require("./routes/chat")
const homeRouter = require("./routes/home")
const billsRouter = require("./routes/bills")
const tasksRouter = require("./routes/tasks")
const moodsRouter = require("./routes/moods")
const authenticationRouter = require("./routes/authentication")
const cookieRouter = require("./routes/cookie-routes")
const protectedContentRoutes = require("./routes/protected-content")
const householdsRouter = require("./routes/households")
const usersRouter = require("./routes/users")
const cors = require("cors")

const app = express()

const rawCorsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000"
const normalizedOrigin = rawCorsOrigin.endsWith("/") ? rawCorsOrigin.slice(0, -1) : rawCorsOrigin
const corsOrigins = [normalizedOrigin, `${normalizedOrigin}/`]
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
)


app.use(express.json())
app.use(express.urlencoded({ extended: false }))
configureJwtStrategy(passport)
app.use(passport.initialize())

const publicDir = path.join(__dirname, "public")
app.use(express.static(publicDir))

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "habita-notifications",
    timestamp: new Date().toISOString(),
  })
})

// Routes
app.use("/api/notifications", notificationsRouter)
app.use("/api/chats", chatRoutes)
app.use("/api/home", homeRouter)
app.use("/api/bills", billsRouter)
app.use("/api/tasks", tasksRouter)
app.use("/api/moods", moodsRouter)
app.use("/api/households", householdsRouter)
app.use("/api/users", usersRouter)
app.use("/api/auth", authenticationRouter())
app.use("/api/cookies", cookieRouter())
app.use("/api/protected", protectedContentRoutes(passport))

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" })
})

module.exports = app
