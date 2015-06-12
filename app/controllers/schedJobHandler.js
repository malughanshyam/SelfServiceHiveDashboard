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
    var executionTime = req.body.jobSchedTime;
    var executionDays = req.body.days;
    var notifyEmailFlag = req.body.notifyEmailFlag;
    var notifyEmailID   = req.body.notifyEmailID;
    var lastRunStatus = "JOB_NOT_STARTED"

    // Create a new Job ID 	
    var ObjectId = mongoose.Types.ObjectId;
    var jobID = new ObjectId;

    jobID = jobID.toString();

    detailLogger.info(' JobID - %s New Scheduled Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : schedJobName, SQLQuery : sqlQuery, ScheduledTime : req.body.jobSchedTime, ScheduledDays : req.body.days , NotifyFlag: req.body.notifyEmailFlag, NotifyEmailID : req.body.notifyEmailID}));
    highLevelLogger.info(' JobID - %s New Scheduled Job Submitted: %s', jobID, JSON.stringify({ clientIPaddress: clientIPaddress, JobName : schedJobName, SQLQuery : sqlQuery, ScheduledTime : req.body.jobSchedTime, ScheduledDays : req.body.days , NotifyFlag: req.body.notifyEmailFlag, NotifyEmailID : req.body.notifyEmailID}));

    res.set('Access-Control-Allow-Origin', '*');


    // Create a MongoDB record for the AdHoc Job
    ScheduledJob.create({
        _id: jobID,
        JobID: jobID,
        JobName: schedJobName,
        SQLQuery: sqlQuery,
        SubmittedByIP: clientIPaddress,
        Status: jobStatus,
		ExecutionTime	: { Hours: executionTime.hours, Minutes: executionTime.minutes} ,
		ExecutionDays	: { SUN: executionDays.sun, MON : executionDays.mon , TUE : executionDays.tue, WED: executionDays.wed, THU: executionDays.thu, FRI: executionDays.fri, SAT: executionDays.sat },
		NotifyFlag 		: notifyEmailFlag,
		NotifyEmail 	: notifyEmailID,
		LastRunStatus 	: lastRunStatus,
        CreatedTimeStamp: new Date(),
        UpdatedTimeStamp: new Date()

    }, function(err, scheduledJob) {
        if (err) {
        	detailLogger.error('JobID - %s Error creating new record: %s' ,jobID, JSON.stringify({ error: err}));
            res.status(500)
            return res.send({JobID : null, err : err})
        } else {
       		detailLogger.debug('JobID - %s  New Job details inserted into database : %s', jobID , JSON.stringify({ scheduledJob: scheduledJob}) );
       		//res.send({"JobID" : jobID });
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
                return res.send({JobID : null, err : err})
            } else {
	            detailLogger.debug('JobID - %s  New JobID directory created: %s',jobID, JSON.stringify ({Directory: dir}));
		        var ws = fs.createOutputStream(queryFile)
		        ws.write(sqlQuery)
		        detailLogger.debug('JobID - %s  Hive Query written to file: %s',jobID, JSON.stringify({ QueryFile : queryFile}));
                createCronCmd()

            }
        })

    }


    createCronCmd = function() {

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



        

        // Prepare Command to be run by CRON

        var execDirPath = '/Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts/',
            execFileName = './HiveLauncher.sh',
            normalizePath = "../"
    
        args = jobID + " " + normalizePath  + queryFile  + " " + normalizePath + dir


        var options = {
            cwd: execDirPath,
            timeout: 0
        }

        // Log File to store the CRON output
        cronlogFile = " > " + normalizePath + dataDir + "cronLogs.log 2>&1"

        // Finalized command to be run by CRON
        cronCmd = "cd " + execDirPath + " && " + execFileName + " " + args + cronlogFile;


        // Final CRON Job
        // MIN HOUR DOM MON DOW CMD
        crontabJobCmd = min + " " + hours + " " + dayOfMonth + " " + month + " " + dayOfWeek + " " + cronCmd;


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


        // Execute the command to insert the new CRON job in the CRON file
        var insertCronJobCmdExec = child_process.exec(crontabInsertCmd, options, callback);

        // Check the exit code of the command 
        insertCronJobCmdExec.on('exit', function (code) {
                detailLogger.debug('insertCronJobCmdExec Child process exited with exit code '+code);   
            if (code == 0) {
                detailLogger.info('JobID - %s  CRON Job Scheduled successfully: %s',jobID, JSON.stringify({ crontabJobCmd: crontabJobCmd}));
                highLevelLogger.info('JobID - %s  CRON Job Scheduled successfully: %s',jobID, JSON.stringify({ crontabJobCmd: crontabJobCmd}));
                res.send({"JobID": jobID});
                removeJobIDFromDB();         
            } else {
                return res.send({JobID : null, err : err})
                updateJobIDinDB();
            }
        });

    }

};

