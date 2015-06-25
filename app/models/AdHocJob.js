// Mongoose Model/Schema for AdHocJob Collection
var mongoose = require('mongoose');

var schema = mongoose.Schema({
	_id				: String,
    JobID      	 	: { type: String, index: true },
    JobName     	: String,
    SQLQuery    	: String, 
    SubmittedByIP 	: String,
    JobRunStatus 	: String,
    CreatedTimeStamp: { type: Date, default:Date.now },
    UpdatedTimeStamp: { type: Date, default:Date.now }
});

module.exports = mongoose.model('AdHocJob', schema, 'AdHocJob');
