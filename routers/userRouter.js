const express    = require("express")
const router     = express.Router()
const bcrypt     = require("bcrypt")
const User       = require('../models/User')
const jwt        = require('jsonwebtoken')

app.use(express.json())

// Create user
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
    
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)
    await User.updateOne(
      {_id: user._id}, 
      {$set: {
        refreshToken: refreshToken
      }}
    ).
    then(() => {
      res.status(201).send({ accessToken: accessToken, refreshToken: refreshToken})
    }).
    catch((err) => {
      res.status(500).send(err)
    })
  } catch (err) {
    res.status(500).send(err)
  }
})

// login
router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.status(400).send("Not found!")
  }

  try {
    if(await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = generateAccessToken(user)
      const refreshToken = generateRefreshToken(user)
      await User.updateOne(
        {_id: user._id}, 
        {$set: {
          refreshToken: refreshToken
        }}
      ).
      then(() => {
        res.status(200).send({ accessToken: accessToken, refreshToken: refreshToken})
      }).
      catch((err) => {
        res.status(500).send(err)
      })
    } else {
      res.status(401).send("Invalid credentials!")
    }
  } catch(err) {
    res.status(500).send(err)
  }
})

// Logout
router.put("/logout", authenticateToken, async (req, res) => {
  try {
    await User.updateOne(
      {_id: req.user.userId}, 
      {$set: {
        refreshToken: ''
      }}
    ).
    then(() => {
      res.status(200).send()
    }).
    catch((err) => {
      res.status(500).send(err)
    })
  } catch(err) {
    res.status(500).send(err)
  }
})

// Get new accessToken
router.post("/getAccessToken", async (req, res) => {
  const refreshToken = req.body.refreshToken
  const user = await User.findOne(req.body.email)
  if (!user) {
    return res.status(400).send("User not found!")
  }

  if (user.refreshToken != refreshToken) {
    return res.status(403).send()
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send()
    }

    const accessToken = generateAccessToken(user)
    res.json({ accessToken: accessToken })
  })
})

// Delete user
router.delete("/", authenticateToken, async (req, res) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return res.status(400).send("User not found!")
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
      res.status(401).send("Invalid credentials!")
    }
  } catch(err) {
    res.status(500).send(err)
  }
})

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET)
}

const authenticateToken = (req, res, callback) => {
  const authHeader = req.headers['authorization']
  const accessToken = authHeader && authHeader.split(' ')[1]

  if (!accessToken) {
    return res.sendStatus(401)
  }

  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403)
    }

    req.user = user
    callback()
  })
};

module.exports = router