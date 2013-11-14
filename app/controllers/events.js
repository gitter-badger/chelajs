var Controller = require('../../lib/controller'),
	_ = require('underscore'),
	conf = require('../../conf');

_.str = require('underscore.string');

var users = require('../collections/users'),
	events = require('../collections/events');

var eventsController = Controller({
	path : 'eventos'
});

eventsController.get('/:slug', function (req, res) {
	events.get(req.params.slug, function (err, event) {
		console.log('Events:',event.name, event.stage );
		if(!event){
			res.send(404);
			return;
		}

		if(event.stage === 'Call for proposals'){
			res.render('events/call-for-proposals',{
				event : event,
				user : req.session.passport.user
			});
			return;
		}

		// Implement
		res.send(event);
	});
});

module.exports = eventsController;
