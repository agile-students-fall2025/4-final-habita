const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt")
const mongoose = require("mongoose")
const User = require("../models/User")

const jwtOptions = {
  // 1. FIX: Change to 'fromAuthHeaderAsBearerToken' to match Frontend's "Bearer" scheme
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
  
  // 2. FIX: Add the fallback to match User.js exactly
  secretOrKey: process.env.JWT_SECRET || "dev_local_jwt_secret",
}

const jwtVerifyToken = async (jwtPayload, done) => {
  // extra expiry guard
  if (jwtPayload.exp && new Date(jwtPayload.exp * 1000) < new Date()) {
    return done(null, false, { message: "JWT token has expired." })
  }

  try {
    const userId = new mongoose.Types.ObjectId(jwtPayload.id)
    const user = await User.findOne({ _id: userId }).select("username householdId")
    
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
