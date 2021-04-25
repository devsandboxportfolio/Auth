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
    res.status(201).send()
  } catch (err) {
    res.status(500).send(err)
  }
})

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.status(400).send()
  }

  try {
    if(bcrypt.compare(req.body.password, user.password)) {
      res.status(200).send("Good")
    } else {
      res.status(500).send("Bad")
    }
  } catch(err) {
    res.status(500).send(err)
  }
})

router.delete("/delete", async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.status(400).send()
  }

  try {
    if(bcrypt.compare(req.body.password, user.hashedPassword)) {
      await User.deleteOne({email: req.params.email})
      res.status(200).send()
    } else {
      res.status(500).send()
    }
  } catch(err) {
    res.status(500).send(err)
  }
})

module.exports = router