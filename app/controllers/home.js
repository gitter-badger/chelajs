var controller = require('stackers'),
	config = require('../../conf'),
	moment = require('moment');

var Events = require('../collections/events');

var homeController = controller({
	path : ''
});

homeController.beforeEach(function(req, res, next){
	res.data.analytics = config.analytics || '';

	next();
});

// Server routes
homeController.get('', function (req, res) {
	var q = Events.findOne(function(event){
		return event.current === true &&
			event.type === Events.Types.MEETUP;
	});

	q.then(function(event){
		var eventData;

		if(event){
			eventData = event.toJSON();
			eventData.date = moment( event.get('date') ).lang('es').format('MMMM DD');
		}

		res.render('home',{
			user  : req.session.passport.user,
			event : eventData
		});
	}).catch(function(err){
		res.send(500, err);
	});
});

module.exports = homeController;

