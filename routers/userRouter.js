const express    = require("express")
const router     = express.Router()
const bcrypt     = require("bcrypt")
const User       = require('../models/User')

router.post("/", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = new User({ 
      email: req.body.email, 
      password: hashedPassword, 
      firstName: req.body.firstName, 
      lastName: req.body.lastName 
    })
    await user.save()
    // Generate JWT to send back to client
    res.status(201).send("Successfully created new user")
  } catch (err) {
    res.status(500).send(err)
  }
})

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.status(400).send("Not found!")
  }

  try {
    if(await bcrypt.compare(req.body.password, user.password)) {
      res.status(200).send("Successfully logged in!")
    } else {
      res.status(500).send("Invalid credentials!")
    }
  } catch(err) {
    res.status(500).send(err)
  }
})

router.delete("/", async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.status(400).send("Not found!")
  }

  try {
    if(await bcrypt.compare(req.body.password, user.password)) {
      User.deleteOne({ _id: user._id }).
      then(() => {
        res.status(200).send("Successfully deleted user!")
      }).
      catch((err) => {
        res.status(500).send(err)
      })
    } else {
      res.status(500).send("Invalid credentials!")
    }
  } catch(err) {
    res.status(500).send(err)
  }
})

module.exports = router