const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt")
const mongoose = require("mongoose")
const User = require("../models/User")

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"), // Authorization: JWT <token>
  secretOrKey: process.env.JWT_SECRET, // must be set in .env
}

const jwtVerifyToken = async (jwtPayload, done) => {
  // extra expiry guard (passport-jwt also checks exp)
  if (jwtPayload.exp && new Date(jwtPayload.exp * 1000) < new Date()) {
    return done(null, false, { message: "JWT token has expired." })
  }

  try {
    const userId = new mongoose.Types.ObjectId(jwtPayload.id)
    const user = await User.findOne({ _id: userId }).select("username")
    if (!user) {
      return done(null, false, { message: "User not found" })
    }

    return done(null, user)
  } catch (err) {
    return done(err, false)
  }
}

const configureJwtStrategy = (passport) => {
  passport.use(new JwtStrategy(jwtOptions, jwtVerifyToken))
}

module.exports = configureJwtStrategy
