const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Logging middleware
app.use((req, res, next) => {
  console.log(req.method  + " " + req.path + " - " + req.ip)
  return next()
})

// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// })

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// MongoDB Schema
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  userId : {type: Number},
  username : {type: String, required: true}
})

var ExerciseSchema = new Schema({
  userId : { type : Number, required: true },
  description : { type: String, required: true },
  duration : { type: Number, required: true },
  date : { type : Date }
})

var User = mongoose.model('User', UserSchema)
var Exercise = mongoose.model('Exercise', ExerciseSchema)

// API
app.post('/api/exercise/new-user', function(req, res) {
  
  User.countDocuments({}, function (err, count) {
    if(err) console.error(err)

    User.create({ username : req.body.username, userId : count + 1}, function(err, user) {
      if(err) console.err(err)
      
      res.json({ userId: user.userId, username: user.username })
    
    })
  })
})

app.post('/api/exercise/add', function(req, res) {
  
  Exercise.create({ userId : req.body.userId, description : req.body.description, duration : req.body.duration, date : req.body.date }, function(err, exercise) {
    if(err) console.error(err)
    
    res.json({userId: exercise.userId, description : exercise.description, duration : exercise.duration, date : exercise.date })
    
  })
})

app.get('/api/exercise/log', function(req, res) {
  
  let QueryObj = { userId : req.query.userId }
  
  if(req.query.from && req.query.to) {
    QueryObj = Object.assign(QueryObj, { date : { $gte : req.query.from, $lte : req.query.to  }})
  }
  
  let Options = {}
  
  if(req.query.limit) {
    Options = Object.assign(Options, {limit : parseInt(req.query.limit) })
  }
  
  Exercise.find(QueryObj, 'userId description duration date', Options, function(err, exercise) {
    if(err) console.error(err)
    res.json(exercise)
    
  })

})