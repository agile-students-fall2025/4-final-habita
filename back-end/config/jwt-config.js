const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt")
const User = require("../models/User")

const jwtSecret = process.env.JWT_SECRET || "dev_local_jwt_secret"

const configureJwtStrategy = (passport) => {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"), // expect "Authorization: JWT <token>"
    secretOrKey: jwtSecret,
  }

  passport.use(
    new JwtStrategy(options, async (jwtPayload, done) => {
      try {
        // extra expiry guard (passport-jwt also checks exp)
        if (jwtPayload.exp && new Date(jwtPayload.exp * 1000) < new Date()) {
          return done(null, false, { message: "JWT token has expired." })
        }

        const user = await User.findById(jwtPayload.id).select("username")
        if (!user) {
          return done(null, false, { message: "User not found" })
        }

        return done(null, { id: user.id, username: user.username })
      } catch (err) {
        return done(err, false)
      }
    })
  )
}

module.exports = configureJwtStrategy
