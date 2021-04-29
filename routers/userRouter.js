const express    = require("express")
const router     = express.Router()
const controller = require("../controllers/UserController")
const { authenticateToken } = require('devsandbox-authenticate')

router.post("/", controller.create)
router.post("/login", controller.login)
router.put("/logout", authenticateToken, controller.logout)
router.post("/getAccessToken", controller.getAccessToken)
router.delete("/", authenticateToken, controller.delete)

module.exports = router