var controller = require('stackers'),
	config = require('../../conf');

var homeController = controller({
	path : ''
});

homeController.beforeEach(function(req, res, next){
	res.data.analytics = config.analytics || '';

	next();
});

// Server routes
homeController.get('', function (req, res) {
	res.render('home',{
		user : req.session.passport.user
	});
});

module.exports = homeController;

