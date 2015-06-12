var mongoose = require('mongoose');

var schema = mongoose.Schema({
	_id				: String,
    JobID      	 	: String,
    JobName     	: String,
    SQLQuery    	: String,
    ExecutionTime	: { Hours: Number, Minutes: Number}, 
    ExecutionDays	: { SUN: Boolean, MON : Boolean , TUE : Boolean, WED: Boolean, THU: Boolean, FRI: Boolean, SAT: Boolean },
    NotifyFlag 		: Boolean,
    NotifyEmail 	: [String],
    SubmittedByIP 	: String,
    LastRunStatus 	: String,
    CreatedTimeStamp: { type: Date, default:Date.now },
    UpdatedTimeStamp: { type: Date, default:Date.now }
});

module.exports = mongoose.model('ScheduledJob', schema, 'ScheduledJob');