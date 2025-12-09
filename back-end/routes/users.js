const express = require("express")
const passport = require("passport")
const User = require("../models/User")

const router = express.Router()
const requireAuth = passport.authenticate("jwt", { session: false })

// Update current user's profile (displayName only for now)
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { displayName } = req.body || {}
    const safeDisplayName = typeof displayName === "string" ? displayName.trim() : ""
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { displayName: safeDisplayName } },
      { new: true }
    ).lean()
    return res.json({
      success: true,
      data: {
        username: user.username,
        displayName: user.displayName || "",
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router



