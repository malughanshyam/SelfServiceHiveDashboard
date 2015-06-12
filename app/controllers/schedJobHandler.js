// Load the Modules
var fs = require('fs-extra');
var sys = require('sys')
var child_process = require('child_process');
var dataDir = "data/";
var path = require('path');
var mongoose = require('mongoose');

// Load the loggers
var winston = require('winston');
var highLevelLogger = winston.loggers.get('HighLevelLog');
var detailLogger = winston.loggers.get('DetailedLog');

// highLevelLogger.debug("Debug")
// highLevelLogger.verbose("verbose")
// highLevelLogger.info("info")
// highLevelLogger.warn("warn")
// highLevelLogger.error("error")

// detailLogger.debug("Debug")
// detailLogger.verbose("verbose")
// detailLogger.info("info")
// detailLogger.warn("warn")
// detailLogger.error("error")


// Include the MongoDB Schema 
ScheduledJob = require('../models/ScheduledJob');

// Get all Scheduled Jobs
exports.getAllSchedJobs = function(req, res){

};

// Create new AdHoc Job
exports.submitNewScheduledJob = function(req, res) {
	
    // Initialize the AdHoc Job Variables
    var jobName = req.body.jobName;
    if (jobName == null || jobName == '') {
        jobName = 'UnNamed Job'
    }

    var sqlQuery = req.body.hiveQuery;
    if (sqlQuery == null) {
        sqlQuery = '';
    }

    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
    var jobStatus = 'JOB_NOT_STARTED'

    // Create a new Job ID 	
    var ObjectId = mongoose.Types.ObjectId;
    jobID = new ObjectId;

    jobID = jobID.toString();

    detailLogger.info(' JobID - %s New AdHoc Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : jobName, sqlQuery : sqlQuery  }));
    highLevelLogger.info(' JobID - %s New AdHoc Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : jobName, sqlQuery : sqlQuery  }));

    res.set('Access-Control-Allow-Origin', '*');

    // Create a MongoDB record for the AdHoc Job
    AdHocJob.create({
        _id: jobID,
        JobID: jobID,
        JobName: jobName,
        SQLQuery: sqlQuery,
        SubmittedByIP: clientIPaddress,
        Status: jobStatus,
        CreatedTimeStamp: new Date(),
        UpdatedTimeStamp: new Date()
    }, function(err, adHocQuery) {
        if (err) {
        	detailLogger.error('JobID - %s Error creating new record: %s' ,jobID, JSON.stringify({ error: err}));
            res.status(500)
            return res.send(err)
        } else {
       		detailLogger.debug('JobID - %s  New Job details inserted into database', jobID  );
        	createJobDirectory();
        }

    });

    // Create a directory for the JobID
    createJobDirectory = function() {

        dir = dataDir + jobID,
            queryFile = dir + '/sql.txt';

        console.log("jobID: " + jobID)
        console.log("Dir: " + dir)
        console.log("QueryFile: " + queryFile)

        fs.ensureDir(dir, function(err) {
            if (err) {
            	detailLogger.error('JobID - %s Error creating new directory: %s', jobID,  JSON.stringify({Directory: dir, error: err}));
                res.status(500)
                return res.send(err)
            } else {
	            detailLogger.debug('JobID - %s  New JobID directory created: %s',jobID, JSON.stringify ({Directory: dir}));
		        var ws = fs.createOutputStream(queryFile)
		        ws.write(sqlQuery)
		        detailLogger.debug('JobID - %s  Hive Query written to file: %s',jobID, JSON.stringify({ QueryFile : queryFile}));
		        res.send({
                    "JobID": jobID
                });
                executeHiveScript()

            }
        })

    }


    executeHiveScript = function() {

        var execDirPath = '/Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts/',
            execFileName = './HiveLauncher.sh',
            normalizePath = "../"

        args = [jobID, normalizePath + queryFile, normalizePath + dir]

        var options = {
            cwd: execDirPath,
            timeout: 0
        }

        function callback(error, results) {
            if (error) {
            	detailLogger.error('JobID - %s  Execution of Hive Query failed: %s',jobID, JSON.stringify({ error: error}));
            	highLevelLogger.error('JobID - %s  Execution of Hive Query failed: %s',jobID, JSON.stringify({ error: error}));
            	highLevelLogger.info(' JobID - %s  AdHoc Job failed: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress,  JobName : jobName, sqlQuery : sqlQuery, error: error  }));
                
            } else {
            	detailLogger.debug('JobID - %s  Hive Query Script Execution Completed',jobID)
                highLevelLogger.debug('JobID - %s  Hive Query Script Execution Completed',jobID)
                
            }
        }

        detailLogger.debug('JobID - %s  Executing HiveScriptLauncher: %s',jobID, JSON.stringify({scriptName: execFileName, args : args}));
        child_process.execFile(execFileName, args, options, callback)
    }

//    				highLevelLogger.info(' AdHoc Job failed', { clientIPaddress: clientIPaddress, JobID: jobID,  JobName : jobName, sqlQuery : sqlQuery, error: error  });

};

	/*_id				: String,
    JobID      	 	: String,
    JobName     	: String,
    SQLQuery    	: String,
    ExecutionTime	: { Hours: Number, Minutes: Number} 
    ExecutionDays	: { SUN: Boolean, MON : Boolean , TUE : Boolean, WED: Boolean, THU: Boolean, FRI: Boolean, SAT: Boolean }
    NotifyFlag 		: Boolean,
    NotifyEmail 	: [String],
    SubmittedByIP 	: String,
    LastRunStatus 	: String,
    CreatedTimeStamp: { type: Date, default:Date.now },
    UpdatedTimeStamp: { type: Date, default:Date.now }*/

