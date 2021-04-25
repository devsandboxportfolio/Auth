const express  = require("express")
const app      = express()
const mongoose = require("mongoose")

app.use(express.json())
require('dotenv').config();

const userRouter = require("./routers/userRouter")
app.use("/user", userRouter)

// db
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
const connection = mongoose.connection
connection.once('open', () => {
  console.log("MongoDB database connection established successfully")
})

app.set('port', process.env.PORT || 2000);
module.exports = app;

// server start
app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});