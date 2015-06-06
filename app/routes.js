// Include the MongoDB Schema 
module.exports = function(app){


    var adHocJobHandler = require('./controllers/adHocJobHandler');

    app.get('/adHocJob', adHocJobHandler.getAdHocJob);
    app.post('/submitNewAdHocJob', adHocJobHandler.submitNewAdHocJob);
    app.get('/jobStatus', adHocJobHandler.getStatus);

    app.get('/jobLog', adHocJobHandler.getJobLog);
    app.get('/jobResult',adHocJobHandler.getJobResult);
    app.get('/jobResultFile', adHocJobHandler.getJobResultFile);


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