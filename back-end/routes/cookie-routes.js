const express = require("express")

// lightweight cookie parser so req.cookies is available without extra deps
const parseCookies = (req, _res, next) => {
  const header = req.headers?.cookie
  req.cookies = {}
  if (header) {
    header.split(";").forEach((cookie) => {
      const [key, ...val] = cookie.split("=")
      if (!key) return
      req.cookies[key.trim()] = decodeURIComponent(val.join("=").trim())
    })
  }
  next()
}

const cookieRouter = () => {
  const router = express.Router()
  router.use(parseCookies)

  router.get("/set", (_req, res) => {
    res
      .cookie("foo", "bar") // send a cookie in the response with the key 'foo' and value 'bar'
      .send({
        success: true,
        message: "Sent a cookie to the browser... hopefully it saved it.",
      })
  })

  router.get("/get", (req, res) => {
    const numCookies = Object.keys(req.cookies || {}).length
    console.log(`Incoming cookie data: ${JSON.stringify(req.cookies, null, 0)}`)
    res.send({
      success: numCookies > 0,
      message: numCookies
        ? "thanks for sending cookies to the server :)"
        : "no cookies sent to server :(",
      cookieData: req.cookies,
    })
  })

  return router
}

module.exports = cookieRouter
