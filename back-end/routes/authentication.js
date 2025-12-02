const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")

const authenticationRouter = () => {
  const router = express.Router()
  const isDbConnected = () => User.db && User.db.readyState === 1

  // /auth/signup
  router.post(
    "/signup",
    [
      body("username")
        .isString()
        .trim()
        .isLength({ min: 3 })
        .withMessage("Username must be at least 3 characters."),
      body("password")
        .isString()
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters."),
    ],
    async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      if (!isDbConnected()) {
        return res
          .status(503)
          .json({ success: false, message: "Database connection not established." })
      }

      const { username, password } = req.body

      try {
        const existingUser = await User.findOne({ username: username.toLowerCase() }).exec()
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: "User already exists.",
          })
        }

        const user = await new User({ username, password }).save()
        const token = user.generateJWT()

        return res.json({
          success: true,
          message: "User saved successfully.",
          token,
          username: user.username,
        })
      } catch (err) {
        console.error(`Failed to save user: ${err}`)
        return res.status(500).json({
          success: false,
          message: "Error saving user to database.",
          error: err.message,
        })
      }
    }
  )

  // /auth/login
  router.post(
    "/login",
    [
      body("username").isString().trim().notEmpty().withMessage("Username is required."),
      body("password").isString().notEmpty().withMessage("Password is required."),
    ],
    async (req, res) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      if (!isDbConnected()) {
        return res
          .status(503)
          .json({ success: false, message: "Database connection not established." })
      }

      const { username, password } = req.body

      try {
        const user = await User.findOne({ username: username.toLowerCase() }).exec()
        if (!user) {
          console.error("User not found.")
          return res.status(401).json({
            success: false,
            message: "User not found in database.",
          })
        }

        const isValidPassword = await user.validPassword(password)
        if (!isValidPassword) {
          console.error("Incorrect password.")
          return res.status(401).json({
            success: false,
            message: "Incorrect password.",
          })
        }

        const token = user.generateJWT()
        return res.json({
          success: true,
          message: "User logged in successfully.",
          token,
          username: user.username,
        })
      } catch (err) {
        console.error(`Error looking up user: ${err}`)
        return res.status(500).json({
          success: false,
          message: "Error looking up user in database.",
          error: err.message,
        })
      }
    }
  )

  // /auth/logout
  router.get("/logout", (_req, res) => {
    return res.json({
      success: true,
      message:
        "There is actually nothing to do on the server side... you simply need to delete your token from the browser's local storage!",
    })
  })

  return router
}

module.exports = authenticationRouter
