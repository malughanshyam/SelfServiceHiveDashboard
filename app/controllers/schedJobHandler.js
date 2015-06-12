// Load the Modules
var fs = require('fs-extra');
var sys = require('sys')
var child_process = require('child_process');
var dataDir = "data/scheduledJobs/";
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

	var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
	
    var callback = function(err, scheduledJobs) {
        if (err){
            detailLogger.error('GET - Error retrieving all record: %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err}));
            res.status(500)
            return res.send(err)
        } else {
            detailLogger.debug(' GET - Retrieved all AdHoc Jobs by ', { clientIPaddress: clientIPaddress });
            res.send(scheduledJobs);
        }
    
    }

    ScheduledJob
    .find()
    .sort('-UpdatedTimeStamp')
    .limit(100)
//    .sort('-UpdatedTimeStamp')
    .exec(callback);

};

// Create new AdHoc Job
exports.submitNewScheduledJob = function(req, res) {
	
    // Initialize the AdHoc Job Variables
    var schedJobName = req.body.schedJobName;
    if (schedJobName == null || schedJobName == '') {
        schedJobName = 'UnnamedJob';
    }

    var sqlQuery = req.body.schedQuery;
    if (sqlQuery == null) {
        sqlQuery = '';
    }

    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
    var jobStatus = 'JOB_NOT_STARTED'

    // Create a new Job ID 	
    var ObjectId = mongoose.Types.ObjectId;
    jobID = new ObjectId;

    jobID = jobID.toString();

    detailLogger.info(' JobID - %s New Scheduled Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : schedJobName, SQLQuery : sqlQuery, ScheduledTime : req.body.jobSchedTime, ScheduledDays : req.body.days , NotifyFlag: req.body.notifyEmailFlag, NotifyEmailID : req.body.notifyEmailID}));
    highLevelLogger.info(' JobID - %s New Scheduled Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : schedJobName, SQLQuery : sqlQuery, ScheduledTime : req.body.jobSchedTime, ScheduledDays : req.body.days , NotifyFlag: req.body.notifyEmailFlag, NotifyEmailID : req.body.notifyEmailID}));

    res.set('Access-Control-Allow-Origin', '*');

/* 
        $scope.schedJob.notifyEmailFlag = 'false';
        $scope.schedJob.notifyEmailID = '';
        */

	/*
    
   */

    // Create a MongoDB record for the AdHoc Job
    ScheduledJob.create({
        _id: jobID,
        JobID: jobID,
        JobName: schedJobName,
        SQLQuery: sqlQuery,
        SubmittedByIP: clientIPaddress,
        Status: jobStatus,
		ExecutionTime	: { Hours: req.body.jobSchedTime.Hours, Minutes: req.body.jobSchedTime.Minutes} ,
		ExecutionDays	: { SUN: req.body.days.sun, MON : req.body.days.mon , TUE : req.body.days.tue, WED: req.body.days.wed, THU: req.body.days.thu, FRI: req.body.days.fri, SAT: req.body.days.sat },
		NotifyFlag 		: req.body.notifyEmailFlag,
		NotifyEmail 	: req.body.notifyEmailID,
		LastRunStatus 	: "NA",
        CreatedTimeStamp: new Date(),
        UpdatedTimeStamp: new Date()

    }, function(err, scheduledJob) {
        if (err) {
        	detailLogger.error('JobID - %s Error creating new record: %s' ,jobID, JSON.stringify({ error: err}));
            res.status(500)
            return res.send(err)
        } else {
       		detailLogger.debug('JobID - %s  New Job details inserted into database : %s', jobID , JSON.stringify({ scheduledJob: scheduledJob}) );
       		res.send({"JobID" : jobID });
        	//createJobDirectory();
        }

    });

    /*
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

    */

};

