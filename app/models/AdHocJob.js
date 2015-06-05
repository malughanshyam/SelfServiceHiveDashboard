var mongoose = require('mongoose');

var schema = mongoose.Schema({
    JobID      	 	: String,
    JobName     	: String,
    SQLQuery    	: String, 
    SubmittedByIP 	: String,
    Status 			: String,
    CreatedTimeStamp: { type: Date, default:Date.now },
    UpdatedTimeStamp: { type: Date, default:Date.now }
});

module.exports = mongoose.model('AdHocJob', schema, 'AdHocJob');
