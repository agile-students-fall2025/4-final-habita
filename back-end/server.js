#!/usr/bin/env node

require("dotenv").config()

const server = require("./app") // load up the web server
const { connectToDatabase, disconnectFromDatabase } = require("./config/database")

// allow overriding the port with environment variable for flexibility
const port = process.env.PORT || 4000 // default to 4000 to avoid colliding with front-end dev server

let listener

const start = async () => {
  await connectToDatabase()

  // call express's listen function to start listening to the port
  listener = server.listen(port, function () {
    console.log(`Server running on port: ${port}`)
  })
}

start().catch((err) => {
  console.error("Failed to start server", err)
  process.exit(1)
})

// a function to stop listening to the port
const close = async () => {
  if (listener) {
    listener.close()
  }
  await disconnectFromDatabase()
}

module.exports = {
  close: close,
}