// Handler functions for the AdHoc Jobs Module

// Load the Modules
var fs = require('fs-extra');
var sys = require('sys')
var child_process = require('child_process');
var dataDir = "data/AdHocJobs/";
var path = require('path');
var mongoose = require('mongoose');

// Load the loggers
var winston = require('winston');
var highLevelLogger = winston.loggers.get('HighLevelLog');
var detailLogger = winston.loggers.get('DetailedLog');

var JOB_FAILED_STATUS_STRING = 'JOB_FAILED'
var JOB_NOT_STARTED_STATUS_STRING = 'JOB_NOT_STARTED'

// Types of Log Levels
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
AdHocJob = require('../models/AdHocJob');

var execDirPath = 'hive_launcher_scripts/';
var execFileName = './HiveLauncher.sh';
var normalizePath = "../";

// Get all the AdHoc Jobs
exports.getAllAdHocJobs = function(req, res) {

	var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
	
    var callback = function(err, adHocJobs) {
        if (err){
            detailLogger.error('GET - Error retrieving all record: %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err}));
            res.status(500)
            return res.send(err)
        } else {
            detailLogger.debug(' GET - Retrieved all AdHoc Jobs by ', { clientIPaddress: clientIPaddress });
            res.send(adHocJobs);
        }
    
    }

    AdHocJob
    .find()
    .sort('-UpdatedTimeStamp')
    .limit(100)
    .exec(callback);

}

// Get AdHoc Job based on Job ID
exports.getAdHocJobByJobID = function (req, res) {
    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
    return AdHocJob.findById(jobID, function (err, adHocJob) {
    if (!err) {
        detailLogger.debug(' JobID - %s information retrieved by: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress }));
        return res.send(adHocJob);
    } else {
        detailLogger.debug(' JobID - %s information retrieval failed by: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err  }));
        res.status(500)
        return res.send(err)
    }
  });
}

// Create new AdHoc Job
exports.submitNewAdHocJob = function(req, res) {
	
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
    var jobStatus = JOB_NOT_STARTED_STATUS_STRING

    res.set('Access-Control-Allow-Origin', '*');

    var jobID = req.body.jobID;

    if (!jobID){
        // Create a new Job ID     
        var ObjectId = mongoose.Types.ObjectId;
        jobID = new ObjectId;

        jobID = jobID.toString();

        // Prefix JobID with JobName
        jobID = jobName.trim() + '_' + jobID;

        detailLogger.info(' JobID - %s New AdHoc Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : jobName, sqlQuery : sqlQuery  }));
        highLevelLogger.info(' JobID - %s New AdHoc Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : jobName, sqlQuery : sqlQuery  }));

        // Create a MongoDB record for the AdHoc Job
        AdHocJob.create({
            _id             : jobID,
            JobID           : jobID,
            JobName         : jobName,
            SQLQuery        : sqlQuery,
            SubmittedByIP   : clientIPaddress,
            JobRunStatus    : jobStatus,
            CreatedTimeStamp: new Date(),
            UpdatedTimeStamp: new Date()
        }, function(err, adHocQuery) {
            if (err) {
                detailLogger.error('JobID - %s Error creating new record: %s' ,jobID, JSON.stringify({ error: err}));
                res.status(500)
                return res.send(err)
            } else {
                detailLogger.debug('JobID - %s  New Job details inserted into database', jobID  );
                jobDataDir = dataDir + jobID;
                queryFile = jobDataDir + '/sql.txt';
                createJobDirectory();
            }

        });

    } else {

      highLevelLogger.info('JobID - %s AdHoc Job Resubmitted' ,jobID);
      detailLogger.info('JobID - %s AdHoc Job Resubmitted' ,jobID);

        var query = { _id: jobID };
        var updateFields = { JobRunStatus: jobStatus , SubmittedByIP   : clientIPaddress, UpdatedTimeStamp : new Date() };
   
        function callback (err) {
         if (err) {
                detailLogger.error('JobID - %s Error updating the JobRunStatus to %s in database : %s' ,jobID, jobStatus, JSON.stringify({ error: err}));
           }
           else {
                detailLogger.info('JobID - %s Updated the Resubmitted AdHocJob Job JobRunStatus to %s in database' ,jobID, jobStatus);
                jobDataDir = dataDir + jobID;
                queryFile = jobDataDir + '/sql.txt';
                res.send({ "JobID": jobID }); 
                executeHiveScript();
           }
        }

       AdHocJob.update(query, updateFields , callback)

    }

    // Create a directory for the JobID
    createJobDirectory = function() {

        console.log("jobID: " + jobID)
        console.log("Dir: " + jobDataDir)
        console.log("QueryFile: " + queryFile)

        fs.ensureDir(jobDataDir, function(err) {
            if (err) {
            	detailLogger.error('JobID - %s Error creating new directory: %s', jobID,  JSON.stringify({Directory: jobDataDir, error: err}));
                res.status(500);
                return res.send(err);
            } else {
	            detailLogger.debug('JobID - %s  New JobID directory created: %s',jobID, JSON.stringify ({Directory: jobDataDir}));
		        
                fs.outputFile(queryFile, sqlQuery, function (err) {
                    if (err){
                        detailLogger.error('JobID - %s Error creating Query file: %s', jobID,  JSON.stringify({QueryFile: queryFile, error: err}));
                        res.status(500);
                        return res.send(err);
                    } else{
                        detailLogger.debug('JobID - %s  Hive Query written to file: %s',jobID, JSON.stringify({ QueryFile : queryFile}));
                        res.send({
                            "JobID": jobID
                        }); 
                        executeHiveScript();
                    }
                });

            }
        });

    }

    // Execute the Hive Script
    executeHiveScript = function() {

        // ##  HiveLauncher Script Usage :
        // ##      
        // ##   Scheduled Job :-->
        // ##   HiveLauncher.sh SCHED <JobID> <SQLQueryFile> <OutputDir> <NotifyFlag-Y/N> [NotifyEmail]
        // ##   
        // ##   AdHocJob Job :-->"
        // ##   HiveLauncher.sh ADHOC <JobID> <SQLQueryFile> <OutputDir>
        // ##

        args = ["ADHOC", jobID, jobName, normalizePath + queryFile, normalizePath + jobDataDir]

        var options = {
            cwd: execDirPath,
            timeout: 0
        }

        function callback(error, results) {
            if (error) {
            	detailLogger.error('JobID - %s  Execution of Hive Query failed: %s',jobID, JSON.stringify({ error: error}));
            	highLevelLogger.error('JobID - %s  Execution of Hive Query failed: %s',jobID, JSON.stringify({ error: error}));
            	highLevelLogger.info(' JobID - %s  AdHoc Job failed: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress,  JobName : jobName, sqlQuery : sqlQuery, error: error  }));
                updateStatusInDB(JOB_FAILED_STATUS_STRING);
                
            } else {
            	detailLogger.debug('JobID - %s  Hive Query Script Execution Completed',jobID)
                highLevelLogger.debug('JobID - %s  Hive Query Script Execution Completed',jobID)
                
            }
        }

        detailLogger.debug('JobID - %s  Executing HiveScriptLauncher: %s',jobID, JSON.stringify({scriptName: execFileName, args : args}));
        child_process.execFile(execFileName, args, options, callback)
    }

    // Update the Job in Database
    updateStatusInDB = function(status) {
       

       var query = { _id: jobID };
       var updateFields = { JobRunStatus: status , UpdatedTimeStamp : new Date() };
   
       function callback (err) {
         if (err) {
               detailLogger.error('JobID - %s Error updating the AdHoc Job status to %s in Database: %s' ,jobID, status, JSON.stringify({ error: err}));
           }
           else {
              detailLogger.info('JobID - %s Updated the AdHoc Job status to %s in Database' ,jobID, status);
           }
       }

       AdHocJob.update(query, updateFields , callback)

   }

};


// Get Job Status from the MongoDB
exports.getAdHocJobStatus = function(req,res){

    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
    var jobID = req.params.JobID
    if (jobID){
        
        var callback = function(err, adHocJob) {
            if (err){
                detailLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err}));
                highLevelLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err}));
                res.status(500)
                return res.send(err)
            } else {
                detailLogger.debug('JobID - %s Checked Job Status: %s',jobID, adHocJob.JobRunStatus);
                highLevelLogger.debug('JobID - %s Checked Job Status: %s',jobID, adHocJob.JobRunStatus);        
                res.send(adHocJob.JobRunStatus);
            }
        
        }
        AdHocJob.findOne({ JobID: jobID }, 'JobRunStatus', callback);
     } else{
        detailLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: 'JobID not specified'}));
        return res.json(({status: '500 Server error', error: 'JobID not specified'}))
    }   

}

