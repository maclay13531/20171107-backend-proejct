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
var url = require("url");
//images will be saved in the public folder
var uploadDir = multer({
	dest: 'public/images'
})
//make sure that imageToUpload matches on the upload.ejs file as well
var nameOfFileField = uploadDir.single('imageToUpload');
var nameOfFileField1 = uploadDir.single('imageToUpload1');

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
		res.locals.lastNameTest = req.session.lname;
		res.locals.emailTest = req.session.email;
		res.locals.profileimgTest = req.session.profileimg;

		// console.log(res.locals.profileimgTest)
		// res.locals.profileUpdated = false;
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
	var phone = req.body.phone;
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
			var insertQuery="insert into users (first_name, last_name, email, password, zipcode, phone) values (?,?,?,?,?,?);";
			var hash = bcrypt.hashSync(passwordOne);
			connection.query(insertQuery, [firstName, lastName, email, hash, zipCode, phone], (error, results, field)=>{
				if(error){
					reject(error);
				}else{
					resolve("insert successful");
				}
			})
		})
	}
	checkData()
	.then((results)=>{
		if(results.length ==0){
			return insertInto();
		}else{
			res.redirect("/register?msg=alreadyRegistered");
		}
	})
	.then((e)=>{
		res.redirect("/login");
	})
	.catch((error)=>{
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
				req.session.profileimg = results[0].profile_imgUrl
				resolve(passwordMatch);
			}else{
				resolve(passwordMatch);
			}
		})
	}
	// if it's a match, make session variables to keep track that it's this person and route them to listings
	checkDB()
	.then((results)=>{
		// console.log(results);
		if(results.length !=0){
			return matchPassword(results);	
		}else{
			return res.redirect("/login?msg=badpassword1");
		}
	})
	.then((password)=>{
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
	var description = req.body.description;
	var tmpPath = req.file.path;
	var targetPath = `public/images/listings/${req.file.originalname}`;
	

	var insertUploadInfo = function () {
		return new Promise(function (resolve, reject) {
			var insertPetInfoQuery = `INSERT INTO upload (user_id, type, cat_breed, dog_breed, name_upload, age, gender, description) VALUES (?,?,?, ?, ?, ?, ?,?)`;
			connection.query(insertPetInfoQuery, [req.session.uid, type, dogBreed, catBreed, name, age, gender,description], (error, results) => {
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
					connection.query(updateQuery, [req.file.originalname, req.session.uid], (dbError, results) => {
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
// listings route
//TODO: need a way to check to make sure everything is not empty
router.get("/listings", (req, res, next)=>{
	// need to get a random animal from db where location is around you
	var currentLocation = req.session.location;
	function getRandomAnimal(){
		return new Promise((resolve, reject)=>{
			//get everything we have form db
			var seletQuery = "select species, name,age,animalID, descriptionPlain, pictures from pets where status = 'available' and animalLocation = ?;";
			connection.query(seletQuery, [currentLocation], (error, results)=>{
				if(error){
					reject(error);
				}else{
					var randomAnimalInArray = Math.floor(Math.random() * results.length);
					// console.log(randomAnimalInArray);
					// console.log(results);
					resolve(results[randomAnimalInArray]);
				}
			})
		});
	}
	getRandomAnimal()
	.then((randomAnimalResults)=>{
		// res.json(randomAnimalResults);
		var description;
		var parsedPhotoUrl = JSON.parse(randomAnimalResults.pictures);
		var photo;
		if(parsedPhotoUrl.length == 0){
			photo = "No Photos";
		}else{
			photo = parsedPhotoUrl[0].originalUrl;
		}
		console.log(photo);
		if(randomAnimalResults.descriptionPlain == null){
			description = "No description at this point.";
		}else{
			description = randomAnimalResults.descriptionPlain;
		}
		res.render("listings", {
			name: randomAnimalResults.name,
			age: randomAnimalResults.age,
			description: description,
			id: randomAnimalResults.animalID,
			photo:photo
		});
	})
	.catch((error)=>{
		console.log(error);
	})
});
//SINGLE PAGE route
router.get("/singles/:id", (req, res, next)=>{
	var anmId = req.params.id;
	// look at the infomration for this specific dog
	function specificInfo(){
		return new Promise((resolve, reject)=>{
			var selectQuery = "SELECT * from pets where animalID = ?;";
			connection.query(selectQuery, [anmId], (error, results)=>{
				if(error){
					reject(error);
				}else{
					resolve(results);
				}
			})
		})
	}
	function searchForContactInfo(specific){
		return new Promise((resolve, reject)=>{
			var searchForInfo ="select distinct orgs.email, orgs.name from orgs inner join pets on orgs.orgID = (select orgID from pets where animalID = ?);";
			connection.query(searchForInfo, [anmId], (error, results)=>{
				if(error){
					reject(error);
				}else{
					resolve({results, specific});
				}
			})
		})
	}
	specificInfo()
	.then((specific)=>{
		var description;
		var photo;
		var parsedPhotoUrl = JSON.parse(specific[0].pictures);
		var contactInfo;
		if(parsedPhotoUrl.length == 0){
			photo = "No Photos";
		}else{
			photo = parsedPhotoUrl[0].originalUrl;
		}
		if(specific[0].descriptionPlain == null){
			description = "No description at this point.";
		}else{
			description = specific[0].descriptionPlain;
		}
		if(contactInfo == undefined){
			return searchForContactInfo(specific);
		}else{
			res.render("singlePage", {
				name: specific[0].name,
				age: specific[0].age,
				description: description,
				photo: photo,
				breed: specific[0].breed,
				sex: specific[0].sex,
				contactInfo: specific[0].contactEmail,
				contactName: specific[0].contactName
			});	
		}
	})
	.then((data)=>{
		var description;
		var photo;
		var parsedPhotoUrl = JSON.parse(data.specific[0].pictures);
		var contactInfo;
		if(parsedPhotoUrl.length == 0){
			photo = "No Photos";
		}else{
			photo = parsedPhotoUrl[0].originalUrl;
		}
		if(data.specific[0].descriptionPlain == null){
			description = "No description at this point.";
		}else{
			description = data.specific[0].descriptionPlain;
		}
		res.render("singlePage", {
			name: data.specific[0].name,
			age: data.specific[0].age,
			description:description,
			photo: photo,
			breed: data.specific[0].breed,
			sex: data.specific[0].sex,
			contactInfo: data.results[0].email,
			contactName: data.results[0].name
		});	
	})
	.catch((error)=>{
		console.log(error);
	})
})
// SEARCH from listings
// TODO: databse messed up, might need to change from cat to dog in db
// TODO: check with drop table if exist query to see if it works
router.post("/search", (req,res,next)=>{








	res.render("searchFromListings");
});



// router.get("/searchListings", (req, res, next)=>{
// 	res.render("searchFromListings");
// })

// test route for dev
router.get("/test", (req, res, next) => {
	res.render('test')
});

// GET Profile route
router.get('/profile',(req,res, next)=>{
	res.render('profile')
})
//Post Profile Route
router.post('/profileChange', nameOfFileField1, (req,res,next)=>{
	var fName = req.body.fName;
	var lName = req.body.lName; 
	var email = req.body.email;
	var tmpPath = req.file.path;
	var targetPath = `public/images/profile_images/${req.file.originalname}`;
	console.log(req.file)

	var updateUserInfo = function () {
		return new Promise(function (resolve, reject) {
			var updateUserInfoQuery = `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?;`;
			connection.query(updateUserInfoQuery, [fName, lName, email, req.session.uid], (error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve("info updated");
				}
			})
		})
	}

	var updateUserImage = function () {
		return new Promise(function (resolve, reject) {
			fs.readFile(tmpPath, (error, fileContents) => {
				if (error) {
					throw error;
				}
				fs.writeFile(targetPath, fileContents, (error) => {
					if (error) {
						throw error;
					}
					var updateQuery = `UPDATE users SET profile_imgUrl = ? WHERE id = ?;`;
					connection.query(updateQuery, [req.file.originalname, req.session.uid], (dbError, results) => {
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

	updateUserInfo().then(function (result) {
		return updateUserImage(result);
	}).then(function (e) {
		res.redirect('/profile');
	})
});

// GET changePassword route
router.get('/changePassword', (req, res, next) => {
	res.render('changePassword')
});

// POST changePassword route 
router.post('/changePasswordSubmit', (req, res, next) =>{
	//extracting info from changePassword
	var currentPass = req.body.currentPassword;
	var newPass = req.body.newPassword;
	var confirmNewPass = req.body.confirmNewPassword;
	var email = req.session.email;
	// Checking if current pass is matched with the one ine the db
	function checkDB(){
		return new Promise((resolve, reject)=>{
			var checkQuery = "select * from users where email = ?;";
			// console.log(email);
			connection.query(checkQuery, [email], (error, results)=>{
				if(error){
					reject(error);
				}else{
					var isMatchInDB = bcrypt.compareSync(currentPass, results[0].password);
					if(isMatchInDB){
						resolve(isMatchInDB);
					}else{
						res.redirect("/changePassword?msg=wrongCurrentPass");
					}
				}
			})
		})
	}

	function checkIfPassMatch(){
		return new Promise((resolve, reject)=>{
			if(newPass != confirmNewPass){
				res.redirect("/changePassword?msg=passwordNotMatch");
			}else{
				resolve("Passwords Match");
			}
		})
	}

	function updatePassword(){
		return new Promise((resolve, reject)=>{
			var hash = bcrypt.hashSync(newPass);
			var updateQuery = `update users 
			set password = ? 
			where email = ?;`;
			connection.query(updateQuery, [hash, email], (error, results)=>{
				if(error){
					reject(error);
				}else{
					resolve("success");
				}
			});
		})
	}
	checkDB()
	.then((results)=>{
		// checking if newpass match with confirmnew pass
		return checkIfPassMatch();
	})
	.then((e)=>{
		// if both pass, then update value in the db
		return updatePassword();
	})
	.then((e)=>{
		res.redirect("/listings");
	})
	.catch((error)=>{
		console.log(error);
	});
});

// GET emailSettings Route 
router.get('/emailSettings',(req,res,next)=>{
	res.render('emailSettings')
});

// GET myListings Route 
router.get('/myListings',(req,res, next)=>{
	
	var getuploadInfo = function() {
		return new Promise(function (resolve, reject) {
			var uploadInfoQuery = `SELECT * FROM upload where user_id = ?`
			connection.query(uploadInfoQuery, [req.session.uid], (error, results) => {
				if (error) {
					reject(error);
				} else {
					resolve(results);
				}
			});
		})	
	}
	
	getuploadInfo().then(function (results) {
		// console.log(results)
		res.render('myListings', {
			uploadResults: results
		})
	})
	
})

// Logout Route
router.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
});
module.exports = router;

// TODO: auth0 issues