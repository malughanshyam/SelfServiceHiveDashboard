// Include the MongoDB Schema 
module.exports = function(app){


    var adHocJobHandler = require('./controllers/adHocJobHandler');

    app.get('/adHocJob', adHocJobHandler.getAllAdHocJobs);
    app.get('/adHocJob/:JobID',adHocJobHandler.getAdHocJobByJobID);

    app.post('/submitNewAdHocJob', adHocJobHandler.submitNewAdHocJob);
    
    app.get('/jobStatus/:JobID', adHocJobHandler.getStatus);
    app.put('/jobStatus/:JobID', adHocJobHandler.updateStatus);

    app.get('/jobLog/:JobID', adHocJobHandler.getJobLog);
    app.get('/jobResult/:JobID',adHocJobHandler.getJobResult);
    app.get('/jobResultFile/:JobID', adHocJobHandler.getJobResultFile);


    var fileHandler = require('./controllers/fileHandler');
    
    app.get('/schedule', fileHandler.schedule);
    app.post('/execute', fileHandler.execute)

	app.get('/query', fileHandler.findAll);
    app.get('/query/:id', fileHandler.findById);
    app.put('/query/:id', fileHandler.update);
    app.delete('/query/:id', fileHandler.delete);

    app.get('/', function (req, res) {
        res.sendFile('dashboard.html', { root: __dirname + '/../public/'}); 
    });

}