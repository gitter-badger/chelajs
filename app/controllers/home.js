var controller = require('stackers'),
	config     = require('../../conf'),
	Promise    = require('bluebird'),
	moment     = require('moment');

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
	var qEvents = Events.findOne(function(event){
		return event.current === true &&
			event.type === Events.Types.MEETUP;
	});

	var qSessions = Events.find(function(event){
		return event.current === true &&
			event.type === Events.Types.CODING;
	});

	Promise.all([qEvents, qSessions])
	.spread(function(event, sessions) {
		var eventData;
		if(event){
			eventData = event.toJSON();
			var eventDate = moment(event.get('date'));
			if (eventDate.isBefore(moment())) {
					eventData.status = 'finished';
			}

			eventData.date = moment( event.get('date') ).lang('es').format('MMMM DD - hh:mm a');
		}

		sessions.forEach(function(session){
			session.set('time', moment( session.get('date') + ' ' + session.get('hour_start') ).lang('es').format('MMMM DD - hh:mm a') );
		});

		res.render('home',{
			user  : req.session.passport.user,
			event : eventData,
			home  : true,
			sessions : sessions.toJSON()
		});
	}).catch(function(err){
		res.send(500, err);
	});
});

module.exports = homeController;

