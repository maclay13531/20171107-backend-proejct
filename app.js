var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config/config');
var session = require('express-session');
var Auth0Strategy = require('passport-auth0')
var passport = require('passport')
var index = require('./routes/index');
var users = require('./routes/users');
var photos = require('./routes/photos');
const flash = require('connect-flash');


// This will configure Passport to use Auth0
const strategy = new Auth0Strategy({
	  domain: config.auth0.domain,
	  clientID: config.auth0.clientId,
	  clientSecret: config.auth0.clientSecret,
	  callbackURL: 'http://localhost:3000/callback'
	},function(accessToken, refreshToken, extraParams, profile, done) {
	  // accessToken is the token to call Auth0 API (not needed in the most cases)
	  // extraParams.id_token has the JSON Web Token
	  // profile has all the information from the user
	  return done(null, profile);
	}
);

passport.use(strategy);
// you can use this section to keep a smaller payload
passport.serializeUser(function(user, done) {
	done(null, user);
});
  
passport.deserializeUser(function(user, done) {
	done(null, user);
});
var app = express();
var sessionOptions = {
	secret: config.sessionSalt,
	resave: false,
	saveUninitialized: true
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/photos', photos);


app.use(flash());

// Handle auth failure error messages
app.use(function(req, res, next) {
 if (req && req.query && req.query.error) {
   req.flash("error", req.query.error);
 }
 if (req && req.query && req.query.error_description) {
   req.flash("error_description", req.query.error_description);
 }
 next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;