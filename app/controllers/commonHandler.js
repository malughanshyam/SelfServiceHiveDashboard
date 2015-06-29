// Handler functions common for the AdHoc Jobs and Scheduled Jobs Module
// Load the Modules
var fs = require('fs-extra');
var sys = require('sys')
var child_process = require('child_process');
var path = require('path');
var mongoose = require('mongoose');

// Load the loggers
var winston = require('winston');
var highLevelLogger = winston.loggers.get('HighLevelLog');
var detailLogger = winston.loggers.get('DetailedLog');

var JOB_FAILED_STATUS_STRING = 'JOB_FAILED'
var JOB_NOT_STARTED_STATUS_STRING = 'JOB_NOT_STARTED'

var schedJobDataDir = "data/ScheduledJobs/";
var adHocJobDataDir = "data/AdHocJobs/";

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
ScheduledJob = require('../models/ScheduledJob');

// Function to Get Job Result File
var getJobResultFile = function(req, res, dataDir) {

    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;

    if (jobID != null) {

        // Set Options for res.sendFile                
        var options = {
            root: __dirname + '../../../' + dataDir + jobID,
            dotfiles: 'deny',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true
            }
        };

        var fileName = 'result.txt'
        res.sendFile(fileName, options, function(err) {
            if (err) {
                detailLogger.error('JobID - %s Error fetching Job Result: %s', jobID, JSON.stringify({
                    clientIPaddress: clientIPaddress,
                    error: err,
                    fileName: fileName,
                    path: options.root
                }));
                highLevelLogger.error('JobID - %s Error fetching Job Result %s', jobID, JSON.stringify({
                    clientIPaddress: clientIPaddress,
                    error: err,
                    fileName: fileName,
                    path: options.root
                }));
                return res.status(err.status).end();
            } else {
                detailLogger.debug('JobID - %s User retrieved Job Result File: %s', jobID, JSON.stringify({
                    clientIPaddress: clientIPaddress,
                    fileName: fileName,
                    path: options.root
                }));
                highLevelLogger.debug('JobID - %s User retrieved Job Result File: %s', jobID, JSON.stringify({
                    clientIPaddress: clientIPaddress,
                    fileName: fileName,
                    path: options.root
                }));
            }
        });


    } else {
        detailLogger.error('JobID - NOT_SPECIFIED  Error fetching Job Log %s', JSON.stringify({
            error: 'JobID not specified'
        }));
        return res.json(({
            status: '500 Server error',
            error: 'JobID not specified'
        }))
    }

};

// Download Result File
var downloadResultFile = function(req, res, dataDir) {
    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;

    if (jobID != null) {

        var fileName = 'result.txt'
        var file = __dirname + '../../../' + dataDir + jobID + '/' + fileName;
        var newFileName = 'result-' + jobID + '.txt';
        detailLogger.debug('JobID - %s User downloaded Job Result File: %s', jobID, JSON.stringify({
            clientIPaddress: clientIPaddress,
            fileName: file
        }));
        highLevelLogger.debug('JobID - %s User downloaded Job Result File: %s', jobID, JSON.stringify({
            clientIPaddress: clientIPaddress,
            fileName: file
        }));
        res.download(path.resolve(file), newFileName); // Set disposition and send it.

    } else {
        detailLogger.error('JobID - %s Error fetching Job Result: %s', jobID, JSON.stringify({
            clientIPaddress: clientIPaddress,
            error: err,
            fileName: fileName,
            path: options.root
        }));
        highLevelLogger.error('JobID - %s Error fetching Job Result %s', jobID, JSON.stringify({
            clientIPaddress: clientIPaddress,
            error: err,
            fileName: fileName,
            path: options.root
        }));
        return res.status(err.status).end();
    }

}

// Get Job Log
var getJobLog = function(req, res, dataDir) {

    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
    if (jobID != null) {

        jobLogFile = dataDir + jobID + "/log.log";
        console.log("Job Log File: " + jobLogFile);
        fs.readFile(jobLogFile, 'utf8', function(err, data) {
            if (err) {
                detailLogger.error('JobID - %s Error fetching Job Log %s', jobID, JSON.stringify({
                    clientIPaddress: clientIPaddress,
                    error: err,
                    jobLogFile: jobLogFile
                }));
                highLevelLogger.error('JobID - %s Error fetching Job Log %s', jobID, JSON.stringify({
                    clientIPaddress: clientIPaddress,
                    error: err,
                    jobLogFile: jobLogFile
                }));
                res.status(500);
                return res.send(err);
            } else {
                detailLogger.debug('JobID - %s User retrieved Job Log File: %s', jobID, JSON.stringify({
                    jobLogFile: jobLogFile
                }));
                highLevelLogger.debug('JobID - %s User retrieved Job Log File: %s', jobID, JSON.stringify({
                    jobLogFile: jobLogFile
                }));
                res.send(data);
            }
        });
    } else {
        detailLogger.error('JobID - %s Error fetching Job Log %s', jobID, JSON.stringify({
            error: 'JobID not specified'
        }));
        return res.json(({
            status: '500 Server error',
            error: 'JobID not specified'
        }))

    }


};

exports.getAdHocJobResultFile = function(req, res) {
    return getJobResultFile(req, res, adHocJobDataDir);
}

exports.getSchedJobResultFile = function(req, res) {
    return getJobResultFile(req, res, schedJobDataDir);
}

exports.downloadAdHocJobResultFile = function(req, res) {
    return downloadResultFile(req, res, adHocJobDataDir);
}

exports.downloadSchedJobResultFile = function(req, res) {
    return downloadResultFile(req, res, schedJobDataDir);
}

exports.adHocJobLog = function(req, res) {
    return getJobLog(req, res, adHocJobDataDir);
}

exports.schedJobLog = function(req, res) {
    return getJobLog(req, res, schedJobDataDir);
}