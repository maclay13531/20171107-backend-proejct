var express = require('express');
var router = express.Router();
const passport = require('passport');
var fs = require('fs');
//msql database is named petBasket and "main" MySQL file will be saved in Jong Park's computer. Jong park to distribute the file to Bihn/Jason/Jenn.
var mysql = require('mysql');
//config folder will be ignored. Jong Park is going to distribute conif info to Bihn/Jason/Jenn. 
var config = require('../config/config');
var bcrypt = require('bcrypt-nodejs');
var multer = require('multer');
var request = require("request");
//images will be saved in the public folder
var uploadDir = multer({
	dest: 'public/images'
})
//make sure that imageToUpload matches on the upload.ejs file as well
var nameOfFileField = uploadDir.single('imageToUpload');

// config.db will be given to Bihn/Jason/Jenn by Jong Park.
var connection = mysql.createConnection(config.db);
connection.connect(function(error){
	if(error){
		throw error;
	}
});

const env = {
	AUTH0_CLIENT_ID: config.auth0.clientId,
	AUTH0_DOMAIN: config.auth0.domain,
	AUTH0_CALLBACK_URL: 'http://localhost:3000/callback'
};

/* GET home page. */

router.all("/*", (req,res,next)=>{
	if(req.session.uid == undefined){
		console.log("you are not loggedin");
		next();
	}else if(req.session.uid != undefined){
		console.log("YOU ARE LOGGEDIN");
		//mention this middleware
		res.locals.firstNameTest = req.session.fname;
		var sessionName = res.locals.firstNameTest;
		// console.log(req.session.uid)
		next();
	}
});

router.get('/', function(req, res, next) {
  res.render('index', {});
});

// GET Route for Register Page
router.get('/register', function(req,res,next){
	res.render('register', {})
});

// Post Route for Register Page
router.post('/registerProcess', function(req,res, next){
	var firstName = req.body.first_name;
	// console.log(firstName)
	var lastName = req.body.last_name;
	var email = req.body.email;
	var passwordOne=req.body.passwordOne;
	var passwordTwo = req.body.passwordTwo;
	//checking password match
	if(passwordOne != passwordTwo){
		res.redirect("/register?msg=PasswordNotMatch");
	}
	var zipCode = req.body.zipCode;
	//check to see if it's in the database
	//HASH PASSWORD before inseting
	function checkData(){
		return new Promise((resolve, reject)=>{
			var checkQuery = "select * from users where email = ?;";
			connection.query(checkQuery, [email],(error, results, field)=>{
				if(error){
					reject(error);
				}else{
					resolve(results);
				}
			})
		})
	}
	//insert into database
	function insertInto(){
		return new Promise((resolve, reject)=>{
			var insertQuery="insert into users (first_name, last_name, email, password, zipcode) values (?,?,?,?,?);";
			var hash = bcrypt.hashSync(passwordOne);
			connection.query(insertQuery, [firstName, lastName, email, hash, zipCode], (error, results, field)=>{
				if(error){
					reject(error);
				}else{
					resolve("insert successful");
				}
			})
		})
	}
	checkData().then((results)=>{
		if(results.length ==0){
			return insertInto();
		}else{
			res.redirect("/register?msg=alreadyRegistered");
		}
	}).then((e)=>{
		res.redirect("/login");
	}).catch((error)=>{
		throw error;
	})
});

// GET Route for Login Page
router.get('/login', function (req,res,next) {
	res.render('login', {})
});