// Get Job Status from the data/jobID/status.txt file
exports.getAdHocJobStatusFromFile = function(req,res){

	var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
	var jobID = req.params.JobID
	if (jobID){
        jobStatusFile = dataDir+jobID+"/status.txt";
		fs.readFile(jobStatusFile, 'utf8', function (err,data) {
		  	if (err) {
		  		detailLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, statusFile: jobStatusFile}));
		  		highLevelLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, statusFile: jobStatusFile}));
		    	res.status(500);
                return res.send(err);
		  	} else{
			  	detailLogger.debug('JobID - %s Checked Job Status: %s',jobID, data.trim());
			  	highLevelLogger.debug('JobID - %s Checked Job Status: %s',jobID, data.trim());        
			  	res.send(data.trim())
		  	}
    	});
	} else{
		detailLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: 'JobID not specified'}));
        return res.json(({status: '500 Server error', error: 'JobID not specified'}))
    }
};


// Update Job Status in MongoDB
exports.updateStatus = function(req,res){
    var JobID = req.params.JobID
  return AdHocJob.findById(JobID, function (err, adHocJob) {
    var oldJobStatus = adHocJob.Status;
    adHocJob.JobRunStatus = req.body.Status;
    adHocJob.UpdatedTimeStamp = new Date();    
    return adHocJob.save(function (err) {
      if (err) {
        highLevelLogger.error('JobID - %s Error updating Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err}));
        detailLogger.error('JobID - %s Error updating Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err}));
        highLevelLogger.error('JobID - %s Error updating Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err}));                
      } else {        
        highLevelLogger.debug('JobID - %s Updated Job Status from %s to %s',adHocJob.JobID, oldJobStatus, adHocJob.Status);
        detailLogger.debug('JobID - %s Updated Job Status from %s to %s',adHocJob.JobID, oldJobStatus, adHocJob.Status);
        return res.send(adHocJob);
      }
    });
  });
}




