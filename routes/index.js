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
  res.render('index', { title: 'Express' });
});

router.get('/register', function(req,res,next){
	res.render('register', {})
})

router.get('/login', function (req,res,next) {
	res.render('login', {})
});


module.exports = router;