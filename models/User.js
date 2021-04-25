const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: String,
  lastName: String
}, {
  timestamps: true
})

module.exports = mongoose.model("User", UserSchema)