// Post Route for Login Page
router.post('/loginProcess', function (req, res, next) {
	// check with database to see if it's a match,if not send them back to the registration page
	var email = req.body.email;
	var password = req.body.password;

	function checkDB(){
		return new Promise((resolve, reject)=>{
			var checkQuery = "select * from users where email = ?;";
			// console.log(email);
			connection.query(checkQuery, [email], (error, results)=>{
				if(error){
					reject(error);
				}else{
					resolve(results);
				}
			})
		})
	}

	function matchPassword(results){
		return new Promise((resolve, reject)=>{
			var passwordMatch = bcrypt.compareSync(password, results[0].password);
			if(passwordMatch){
				req.session.fname = results[0].first_name;
				req.session.lname = results[0].last_name;
				req.session.email = results[0].email;
				req.session.uid = results[0].id;
				req.session.location = results[0].zipcode;
				resolve(passwordMatch);
			}else{
				resolve(passwordMatch);
			}
		})
	}
	// if it's a match, make session variables to keep track that it's this person and route them to listings
	checkDB().then((results)=>{
		// console.log(results);
		if(results.length !=0){
			return matchPassword(results);	
		}else{
			return res.redirect("/login?msg=badpassword1");
		}
	}).then((password)=>{
		if(password){
			return res.redirect("/listings");
		}
		if(!password){
			return res.redirect("/login?msg=badpassword2");
		}
	});
});
// GET log in with autho
router.get("/registerWithAuth0",
	passport.authenticate('auth0', {
		clientID: env.AUTH0_CLIENT_ID,
		domain: env.AUTH0_DOMAIN,
		redirectUri: env.AUTH0_CALLBACK_URL,
		responseType: 'code',
		audience: 'https://' + env.AUTH0_DOMAIN + '/userinfo',
		scope: 'openid '
	}),
	(req, res, next)=>{
		res.redirect("/");
});
// callback for autho
router.get("/callback", (req, res, next)=>{
	// console.log(req.session.passport);
	passport.authenticate('auth0', {
		failureRedirect: '/failure'
	}),
	function(req, res) {
		// console.log(req.session);
		res.redirect('/');
	}
});
// if callback failled
router.get('/failure', function(req, res) {
	var error = req.flash("error");
	var error_description = req.flash("error_description");
	req.logout();
	res.render('failure', {
	  	error: error[0],
	  	error_description: error_description[0],
	});
});
  
// GET Route for Upload Page
router.get('/upload', function(req, res, next){
	// console.log(req.file)
	res.render('upload', {})
});
// Post Route for Upload Page
router.post('/uploadProcess', nameOfFileField, (req, res, next) => {
	var type = req.body.breed_type_select;
	var dogBreed = req.body.dog_breed_select;
	var catBreed = req.body.cat_breed_select;
	var name = req.body.pet_name;
	var age = req.body.age;
	var gender = req.body.gender;
	var tmpPath = req.file.path;
	var targetPath = `public/images/${req.file.originalname}`;
	

	var insertUploadInfo = function () {
		return new Promise(function (resolve, reject) {
			var insertPetInfoQuery = `INSERT INTO upload (user_id, type, cat_breed, dog_breed, name_upload, age, gender) VALUES (?,?,?, ?, ?, ?, ?)`;
			connection.query(insertPetInfoQuery, [req.session.uid, type, dogBreed, catBreed, name, age, gender], (error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve("info added");
				}
			})
		})
	}

	var insertImage = function () {
		return new Promise(function (resolve, reject) {
			fs.readFile(tmpPath, (error, fileContents) => {
				if (error) {
					throw error;
				}
				fs.writeFile(targetPath, fileContents, (error) => {
					if (error) {
						throw error;
					}
					var updateQuery = `UPDATE upload SET img_url = ? WHERE user_id = ?;`;
					connection.query(updateQuery, [req.file.path, req.session.uid], (dbError, results) => {
						console.log(req.file.path);
						if (error) {
							reject(error);
						} else {
							resolve("image added");
						}
					})
				})
			})
		})
	}

	insertUploadInfo().then(function (result) {
		return insertImage(result);
	}).then(function(e){
		res.redirect('/uploadSuccess')
	})
	// insertUploadInfo().catch((error) => {
	// 	res.json(error);
	// });
	// insertImage().catch((error) => {
	// 	res.json(error);
	// });
});

