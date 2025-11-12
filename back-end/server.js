#!/usr/bin/env node

const server = require("./app") // load up the web server

// allow overriding the port with environment variable for flexibility
const port = process.env.PORT || 4000 // default to 4000 to avoid colliding with front-end dev server

// call express's listen function to start listening to the port
const listener = server.listen(port, function () {
  console.log(`Server running on port: ${port}`)
})

// a function to stop listening to the port
const close = () => {
  listener.close()
}

module.exports = {
  close: close,
}
