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
AdHocJob = require('../models/AdHocJob');

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
//    .sort('-UpdatedTimeStamp')
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

// Get Job Status from the data/jobID/status.txt file
exports.getStatus = function(req,res){

	var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
	var jobID = req.params.JobID
	if (jobID != null){
        jobStatusFile = dataDir+jobID+"/status.txt";


		console.log("Job Status File: "+jobStatusFile);
		fs.readFile(jobStatusFile, 'utf8', function (err,data) {
		  	if (err) {
		  		detailLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, statusFile: jobStatusFile}));
		  		highLevelLogger.error('JobID - %s Error fetching Job Status %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, statusFile: jobStatusFile}));
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



exports.updateStatus = function(req,res){
    var JobID = req.params.JobID
  return AdHocJob.findById(JobID, function (err, adHocJob) {
    var oldJobStatus = adHocJob.Status;
    adHocJob.Status = req.body.Status;
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


exports.getJobLog = function(req,res){

    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
	if (jobID != null){
        
        jobLogFile = dataDir+jobID+"/log.txt";
		console.log("Job Log File: "+jobLogFile);
		fs.readFile(jobLogFile, 'utf8', function (err,data) {
		  	if (err) {
		  		detailLogger.error('JobID - %s Error fetching Job Log %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, jobLogFile: jobLogFile}));
		  		highLevelLogger.error('JobID - %s Error fetching Job Log %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, jobLogFile: jobLogFile}));
		    	return res.send(err);
		  	} else {
				detailLogger.debug('JobID - %s User retrieved Job Log File: %s',jobID, JSON.stringify({ jobLogFile: jobLogFile}));
			  	highLevelLogger.debug('JobID - %s User retrieved Job Log File: %s',jobID, JSON.stringify({ jobLogFile: jobLogFile}));        
			  	res.send(data);		  		
		  	}
    	});
	} else{
        detailLogger.error('JobID - %s Error fetching Job Log %s' ,jobID, JSON.stringify({ error: 'JobID not specified'}));
        return res.json(({status: '500 Server error', error: 'JobID not specified'}))

    }


};

exports.getJobResultFile = function(req,res){

    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
	
    if (jobID != null){
        		
		var options = {
			root: __dirname + '../../../' + dataDir+jobID,
			dotfiles: 'deny',
			headers: {
				'x-timestamp': Date.now(),
				'x-sent': true
			}
		};

		var fileName = 'result.txt'
		res.sendFile(fileName, options, function (err) {
			if (err) {
				detailLogger.error('JobID - %s Error fetching Job Result: %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, fileName: fileName, path: options.root}));
		  		highLevelLogger.error('JobID - %s Error fetching Job Result %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, fileName: fileName, path: options.root}));
		    	return res.status(err.status).end();
			}
			else {
				detailLogger.debug('JobID - %s User retrieved Job Result File: %s',jobID, JSON.stringify({ clientIPaddress: clientIPaddress, fileName: fileName, path: options.root}));
			  	highLevelLogger.debug('JobID - %s User retrieved Job Result File: %s',jobID, JSON.stringify({ clientIPaddress: clientIPaddress, fileName: fileName, path: options.root}));
				}
		});


	} else{
		detailLogger.error('JobID - NOT_SPECIFIED  Error fetching Job Log %s' , JSON.stringify({ error: 'JobID not specified'}));
        return res.json(({status: '500 Server error', error: 'JobID not specified'}))
    }

};

exports.downloadFile = function(req,res){
    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
    
    if (jobID != null){
                
        var fileName = 'result.txt'
        var file = __dirname + '../../../' + dataDir+jobID +'/'+fileName;
        var newFileName = 'result-'+jobID+'.txt';
        detailLogger.debug('JobID - %s User downloaded Job Result File: %s',jobID, JSON.stringify({ clientIPaddress: clientIPaddress, fileName: file}));
        highLevelLogger.debug('JobID - %s User downloaded Job Result File: %s',jobID, JSON.stringify({ clientIPaddress: clientIPaddress, fileName: file}));
        res.download(path.resolve(file),newFileName); // Set disposition and send it.

    } else{
        detailLogger.error('JobID - %s Error fetching Job Result: %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, fileName: fileName, path: options.root}));
        highLevelLogger.error('JobID - %s Error fetching Job Result %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, fileName: fileName, path: options.root}));
        return res.status(err.status).end();
    }
   
}

exports.getJobResult = function(req,res){

    var jobID = req.params.JobID;
    var clientIPaddress = req.ip || req.header('x-forwarded-for') || req.connection.remoteAddress;
	
    if (jobID != null){
        
        jobResultFile = dataDir+jobID+"/result.txt";
		fs.readFile(jobResultFile, 'utf8', function (err,data) {
		  	if (err) {
				detailLogger.error('JobID - %s Error fetching Job Result: %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, jobResultFile: jobResultFile}));
		  		highLevelLogger.error('JobID - %s Error fetching Job Result %s' ,jobID, JSON.stringify({ clientIPaddress: clientIPaddress, error: err, jobResultFile: jobResultFile}));
		    	console.log(err);
		    	return res.send(err);
		  	} else {
			  	detailLogger.debug('JobID - %s User retrieved Job Result File: %s',jobID, JSON.stringify({ clientIPaddress: clientIPaddress, jobResultFile: jobResultFile}));
				highLevelLogger.debug('JobID - %s User retrieved Job Result File: %s',jobID, JSON.stringify({ clientIPaddress: clientIPaddress, jobResultFile: jobResultFile}));				
			  	res.send(data.trim());
		  	}
    	});
	} else{
		detailLogger.error('JobID - NOT_SPECIFIED  Error fetching Job Log %s' , JSON.stringify({ error: 'JobID not specified'}));
        return res.json(({status: '500 Server error', error: 'JobID not specified'}))
    }
};

