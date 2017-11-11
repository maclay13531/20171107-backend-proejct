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
		console.log(req.session.uid)
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
router.post('/uploadProcess', function (req, res, next) {
	var type = req.body.breed_type_select;
	var dogBreed = req.body.dog_breed_select;
	var catBreed = req.body.cat_breed_select; 
	var name = req.body.pet_name;
	var age = req.body.age; 
	var gender = req.body.gender; 
	console.log(req.file);
	console.log(req.session.id);
	console.log(req.body.dog_breed_select);
	console.log(name);
	
	var insertUploadInfo = function(){
		return new Promise(function(resolve,reject){
			var insertPetInfoQuery = `INSERT INTO upload (type, cat_breed, dog_breed, name_upload, age, gender) VALUES (?,?, ?, ?, ?, ?)`;
			connection.query(insertPetInfoQuery, [type, dogBreed, catBreed, name, age, gender], (error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve("info added");
				}
			})
		})
	}

	var insertImage = function(){
		return new Promise(function(resolve, reject){
			var tmpPath = req.file.path;
			var targetPath = `public/images/${req.file.originalname}`;
			fs.readFile(tmpPath, (error, fileContents) => {
				if (error) {
					throw error;
				}
				fs.writeFile(targetPath, fileContents, (error) => {
					if (error) {
						throw error;
					}
					var insertQuery = `INSERT INTO images (imageURL)
                          VALUES (?);`;
					connection.query(insertQuery, [req.file.originalname], (dbError, results) => {
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
		return insertImage(result)
	});
	insertUploadInfo().catch((error) => {
		res.json(error);
	});
 
});

router.get("/listings", (req, res, next)=>{

	// var requestString = `http://api.petfinder.com/pet.find?key=${config.petFinderApi}&animal=dog&location=${req.session.location}&format=json`;
	res.render("listings");
});

router.get("/singles", (req, res, next)=>{
	res.render("singlePage");
})

// SEARCH from INDEX
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
	res.redirect("/listings");
});
router.get("/test", (req, res, next) => {
	res.render('test')
});

router.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
});
module.exports = router;

// TODO: update registration with database/ hash password
// TODO: update login with database
// TODO: auth0 issues