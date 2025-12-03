const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const JWT_EXP_DAYS = parseInt(process.env.JWT_EXP_DAYS || "7", 10)

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
      default: null,
    },
    displayName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  const hash = await bcrypt.hash(this.password, 10)
  this.password = hash
})

UserSchema.methods.validPassword = function (password) {
  return bcrypt.compare(password, this.password)
}

UserSchema.methods.generateJWT = function () {
  const today = new Date()
  const exp = new Date(today)
  exp.setDate(today.getDate() + JWT_EXP_DAYS)

  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      exp: parseInt(exp.getTime() / 1000),
    },
    process.env.JWT_SECRET || "dev_local_jwt_secret"
  )
}

UserSchema.methods.toAuthJSON = function () {
  return {
    username: this.username,
    token: this.generateJWT(),
  }
}

const User = mongoose.model("User", UserSchema)

module.exports = User
