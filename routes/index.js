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
//images will be saved in the public folder
var uploadDir = multer({
	dest: 'public/images'
})
//make sure that imageToUpload matches on the upload.ejs file as well
var nameOfFileField = uploadDir.single('imageToUpload');

//config.db will be given to Bihn/Jason/Jenn by Jong Park.
// var connection = mysql.createConnection(config.db);
// connection.connect(function(error){
// 	if(error){
// 		throw error;
// 	}
// });

const env = {
	AUTH0_CLIENT_ID: config.auth0.clientId,
	AUTH0_DOMAIN: config.auth0.domain,
	AUTH0_CALLBACK_URL: 'http://localhost:3000/callback'
};




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {});
});

// GET Route for Register Page
router.get('/register', function(req,res,next){
	res.render('register', {})
});

// Post Route for Register Page
<<<<<<< HEAD
router.post('/registerProcess', function(req,res, next){
	var firstName = req.body.first_name;
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
			var checkQuery = "";
			connection.query(checkQuery, [],(error, results, field)=>{
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
			var insertQuery="";
			connection.query(insertQuery, [], (error, results, field)=>{
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
=======
router.post('/registerProcess',function(req,res, next){
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var email = req.body.email;
	var password = req.body.password;
	var zipcode = req.body.zipcode;
	// console.log(req.body)
	// We need to make sure this email isn't already registered 
	const selectQuery = `SELECT * FROM users WHERE email = ?;`;
	connection.query(selectQuery, [email], (error, results) => {
		if (results.length != 0) {
			res.redirect('/register?msg=registered');
		} else {
			var hash = bcrypt.hashSync(password);
			var insertQuery = `INSERT INTO users (first_name,last_name, email, password, zipcode) VALUES (?,?,?,?,?)`;
			connection.query(insertQuery, [first_name, last_name, email, hash, zipcode], (error) => {
				if (error) {
					throw error;
				} else {
					res.redirect('/?msg=registered');
				}
			});
		}
	});
>>>>>>> e04597a5d7d98cdd345624be63d123b272ba8379
});

// GET Route for Login Page
router.get('/login', function (req,res,next) {
	res.render('login', {})
});

// Post Route for Login Page
router.post('/loginProcess', function (req, res, next) {
	// check with database to see if it's a match,if not send them back to the registration page

	// if it's a match, make session variables to keep track that it's this person and route them to listings
});
// GET log in with autho
router.get("/registerWithAuth0",
	passport.authenticate('auth0', {
		clientID: env.AUTH0_CLIENT_ID,
		domain: env.AUTH0_DOMAIN,
		redirectUri: env.AUTH0_CALLBACK_URL,
		responseType: 'code',
		audience: 'https://' + env.AUTH0_DOMAIN + '/userinfo',
		scope: 'openid'
	}),
	(req, res, next)=>{
		res.redirect("/");
});
// callback for autho
router.get("/callback", (req, res, next)=>{
	console.log(req.body);
	passport.authenticate('auth0', {
		failureRedirect: '/failure'
	}),
	function(req, res) {
		console.log(req.session);
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
	console.log(req.file)
	res.render('upload', {})
});

// Post Route for Upload Page
router.post('/uploadProcess', function (req, res, next) {
	var type = req.body.type;
	var breed = req.body.breed;
	var name = req.body.name; 
	var age = req.body.age; 
	var gender = req.body.gender; 
	console.log(req.file);
	console.log(req.body);
	var tmpPath = req.file.path;
	var targetPath = `public/images/${req.file.originalname}`;
	var insertPetInfoQuery = `INSERT INTO upload (type, breed, name_upload, age, gender) VALUES (?, ?, ?, ?)`;
	connection.query(selectQuery, [type, breed, name, age, gender], (error, results)=>{
		if (error){
			throw error; 
		}else{

		}
	})
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
				if (dbError) {
					throw dbError
				}
				res.redirect('/')
			})
		})
	})
  // res.json(req.body);
});

router.get("/listings", (req, res, next)=>{
	res.render("listings");
})

router.get("/singles", (req, res, next)=>{
	res.render("singlePage");
})

module.exports = router;

// TODO: update registration with database/ hash password
// TODO: update login with database
// TODO: auth0 issues