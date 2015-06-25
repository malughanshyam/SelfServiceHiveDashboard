// Mongoose Model/Schema for Scheduled Job Collection
var mongoose = require('mongoose');

var schema = mongoose.Schema({
	_id				: String,
    JobID           : { type: String, index: true },
    JobName     	: String,
    SQLQuery    	: String,
    ExecutionTime	: { Hours: String, Minutes: String}, 
    ExecutionDays	: { SUN: Boolean, MON : Boolean , TUE : Boolean, WED: Boolean, THU: Boolean, FRI: Boolean, SAT: Boolean },
    NotifyFlag 		: Boolean,
    NotifyEmail 	: String,
    SubmittedByIP 	: String,
    ScheduleStatus  : String,
    JobRunStatus 	: String,
    CronTabJob      : String,
    CreatedTimeStamp: { type: Date, default:Date.now },
    UpdatedTimeStamp: { type: Date, default:Date.now }
});

module.exports = mongoose.model('ScheduledJob', schema, 'ScheduledJob');
