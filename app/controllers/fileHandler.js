fs = require('fs-extra');
sys = require('sys')
child_process = require('child_process');
dataDir = "data/";
path = require('path');

exports.findAll = function(req,res) {
		return res.json("GET is working");
}

exports.findById = function() {};


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