router.get('/uploadSuccess',(req,res,next)=>{
	res.render('uploadSuccess')
})
// listings route, wants to print out featured animals which is pet.getRandom
router.get("/listings", (req, res, next)=>{
	//gets random animal dogs for now
	function getAnimalID(){
		var animalRandom;
		var rand = Math.random() * 10;
		if(rand<=5){
			animalRandom = "cat";
		}else{
			animalRandom = "dog";
		}
		return new Promise((resolve,reject)=>{
			var randomAnimal = `http://api.petfinder.com/pet.getRandom?key=${config.petFinderApi}&animal=${animalRandom}&ouput=id&format=json`;
			request(randomAnimal, (error, response)=>{
				if(error){
					reject(error);
				}else{
					var parsedData = JSON.parse(response.body);
					resolve(parsedData);
					// resolve(response.body[0].petfinder.petIds.id.$t);
				}
			})
		})
	}

	function getRandomPet(animalID){
		return new Promise((resolve, reject)=>{
			var randomAnimal = `http://api.petfinder.com/pet.get?key=${config.petFinderApi}&id=${animalID}&format=json`;
			request(randomAnimal, (error, response)=>{
				if(error){
					reject(error);
				}else{
					var parsedData = JSON.parse(response.body);
					resolve(parsedData);
				}
			})
		})
	}
	getAnimalID().then((data)=>{
		//this is the animalID that's getting resolved
		var animalID = data.petfinder.petIds.id.$t;
		console.log(animalID);
		return getRandomPet(animalID);
	}).then((animal)=>{
		var animalPhoto = animal.petfinder.pet.media.photos.photo[3].$t;
		var animalAge = animal.petfinder.pet.age.$t;
		var animalBreed = animal.petfinder.pet.breeds.breed.$t;
		var animalName = animal.petfinder.pet.name.$t;
		var animalDescription = animal.petfinder.pet.description.$t;
		var petId = animal.petfinder.pet.id.$t;
		console.log(petId);
		if(animalPhoto == undefined){
			animalPhoto = "No photos at this point";
		}
		if(animalDescription == undefined){
			animalDescription = "No description at this point";
		}
		res.render("listings", {
			photo: animalPhoto,
			age: animalAge,
			breed: animalBreed,
			name: animalName,
			description: animalDescription,
			id: petId
		});
		// res.json(animal);
	}).catch((error)=>{
		console.log(error);
	})
	//gets info and display to screen
});

//SINGLE PAGE route
router.get("/singles/:id", (req, res, next)=>{
	var id = req.params.id;
	function getPet(id){
		return new Promise((resolve, reject)=>{
			var randomAnimal = `http://api.petfinder.com/pet.get?key=${config.petFinderApi}&id=${id}&format=json`;
			request(randomAnimal, (error, response)=>{
				if(error){
					reject(error);
				}else{
					var parsedData = JSON.parse(response.body);
					resolve(parsedData);
				}
			})
		})
	}
	getPet(id).then((animal)=>{
		var animalPhoto = animal.petfinder.pet.media.photos.photo;
		var bigPic = animal.petfinder.pet.media.photos.photo[3].$t;
		var animalAge = animal.petfinder.pet.age.$t;
		var animalBreed = animal.petfinder.pet.breeds.breed.$t;
		var animalName = animal.petfinder.pet.name.$t;
		var animalDescription = animal.petfinder.pet.description.$t;
		var sex = animal.petfinder.pet.sex.$t;
		var phone = animal.petfinder.pet.contact.phone.$t;
		if(animalBreed == undefined){
			animalBreed == "unknown";
		}
		if(animalPhoto == undefined){
			animalPhoto = "No photos at this point";
		}
		if(animalDescription == undefined){
			animalDescription = "No description at this point";
		}
		res.render("singlePage", {
			photo: animalPhoto,
			age: animalAge,
			breed: animalBreed,
			name: animalName,
			sex: sex,
			phone:phone,
			description: animalDescription,
			bigPic :bigPic
		});
		// res.json(animal);
	}).catch((error)=>{
		console.log(error);
	});
})
//===================need to work on this===================
// SEARCH from INDEX will go back to listings and replace the search results with what we got from api and database
router.post("/search", (req,res,next)=>{
	var type = req.body.typeSelect;
	var breedSelect;
	if(type == "dog"){
		breedSelect = req.body.dog_breed_select;
	}else if(type == "cat"){
		breedSelect = req.body.cat_breed_select;
	}
	var location = req.body.location;
	var age = req.body.ageSelect;
	var gender = req.body.genderSelect;

	function requestAPI(){
		return new Promise((resolve, reject)=>{
			var requestString = `http://api.petfinder.com/pet.find?key=${config.petFinderApi}&animal=${type}&breed=${breedSelect}&location=${location}&age=${age}&format=json`;
			request(requestString, (error, response)=>{
				if(error){
					reject(error);
				}else{
					resolve(response);
				}
			})
		})
	}

	requestAPI().then((data)=>{
		// console.log(data);
		res.send(data.body);
	})
});
router.get("/test", (req, res, next) => {
	res.render('test')
});

router.get('/profile',(req,res, next)=>{
	res.render('profile')
})

router.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
});
module.exports = router;

// TODO: update registration with database/ hash password
// TODO: update login with database
// TODO: auth0 issues