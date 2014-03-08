var controller = require('stackers'),
	spawn = require('child_process').spawn;

var utilsController = controller({
	path : '/utils'
});

utilsController.get('/backup', function (req, res) {
	// zip -r backup.zip chela-db/
	var zip  = spawn('zip', ['-r', 'backup.zip', 'chela-db/']);

	zip.on('close', function (code, signal) {
		console.log('backup zip created', code, signal);

		res.sendfile('./backup.zip');
	});
});

module.exports = utilsController;