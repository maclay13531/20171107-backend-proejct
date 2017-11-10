var express = require('express');
var router = express.Router();
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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {});
});

// GET Route for Register Page
router.get('/register', function(req,res,next){
	res.render('register', {})
});

// Post Route for Register Page
router.post('/registerProcess',function(req,res, next){
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var email = req.body.email;
	var password = req.body.password;
	var zipcode = req.body.zipcode;
	console.log(req.body)
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

});

// GET Route for Login Page
router.get('/login', function (req,res,next) {
	res.render('login', {})
});

// Post Route for Login Page
router.post('/loginProcess', function (req, res, next) {

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