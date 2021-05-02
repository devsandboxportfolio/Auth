const User   = require('../models/User')
const bcrypt = require('bcrypt')
const jwt    = require('jsonwebtoken')

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' })
}

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET)
}

// Create user
exports.create = async (req, res) => {
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
}

// Login
exports.login = async (req, res) => {
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
        res.status(200).send({ accessToken: accessToken, refreshToken: refreshToken, expiresAt: new Date().getTime() + 10*60000 })
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
}

// Logout
exports.logout = async (req, res) => {
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
}

// Get new access token
exports.getAccessToken = async (req, res) => {
  const refreshToken = req.body.refreshToken
  const user = await User.findOne({email: req.body.email})
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
    res.json({ accessToken: accessToken, expiresAt: new Date().getTime() + 10*60000 })
  })
}

// Delete user
exports.delete = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId })
  if (!user) {
    return res.status(400).send("User not found!")
  }

  try {
    User.deleteOne({ _id: user._id }).
    then(() => {
      res.status(200).send("Successfully deleted user!")
    }).
    catch((err) => {
      res.status(500).send(err)
    })
  } catch(err) {
    res.status(500).send(err)
  }
}