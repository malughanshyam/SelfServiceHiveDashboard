module.exports = function(app){
    var fileHandler = require('./controllers/fileHandler');
    app.post('/submitJob', fileHandler.submitJob);
    app.get('/jobStatus', fileHandler.getStatus);
	app.get('/jobLog', fileHandler.getJobLog);
	app.get('/jobResult',fileHandler.getJobResult);
	app.get('/jobResultFile', fileHandler.getJobResultFile);


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