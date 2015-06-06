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


highLevelLogger.info('Logged In');
detailLogger.info('Logged In');


// Include the MongoDB Schema 
AdHocJob = require('../models/AdHocJob');

exports.getAdHocJob = function(req, res) {
    AdHocJob.find(function(err, adHocJobs) {
        if (err) return detailLogger.error(err);
        res.send(adHocJobs)
    });
}

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
    var jobStatus = 'NOT_STARTED'

    // Create a new Job ID 	
    var ObjectId = mongoose.Types.ObjectId;
    jobID = new ObjectId;

    console.log("jobID: ");
    console.log(jobID)

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
            res.status(500)
            res.send(err)
        }
        createJobDirectory();
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
                console.log(err) // => null
                res.status(500)
                res.send(err)
            }
            var ws = fs.createOutputStream(queryFile)
            ws.write(sqlQuery)
            executeHiveScript()
            console.log('File written : ' + queryFile);
        })

    }


    executeHiveScript = function() {

        console.log("Executing Hive Script");
        var execDirPath = '/Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts/',
            execFileName = './HiveLauncher.sh',

            normalizePath = "../"

        args = [jobID, normalizePath + queryFile, normalizePath + dir]

        var options = {
            cwd: execDirPath,
            timeout: 5000
        }

        var output;

        //		function callback(error, stdout, stderr) 
        function callback(error, results) {
            console.log("Execution of hiveQuery Complete")
            if (error) {
                console.log(error)
                res.status(500)
                res.send(error)
                    //     	 }
                    // if (error){
                    //          res.send(error);
                    //    } else if (stderr) {
                    //    	res.send("Error: "+stderr)
            } else {
                console.log("Executed Job, sending JobID: " + jobID)
                    //console.log("results : "+stdout)
                    //sys.puts(stdout)
                console.log(results)
                res.send({
                    "JobID": jobID
                });
            }
        }
        console.log("Executing hiveQuery")
        child_process.execFile(execFileName, args, options, callback)
    }

};