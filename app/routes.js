// Include the MongoDB Schema 
module.exports = function(app){

    // Import AdHocJob Controllers / Route Handlers
    var adHocJobHandler = require('./controllers/adHocJobHandler');

    // Import Scheduled Job Controllers / Route Handlers
    var schedJobHandler = require('./controllers/schedJobHandler');

   // Import Common Job Controllers / Route Handlers
    var commonHandler = require('./controllers/commonHandler');

    /********************************/
    /******* AdHoc Routes ***********/
    /********************************/

    // Get All AdHoc Jobs
    app.get('/adHocJob', adHocJobHandler.getAllAdHocJobs);

    // Get a specific AdHoc Job
    app.get('/adHocJob/:JobID',adHocJobHandler.getAdHocJobByJobID);

    // Submit new AdHoc Job
    app.post('/submitNewAdHocJob', adHocJobHandler.submitNewAdHocJob);
    
    // Get AdHoc Job Status
    app.get('/adHocJobStatus/:JobID', adHocJobHandler.getAdHocJobStatus);

    // Get AdHoc Job Log
    app.get('/adHocJobLog/:JobID', commonHandler.adHocJobLog);

    // Get AdHoc Job Result File
    app.get('/adHocJobResultFile/:JobID', commonHandler.getAdHocJobResultFile);

    // Download Result File    
    app.get('/downloadAdHocJobResultFile/:JobID', commonHandler.downloadAdHocJobResultFile);


    /****************************************/
    /******* Scheduled Job Routes ***********/
    /****************************************/

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

    // Default Route
    app.get('/', function (req, res) {
        res.sendFile('views/dashboard.html', { root: __dirname + '/../public/'}); 
    });

    app.use(function(req, res, next){
        res.status(404);

        // respond with html page
        if (req.accepts('html')) {
            res.status(404).sendfile('./public/views/404.html');
            return;
        }

        // respond with json
        if (req.accepts('json')) {
            res.send({ error: 'Page Not found' });
            return;
        }

        // default to plain-text. send()
        res.type('txt').send('Page Not found');
    });

}