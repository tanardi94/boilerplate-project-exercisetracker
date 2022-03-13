const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({extended: false}))

mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema

const userSchema = new Schema({
	username: {
		type: String,
		required: true
	},

	log: [
		{
		    description: { 
				type: String, 
				required: true 
			},
		    duration: { 
				type: Number, 
				required: true 
			},
		    date: {
				type: Date, 
				required: true 
			}
  		}
	]
})


const User = mongoose.model("User", userSchema)


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

app.post("/api/users", (req, res) => {
	let namee = req.body.username

	var user = new User(
		{
			username: namee
		}
	)

	user.save( (err, data) => {
		if (err) return console.log(err)
		res.send({
			_id: data._id,
			username: namee
		})
	})
})

app.get('/api/users',(req,res)=>{
	User.find({},function(err,users) {
	    var getUsers = [];
	
	    users.forEach(function(user) {    
	    	getUsers.push({
	        "_id":user._id,
	        "username": user.username
			})     
	    });
	    res.send(getUsers);  
	})
})



app.get("/api/users/:id/logs", (req, res) => {
	let userid = req.params.id

	const fromQuery = req.query.from;
	const toQuery = req.query.to;
	const limitQuery = +req.query.limit;

	
	User.findById(userid, (err, found) => {
		if (err) return console.log(err)

		let log = found.log.map( (data) => {
			return {
				description: data.description,
				duration: data.duration,
				date: new Date(data.date).toDateString()
			}
		})

		if (fromQuery) {
			var froms = new Date(fromQuery)
			log = log.filter(param => new Date(param.date) >= froms)
		}

		if (toQuery) {
			var tos = new Date(toQuery)
			log = log.filter(param => new Date(param.date) <= tos)
		}

		if (limitQuery) {
			log = log.slice(0, limitQuery)
		}

		
		
		res.send({
			username: found.username,
			count: log.length,
			_id: userid,
			log: log,
		})
	})
})

app.post("/api/users/:_id/exercises", (req, res) => {
	let userid = req.params._id
	let description = req.body.description
	let duration = req.body.duration
	let date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()


	const expObj = {
    	description,
    	duration,
		date
	}

	User.findByIdAndUpdate(
	userid,
	{$push:{log:expObj}},
	{new:true},
	(err,updatedUser)=>{
	  if(err) {
		return console.log('update error:',err);
	  }
	  
	  let returnObj ={
		"_id":userid,
		"username":updatedUser.username,
		"date":expObj.date,
		"duration":parseInt(expObj.duration),
		"description":expObj.description
	  }
	  res.json(returnObj)
	}
	)
})
