/**
##############################################################################################
## ------------------------------
## Self Service Hive Dasboard
## ------------------------------
## 
##  File 	: server.js
##  
##  Purpose : Configuration file for the NodeJS Server
##
##  Author  : Ghanshhyam Malu
##            gmalu@ebay.com
##
##  Created : June 17, 2015
##
##  Modified : 
##  
##############################################################################################
*/

// set up ======================================================================
var express  = require('express');
var app      = express(); 								

// load the Logger config
var logger = require('./app/config/logger'); 			

// Load the loggers
var winston = require('winston');
var highLevelLogger = winston.loggers.get('HighLevelLog');
var detailLogger = winston.loggers.get('DetailedLog');

highLevelLogger.info(' ***** Server Started ***** ');
detailLogger.info(' ***** Server Started ***** ');

// Don't crash when an error occurs, instead log it
process.on('uncaughtException', function(err){
	console.log(err);
	highLevelLogger.error(' uncaughtException : ', err );
	detailLogger.error(' uncaughtException : ', err);
});


var mongoose = require('mongoose'); 					// mongoose for mongodb
var port  	 = process.env.PORT || 8096; 				// set the port
var morgan = require('morgan'); 						// log requests to the console (express4)
var bodyParser = require('body-parser'); 				// pull information from HTML POST (express4)
var methodOverride = require('method-override'); 		// simulate DELETE and PUT (express4)
var cookieParser = require('cookie-parser');
var database = require('./app/config/database'); 		// load the database config
var cors = require("cors");

// configuration ===============================================================
mongoose.connect(database.url); 	// connect to mongoDB database on modulus.io

/*
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
*/
app.use(express.static(__dirname + '/public')); 				// set the static files location /public/img will be /img for users
app.use(cors());
app.use(morgan('dev')); 										// log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'})); 			// parse application/x-www-form-urlencoded
app.use(bodyParser.json()); 									// parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

app.set('trust proxy', 'loopback') // specify a single subnet

// routes ======================================================================
require('./app/routes.js')(app);

// listen (start app with node server.js) ======================================
app.listen(port);
console.log("SelfServiceHiveDasboard Server App listening on port " + port);

module.exports = app;
