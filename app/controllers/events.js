var Controller = require('../../lib/controller'),
	_ = require('underscore'),
	conf = require('../../conf');

_.str = require('underscore.string');

var users = require('../collections/users'),
	events = require('../collections/events'),
	talks = require('../collections/talks');

var eventsController = Controller({
	path : 'eventos'
});

eventsController.get('/:slug', function (req, res) {
	events.get(req.params.slug, function (err, event) {
		if(!event){
			res.send(404);
			return;
		}

		if(event.stage === 'Call for proposals'){
			var data = {
				event : event,
				user : req.session.passport.user
			};

			if(req.query["talk-send"] ){
				data.talkSend = true;
			}

			res.render('events/call-for-proposals',data);
			return;
		}

		// Implement
		res.send(event);
	});
});

eventsController.post('/:slug/call-for-proposals', function (req, res) {
	events.get(req.params.slug, function (err, event) {
		if(!event){
			res.send(404);
			return;
		}

		var talk = {
			event : event.slug,
			user : req.session.passport.user.username,
			framework : req.body.framework,
			sites : req.body.sites,
			experience : req.body.experience,
			approved : false
		};

		var talkId = event.slug + ":" + req.session.passport.user.username + ":" + req.body.framework;

		talk.id = talkId;

		talks.put(talkId,talk,function(){
			res.redirect('/eventos/'+ event.slug + "?talk-send=success");
		});
	});
});

module.exports = eventsController;
