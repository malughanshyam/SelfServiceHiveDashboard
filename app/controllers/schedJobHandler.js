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

var JOB_FAILED_STATUS_STRING = 'JOB_FAILED'
var JOB_NOT_STARTED_STATUS_STRING = 'JOB_NOT_STARTED'

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
    .exec(callback);

};

// Get Scheduled Job based on Job ID
exports.getScheduledJobByJobID = function (req, res) {
    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
    return ScheduledJob.findById(jobID, function (err, adHocJob) {
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

// Create Scheduled Job
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
    var executionTime = req.body.jobSchedTime;
    var executionDays = req.body.days;
    var notifyEmailFlag = req.body.notifyEmailFlag;
    var notifyEmailID   = req.body.notifyEmailID || "";
    var jobRunStatus = JOB_NOT_STARTED_STATUS_STRING;

    // Validate Notification Flag and EmailID
    if (!notifyEmailID) {
        notifyEmailFlag = false;
    } else{
        notifyEmailFlag = true;
    }

    // Create a new Job ID 	
    var ObjectId = mongoose.Types.ObjectId;
    var jobID = new ObjectId;

    jobID = jobID.toString();

    detailLogger.info(' JobID - %s New Scheduled Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : schedJobName, SQLQuery : sqlQuery, ScheduledTime : req.body.jobSchedTime, ScheduledDays : req.body.days , NotifyFlag: req.body.notifyEmailFlag, NotifyEmailID : req.body.notifyEmailID}));
    highLevelLogger.info(' JobID - %s New Scheduled Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : schedJobName, SQLQuery : sqlQuery, ScheduledTime : req.body.jobSchedTime, ScheduledDays : req.body.days , NotifyFlag: req.body.notifyEmailFlag, NotifyEmailID : req.body.notifyEmailID}));

    res.set('Access-Control-Allow-Origin', '*');

    var jobDir = dataDir + jobID;
    var queryFile = jobDir + '/sql.txt';
    var crontabInsertCmd ;

    // Create a directory for the JobID
    createJobDirectory = function() {
        
        fs.ensureDir(jobDir, function(err) {
            if (err) {
                detailLogger.error('JobID - %s Error creating new directory: %s', jobID,  JSON.stringify({Directory: jobDir, error: err}));
                res.status(500)
                return res.send({JobID : null, err : err})
            } else {
                detailLogger.debug('JobID - %s  New JobID directory created: %s',jobID, JSON.stringify ({Directory: jobDir}));
                var ws = fs.createOutputStream(queryFile)
                ws.write(sqlQuery)
                detailLogger.debug('JobID - %s  Hive Query written to file: %s',jobID, JSON.stringify({ QueryFile : queryFile}));
                createCronJob();
            }
        })
    };

  
    createCronJob = function() {
        // Create Parameters for the CRON job
        // MIN HOUR DOM MON DOW CMD

        // Sample CRON : 
        // croncmd="ls -l"
        // cronjob="0 0 * * * $croncmd" 

        var min = executionTime.minutes;
        var hours = executionTime.hours;

        var dayOfMonth = "*";

        var month = "*"

        var dayOfWeek = "";

        if (executionDays.sun == true) {
            dayOfWeek += "0";
        } 

        if (executionDays.mon == true) {
            if (dayOfWeek.length > 0)
            {
                dayOfWeek += ",";
            }

            dayOfWeek +="1";

        } 

        if (executionDays.tue == true) {
            if (dayOfWeek.length > 0)
            {
                dayOfWeek += ",";
            }

            dayOfWeek +="2";
        } 

        if (executionDays.wed == true) {
            if (dayOfWeek.length > 0)
            {
                dayOfWeek += ",";
            }

            dayOfWeek +="3";
        } 

        if (executionDays.thu == true) {
            if (dayOfWeek.length > 0)
            {
                dayOfWeek += ",";
            }

            dayOfWeek +="4";
        } 

        if (executionDays.fri == true) {
            if (dayOfWeek.length > 0)
            {
                dayOfWeek += ",";
            }

            dayOfWeek +="5";
        } 

        if (executionDays.sat == true) {
            if (dayOfWeek.length > 0)
            {
                dayOfWeek += ",";
            }

            dayOfWeek +="6";
        } 

        // ##  HiveLauncher Script Usage :
        // ##      
        // ##   Scheduled Job :-->
        // ##   HiveLauncher.sh SCHED <JobID> <SQLQueryFile> <OutputDir> <NotifyFlag-Y/N> [NotifyEmail]
        // ##   
        // ##   AdHocJob Job :-->"
        // ##   HiveLauncher.sh ADHOC <JobID> <SQLQueryFile> <OutputDir>
        // ##

        // Prepare Command to be run by CRON

        var execDirPath = '/Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts/',
            execFileName = './HiveLauncher.sh',
            normalizePath = "../"
    
        var args = "SCHED" + " " + jobID + " " + normalizePath  + queryFile  + " " + normalizePath + jobDir 

        if (notifyEmailFlag == true){
            args += " " + "Y" + " " + notifyEmailID;
        } else{
            args += " " + "N"
        }

        // Log File to store the CRON output
        var cronlogFile = " > " + normalizePath + dataDir + "cronLogs.log 2>&1"

        // Finalized command to be run by CRON
        var cronCmd = "cd " + execDirPath + " && " + execFileName + " " + args + cronlogFile;


        // Final CRON Job
        // MIN HOUR DOM MON DOW CMD
        var crontabJobCmd = min + " " + hours + " " + dayOfMonth + " " + month + " " + dayOfWeek + " " + cronCmd;


        detailLogger.debug('JobID - %s  Inserting Cron Job Command : %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, crontabJobCmd: crontabJobCmd }));


        /* 
        Sample : 
        ---------------------------------------------------------------
        croncmd="ls -l"
        cronjob="0 0 * * * $croncmd"

        To add it to the crontab, with no duplication:

        ( crontab -l | grep -v "$croncmd" ; echo "$cronjob" ) | crontab -

        To remove it from the crontab:

        ( crontab -l | grep -v "$croncmd" ) | crontab -
        ---------------------------------------------------------------
        */
 
        //( crontab -l | grep -v "$croncmd" ; echo "$cronjob" ) | crontab -
        crontabInsertCmd = '( crontab -l | grep -v "' + cronCmd + '" ; echo "' + crontabJobCmd + '" ) | crontab -';

        // Sample : crontab -l | grep -v \"cd /Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts/ && ./HiveLauncher.sh 557b51d8a502c4091617c3a7 ../data/scheduledJobs/557b51d8a502c4091617c3a7/sql.txt ../data/scheduledJobs/557b51d8a502c4091617c3a7 > data/scheduledJobs/cronLogs.log 2>&1\" ; echo \"45 22 * * 0,1 cd /Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts/ && ./HiveLauncher.sh 557b51d8a502c4091617c3a7 ../data/scheduledJobs/557b51d8a502c4091617c3a7/sql.txt ../data/scheduledJobs/557b51d8a502c4091617c3a7> data/scheduledJobs/cronLogs.log 2>&1\" ) | crontab -
        
        detailLogger.debug('JobID - %s  Executing Crontab Job Insertion Command : %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, crontabInsertCmd: crontabInsertCmd }));       
        

        // Callback function to be executed after Command Execution
        var callback = function (error, stdout, stderr) {
           if (error) {
             detailLogger.error('JobID - %s  Inserting CRON Job failed: %s',jobID, JSON.stringify({ error: error}));
             highLevelLogger.error('JobID - %s  Inserting CRON Job failed: %s',jobID, JSON.stringify({ error: error}));
           }
        };


        var options = {
            cwd: execDirPath,
            timeout: 0
        }

        // Execute the command to insert the new CRON job in the CRON file
        var insertCronJobCmdExec = child_process.exec(crontabInsertCmd, options, callback);

        // Check the exit code of the command 
        insertCronJobCmdExec.on('exit', function (code) {
            detailLogger.debug('insertCronJobCmdExec Child process exited with exit code '+code);   
            if (code == 0) {
                detailLogger.info('JobID - %s  CRON Job Scheduled Successfully: %s',jobID, JSON.stringify({ crontabJobCmd: crontabInsertCmd}));
                highLevelLogger.info('JobID - %s  CRON Job Scheduled Successfully: %s',jobID, JSON.stringify({ crontabJobCmd: crontabInsertCmd}));
                createDBRecord();        
            } else {
                res.status(500);
                res.send({JobID : null, err : err})
                removeJobIDdirectory();
            }

        });

    }


    // Create a MongoDB record for the Scheduled Job
    createDBRecord = function(){

        var jobStatus = 'ACTIVE';
        hoursStr = executionTime.hours + "";
        minStr = executionTime.minutes + "";

        console.log(hoursStr)
        console.log(hoursStr.length)
        console.log()
        console.log(minStr)
        console.log(minStr.length)

        if (hoursStr.length != 2)
            hoursStr = "0" + hoursStr;

        if (minStr.length != 2)
            minStr = "0" + minStr;

        ScheduledJob.create({
            _id             : jobID,
            JobID           : jobID,
            JobName         : schedJobName,
            SQLQuery        : sqlQuery,
            SubmittedByIP   : clientIPaddress,
            ScheduleStatus  : jobStatus,
            ExecutionTime   : { Hours: hoursStr, Minutes: minStr } ,
            ExecutionDays   : { SUN: executionDays.sun, MON : executionDays.mon , TUE : executionDays.tue, WED: executionDays.wed, THU: executionDays.thu, FRI: executionDays.fri, SAT: executionDays.sat },
            NotifyFlag      : notifyEmailFlag,
            NotifyEmail     : notifyEmailID,
            JobRunStatus    : jobRunStatus,
            CronTabJob      : crontabInsertCmd,
            CreatedTimeStamp: new Date(),
            UpdatedTimeStamp: new Date()

        }, function(err, scheduledJob) {
            if (err) {
                detailLogger.error('JobID - %s Error creating new record: %s' ,jobID, JSON.stringify({ error: err}));
                res.status(500);
                res.send({JobID : null, err : err});
                removeJobIDdirectory();
            } else {
                detailLogger.debug('JobID - %s  New Job details inserted into database : %s', jobID , JSON.stringify({ scheduledJob: scheduledJob}) );
                return res.send({"JobID" : jobID });
               
            }

        });

    }

    // Remove the JobID Directory Created -- Called as part of Rollback / failure
    removeJobIDdirectory = function() {
        fs.removeSync(jobDir);
        detailLogger.debug('JobID - %s  Directory deleted: %s', jobID , JSON.stringify({ jobDir: jobDir}) );
    }

    // Initiate the Schedule Job process
    createJobDirectory();

};

// Delete Scheduled Job and data 
exports.removeScheuledJob = function(req, res) {
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;    
    var jobID = req.params.JobID
    console.log("JobID received for deletion: " + jobID);
    if (jobID == null || jobID == 'undefined'){
        detailLogger.error('JobID - %s Error Deleting Scheduled Job %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: 'JobID not specified'}));
        res.status(500);
        return res.json(({status: '500 Server error', error: 'JobID not specified'}))
    }


    detailLogger.debug('JobID - %s  Removing Crontab Job : %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, jobID: jobID }));       

    /*
    To remove from the crontab:
        ( crontab -l | grep -v "jobID" ) | crontab -
    */

    //( crontab -l | grep -v "$croncmd" ; echo "$cronjob" ) | crontab -
    var crontabRemoveCmd = '( crontab -l | grep -v "' + jobID + '" ) | crontab -';


    // Callback function to be executed after Command Execution
    var callback = function (error, stdout, stderr) {
       if (error) {
         detailLogger.error('JobID - %s  Removal of CRON Job failed: %s',jobID, JSON.stringify({ error: error}));
         highLevelLogger.error('JobID - %s  Removal of CRON Job failed: %s',jobID, JSON.stringify({ error: error}));
       }
    };

    var options = {
        //cwd: execDirPath,
        timeout: 0
    }

    // Execute the command to REMOVE the CRON job from the CRON file
    var removeCronJobCmdExec = child_process.exec(crontabRemoveCmd, options, callback);

    // Check the exit code of the command 
    removeCronJobCmdExec.on('exit', function (code) {
        detailLogger.debug('removeCronJobCmdExec Child process exited with exit code '+code);   
        if (code == 0) {
            detailLogger.info('JobID - %s  CRON Job Removed Successfully: %s',jobID, JSON.stringify({ crontabRemoveCmd: crontabRemoveCmd}));
            highLevelLogger.info('JobID - %s  CRON Job Removed Successfully: %s',jobID, JSON.stringify({ crontabRemoveCmd: crontabRemoveCmd}));
            updateStatusInDB();        
        } else {
            res.status(500);
            res.send({status: "failed", err : err})
        }

    });


    // Update the Job in Database
    updateStatusInDB = function() {
       

       var query = { _id: jobID };
       var updateFields = { ScheduleStatus: 'DELETED' }
   
       function callback (err) {
         if (err) {
               detailLogger.error('JobID - %s Error updating the Job status to Deleted in Database: %s' ,jobID, JSON.stringify({ error: err}));
               res.status(500);
               return res.send({status: "failed", err : err})
           }
           else {
              detailLogger.info('JobID - %s Updated the Scheduled Job status to Deleted in Database' ,jobID);
              return res.send({status: "success"});
           }
       }

       ScheduledJob.update(query, updateFields , callback)

   }


}

// Cancel Scheduled Job
exports.cancelScheuledJob = function(req, res) {
    
}