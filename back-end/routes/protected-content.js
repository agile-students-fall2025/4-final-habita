const express = require("express")

const protectedContentRoutes = (passport) => {
  const router = express.Router()

  router.get("/", passport.authenticate("jwt", { session: false }), (req, res) => {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
      },
      message:
        "Congratulations: you have accessed this route because you have a valid JWT token!",
    })
  })

  return router
}

module.exports = protectedContentRoutes
