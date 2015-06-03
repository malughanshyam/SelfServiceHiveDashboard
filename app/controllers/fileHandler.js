fs = require('fs-extra');
sys = require('sys')
child_process = require('child_process');
dataDir = "data/"
exports.findAll = function(req,res) {
		return res.json("GET is working");
}

exports.findById = function() {};

exports.submitJob = function(req,res) {

	var jobID = req.body.jobID, //"job_001",
		query = req.body.hiveQuery	//query = "SHOW TABLES;",
		
	if (jobID == null)
		jobID = "job_unnamed"
	if (query == null)
		query = " "

	dir = dataDir+jobID,
	queryFile = dir+'/sql.txt';

	console.log("jobID: "+jobID)
	console.log("Dir: " + dir)
	console.log("QueryFile: "+ queryFile)
	console.log("Req body"+JSON.stringify(req.body, null, 4))

	fs.ensureDir(dir, function (err) {
	  
	  if (err){
	  	console.log(err) // => null
	  	res.status(500)
	  	res.send("Error")
	  }
		var ws = fs.createOutputStream(queryFile)
		ws.write(query)
		execute()
		console.log('File written : ' + queryFile);
	})

	function execute (){
		
		var	execDirPath = '/Users/gmalu/Documents/Project/SelfServiceHiveDashboard/backendScripts/',
		execFileName = './HiveLauncher.sh',
		
		normalizePath = "../"

		args = [jobID, normalizePath+queryFile, normalizePath+dir]

		var	options = { 
		  cwd: execDirPath,
		  timeout: 5000
		}

		var output;

		function callback(error, stdout, stderr) 
		{ 
			console.log("Execution of hiveQuery Complete")
			 if (error){
	            res.send(error);
		     } else if (stderr) {
		     	res.send("Error: "+stderr)
		     } else {     
			 	console.log("results : "+stdout)
				sys.puts(stdout)
			    res.send(stdout);
		     }
		}
		console.log("Executing hiveQuery")
		child_process.execFile(execFileName, args, options, callback)
	}

};

exports.getStatus = function(req,res){

	var jobID = req.query["jobID"];
	if (jobID != null){
        jobStatusFile = dataDir+jobID+"/status.txt";
		console.log("Job Status File: "+jobStatusFile);
		fs.readFile(jobStatusFile, 'utf8', function (err,data) {
		  	if (err) {
		    	console.log(err);
		    	res.send(err);
		  	}
		  	console.log(data.trim());
		  	res.send(data.trim())
    	});
	} else{
        res.json(({status: '500 Server error', error: 'JobID not specified'}))
    }


};

exports.update = function() {};

exports.execute = function(req,res) {

	var	execDirPath = '/Users/gmalu/Documents/Project/SelfServiceDashboard/backendScripts/',
		execFileName = './HiveLauncher.sh',
		jobID = req.body.jobID

		args = [req.body.hiveQuery]
		//args = ['sql_topNYSEstocks.txt']
	
//	args = ['sql_faultyQuery.txt']

	var	options = { 
	  cwd: execDirPath,
	  timeout: 5000

	}

	var output;

	function callback(error, stdout, stderr) 
	{ 
		 if (error){
            res.send(error);
	     } else if (stderr) {
	     	res.send("Error: "+stderr)
	     } else {     
		 	console.log("results : "+stdout)
			sys.puts(stdout)
		    res.send(stdout);
	     }
	}

	child_process.execFile(execFileName, args, options, callback)


	// var path = "."
	// child_process.execFile('/bin/ls', ['-l', path], options, function (err, result) {
 //    	console.log(result)
	// });

};


exports.schedule = function(req,res) {

	function puts(error, stdout, stderr) { sys.puts(stdout) }
	child_process.exec("ls -la", puts);
	res.send("ls -la")

};
exports.delete = function() {};