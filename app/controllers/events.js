var controller = require('../../lib/controller'),
	_ = require('underscore'),
	config = require('../../conf');

_.str = require('underscore.string');

var Users = require('../collections/users'),
	Events = require('../collections/events'),
	Talks = require('../collections/talks');

var eventsController = controller({
	path : 'eventos'
});

eventsController.beforeEach(function(req, res, next){
	req.data.analytics = config.analytics || '';

	next();
});

eventsController.get('/:slug', function (req, res) {
	var events = new Events();

	var q = events.fetchOne(function(item){
		return item.slug === req.params.slug;
	});

	q.then(function(event){
		if(!event){ return res.send(404, 'Event not found');}

		var data = {
			event : event.toJSON(),
			user : req.session.passport.user
		};

		if(req.query['talk-send'] ){
			data.talkSend = true;
		}

		res.render('events/call-for-proposals',data);
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

		var talkId = event.slug + ':' + req.session.passport.user.username + ':' + req.body.framework;

		talk.id = talkId;

		talks.put(talkId,talk,function(){
			res.redirect('/eventos/'+ event.slug + '?talk-send=success');
		});
	});
});

module.exports = eventsController;
