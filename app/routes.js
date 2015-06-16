// Include the MongoDB Schema 
module.exports = function(app){

    // Import AdHocJob Controllers / Route Handlers
    var adHocJobHandler = require('./controllers/adHocJobHandler');

    // Import Scheduled Job Controllers / Route Handlers
    var schedJobHandler = require('./controllers/schedJobHandler');

   // Import Common Job Controllers / Route Handlers
    var commonHandler = require('./controllers/commonHandler');

    /******* AdHoc Routes ********/

    // Get All AdHoc Jobs
    app.get('/adHocJob', adHocJobHandler.getAllAdHocJobs);

    // Get a specific AdHoc Job
    app.get('/adHocJob/:JobID',adHocJobHandler.getAdHocJobByJobID);

    // Submit new AdHoc Job
    app.post('/submitNewAdHocJob', adHocJobHandler.submitNewAdHocJob);
    
    // Get AdHoc Job Status
    app.get('/jobStatus/:JobID', adHocJobHandler.getStatus);

    // Update AdHoc Job Status
    //app.put('/jobStatus/:JobID', adHocJobHandler.updateStatus);

    // Get AdHoc Job Log
    app.get('/adHocJobLog/:JobID', commonHandler.adHocJobLog);

    // Get AdHoc Job Result
    //app.get('/jobResult/:JobID',adHocJobHandler.getJobResult);

    // Get AdHoc Job Result File
    app.get('/adHocJobResultFile/:JobID', commonHandler.getAdHocJobResultFile);

    // Download Result File    
    app.get('/downloadAdHocJobResultFile/:JobID', commonHandler.downloadAdHocJobResultFile);


    /******* Scheduled Job Routes ********/

    // Get All Scheduled Jobs
    app.get('/schedJob', schedJobHandler.getAllSchedJobs);

    // Get a specific Scheduled Job
    app.get('/schedJob/:JobID', schedJobHandler.getScheduledJobByJobID);


    // Submit New Scheduled Job
    app.post('/submitSchedJob', schedJobHandler.submitNewScheduledJob);

    // Submit New Scheduled Job
    app.put('/removeSchedJob/:JobID', schedJobHandler.removeScheuledJob);

    // Get AdHoc Job Log
    app.get('/schedJobLog/:JobID', commonHandler.schedJobLog);


    // Get Scheduled Job Result File
    app.get('/schedJobResultFile/:JobID', commonHandler.getSchedJobResultFile);

    // Download Result File    
    app.get('/downloadSchedJobResultFile/:JobID', commonHandler.downloadSchedJobResultFile);



    /* 
    var fileHandler = require('./controllers/fileHandler');
    app.get('/schedule', fileHandler.schedule);
    app.post('/execute', fileHandler.execute)
	app.get('/query', fileHandler.findAll);
    app.get('/query/:id', fileHandler.findById);
    app.put('/query/:id', fileHandler.update);
    app.delete('/query/:id', fileHandler.delete);
    */

    app.get('/', function (req, res) {
        res.sendFile('dashboard.html', { root: __dirname + '/../public/'}); 
    });

}