var controller = require('stackers'),
	_          = require('underscore'),
	Promise    = require('bluebird')
	config     = require('../../conf');

_.str = require('underscore.string');

var Events  = require('../collections/events'),
	Tickets = require('../collections/tickets'),
	Users   = require('../collections/users'),
	Talks   = require('../collections/talks');

var eventsController = controller({
	path : 'eventos'
});

eventsController.beforeEach(function(req, res, next){
	res.data.analytics = config.analytics || '';

	next();
});

eventsController.get('/:slug', function (req, res) {
	var events  = new Events();
	var tickets = new Tickets();
	var talks   = new Talks();
	var users   = new Users();

	events.fetchOne(function(item){
		return item.slug === req.params.slug;
	}).then(function(event){
		if(!event){ return res.send(404, 'Event not found');}

		var data = {
			event : event.toJSON(),
			user : req.session.passport.user
		};

		if(req.query['talk-send']){data.talkSend = true;}
		if(req.query['talk-updated']){data.talkEdit = true;}

		var qTickets = tickets.fetchFilter(function(item) {
			console.log(item.event, event.get('slug'));
			return item.event === event.get('slug');
		});

		var qTalks = talks.fetchFilter(function(item){
			return item.event === event.get('slug') && item.user === req.session.passport.user.username;
		});

		Promise.all([qTickets,qTalks])
		.then(function(){
			if(talks.length > 0){
				data.talk = talks.first().toJSON();
			}

			var userTicket;
			if(req.session.passport.user && req.session.passport.user.username){
				userTicket = tickets.find(function(item){
					return item.get('user') === req.session.passport.user.username;
				});
			}

			if( userTicket ){ data.hasTicket = true;}

			// // Populate avatar
			users.fetchFilter(function(user){
				var ticket;
				if(req.session.passport.user && req.session.passport.user.username){
					ticket = tickets.find(function(ticket){
						return ticket.get('user') === req.session.passport.user.username;
					});
				}

				if(ticket){
					ticket.set('avatar', user.data.avatar_url);
				}

				return;
			}).then(function(){
				data.attendees = tickets.toJSON();

				res.render('events/call-for-proposals',data);
			}).catch(function(err){
				res.send(500, err);
			});
		}).catch(function(err){
			res.send(500, err);
		});
	});
});

eventsController.post('/:slug/call-for-proposals', function (req, res) {
	var events = new Events();
	var talks  = new Talks();
	var event;

	events.fetchOne(function(item){
		return item.slug === req.params.slug;
	}).then(function(_event){
		if(!_event){ return res.send(404);}
		event = _event;

		var talkData = {
			event       : event.get('slug'),
			user        : req.session.passport.user.username,
			title       : req.body.title,
			description : req.body.description,
			experience  : req.body.experience,
			approved    : false
		};

		var talk = talks.add(talkData);

		return talk.save();
	}).then(function(){
		res.redirect('/eventos/'+ event.get('slug') + '?talk-send=success');
	}).catch(function(err){
		res.send(500, err);
	});
});

eventsController.post('/:slug/ticket', function (req, res) {
	var events = new Events(),
		tickets = new Tickets(),
		event;

	events.fetchOne(function(item) {
		return item.slug === req.params.slug;
	}).then(function(_event) {
		if (!_event) return res.send(404);
		event = _event;

		var newTicket = {
			event  : event.get('slug'),
			user   : req.session.passport.user.username,
			used   : false
		};

		var ticket = tickets.add(newTicket);
		return ticket.save();
	}).then(function() {
		res.redirect('/eventos/'+event.get('slug')+'?ticket=success');
	});
});

eventsController.post('/:slug/talks/:id/edit', function(req, res){
	var talks  = new Talks();

	talks.fetchFilter(function(item){
		return item.user  === req.session.passport.user.username &&
			item.event === req.params.slug;
	}).then(function(){
		var talk;
		if(talks.length === 0){
			res.send(404, 'no talk to save');
		}else{
			talk = talks.first();
		}

		talk.set({
			title       : req.body.title,
			description : req.body.description,
			experience  : req.body.experience,
		});

		talk.save().then(function(){
			res.redirect('/eventos/'+ req.params.slug + '?talk-updated=true');
		}).catch(function(err){
			res.send(500, err);
		})

	}).catch(function(err){
		res.send(500, err);
	});
});

module.exports = eventsController;
