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

var renderActive = function(event, req, res){
	var tickets = new Tickets();
	var talks   = new Talks();
	var users   = new Users();

	var data = {
		event : event.toJSON(),
		user : req.session.passport.user
	};

	if(req.query['talk-send']){data.talkSend = true;}
	if(req.query['talk-updated']){data.talkEdit = true;}

	var qTickets = tickets.fetchFilter(function(item) {
		return item.event === event.get('slug');
	});

	var qTalks = talks.fetchFilter(function(item){
		if(req.session.passport.user){
			return item.event === event.get('slug') && item.user === req.session.passport.user.username;
		}else{
			return false;
		}
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

		// Populate avatar
		return users.fetchFilter(function(user){
			var avatarTicket = tickets.find(function(ticket){
				return ticket.get('user') === user.username;
			});

			if(avatarTicket){
				avatarTicket.set('avatar', user.data.avatar_url);
			}
		});
	}).then(function(){
		data.attendees = tickets.toJSON();

		res.render('events/active',data);
	}).catch(function(err){
		res.send(500, err);
	});
};

var renderOngoing = function(event, req, res){
	var tickets = new Tickets();
	var users   = new Users();

	var data = {
		event : event.toJSON(),
		user : req.session.passport.user
	};

	var qTickets = tickets.fetchFilter(function(item) {
		return item.event === event.get('slug');
	});

	qTickets.then(function(){
		var userTicket, userUsedTicket;
		if(req.session.passport.user && req.session.passport.user.username){
			userTicket = tickets.find(function(item){
				return item.get('user') === req.session.passport.user.username;
			});

			userUsedTicket = tickets.find(function(item){
				return item.get('user') === req.session.passport.user.username && item.get('used');
			});
		}

		if( userTicket ){ data.hasTicket = true;}
		if( userUsedTicket ){ data.hasUsedTicket = true; }
		
		// Populate avatar
		return users.fetchFilter(function(user){
			var avatarTicket = tickets.find(function(ticket){
				return ticket.get('user') === user.username;
			});

			if(avatarTicket){
				avatarTicket.set('avatar', user.data.avatar_url);
			}
		});
	}).then(function(){
		data.attendeesOnEvent = tickets.filter(function(item){
			return item.get('used');
		}).map(function(item){
			return item.toJSON();
		});

		data.attendeesNotEvent = tickets.filter(function(item){
			return !item.get('used');
		}).map(function(item){
			return item.toJSON();
		});

		res.render('events/ongoing',data);
	}).catch(function(err){
		res.send(500, err);
	});
};

var renderFinished = function(event, req, res){
	var tickets = new Tickets();
	var users   = new Users();

	var data = {
		event : event.toJSON(),
		user : req.session.passport.user
	};

	var qTickets = tickets.fetchFilter(function(item) {
		return item.event === event.get('slug');
	});

	qTickets.then(function(){
		var userTicket, userUsedTicket;
		if(req.session.passport.user && req.session.passport.user.username){
			userTicket = tickets.find(function(item){
				return item.get('user') === req.session.passport.user.username;
			});

			userUsedTicket = tickets.find(function(item){
				return item.get('user') === req.session.passport.user.username && item.get('used');
			});
		}

		if( userTicket ){ data.hasTicket = true;}
		if( userUsedTicket ){ data.hasUsedTicket = true; }

		// Populate avatar
		return users.fetchFilter(function(user){
			var avatarTicket = tickets.find(function(ticket){
				return ticket.get('user') === user.username;
			});

			if(avatarTicket){
				avatarTicket.set('avatar', user.data.avatar_url);
			}
		});
	}).then(function(){
		data.attendees = tickets.filter(function(item){
			return item.get('used');
		}).map(function(item){
			return item.toJSON();
		});

		data.reviews = tickets.filter(function(item){
			return item.get('review');
		}).map(function(item){
			return item.toJSON();
		});

		res.render('events/finished',data);
	}).catch(function(err){
		res.send(500, err);
	});
};

eventsController.get('/:slug', function (req, res) {
	var events  = new Events();

	events.fetchOne(function(item){
		return item.slug === req.params.slug;
	}).then(function(event){
		if(!event){ return res.send(404, 'Event not found');}

		if( event.get('status') === 'active' ){renderActive(event, req, res);}
		if( event.get('status') === 'ongoing' ){renderOngoing(event, req, res);}
		if( event.get('status') === 'finished' ){renderFinished(event, req, res);}
	});
});

eventsController.post('/:slug/ticket', function (req, res) {
	var events = new Events(),
		tickets = new Tickets(),
		event;

	var qEvents = events.fetchFilter(function(item) {
		return item.slug === req.params.slug;
	});

	var qTickets = tickets.fetchFilter(function(item) {
		return	item.user === req.session.passport.user.username &&
				item.event === req.params.slug;
	});

	Promise.all([qEvents, qTickets]).then(function() {
		if (!events.length) return res.send(404);
		event = events.first();

		if (tickets.length){return res.redirect('/eventos/'+event.get('slug')+'?ticket=success');}

		var newTicket = {
			event  : event.get('slug'),
			user   : req.session.passport.user.username,
			used   : false
		};

		var ticket = tickets.add(newTicket);
		return ticket.save();
	}).then(function() {
		res.redirect('/eventos/'+event.get('slug')+'?ticket=success');
	}).catch(function (err) {
		res.send(500, err);
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
		});

	}).catch(function(err){
		res.send(500, err);
	});
});

eventsController.post('/:slug/check-in', function(req, res){
	var tickets = new Tickets();

	tickets.fetchFilter(function(item){
		return item.user  === req.session.passport.user.username &&
			item.event === req.params.slug;
	}).then(function(){
		var ticket;

		if(tickets.length > 0){
			// set ticket as used
			ticket = tickets.first();
			ticket.set('used', true);
		}else{
			// create ticket
			var ticketData = {
				event  : req.params.slug,
				user   : req.session.passport.user.username,
				used   : true
			};

			ticket = tickets.add(ticketData);
		}
		
		return ticket.save();
	}).then(function(){
		res.redirect('/eventos/'+ req.params.slug );
	}).catch(function(err){
		res.send(500, err);
	});
});

eventsController.post('/:slug/review', function(req, res){
	var tickets = new Tickets();

	tickets.fetchFilter(function(item){
		return item.user  === req.session.passport.user.username &&
			item.event === req.params.slug;
	}).then(function(){
		var ticket;

		if(tickets.length === 0){
			res.send(404, 'Not an attendee');
		}else{
			ticket = tickets.first();
			ticket.set('review', req.body.review);

			return ticket.save();
		}
	}).then(function(){
		res.redirect('/eventos/'+ req.params.slug + '?review=success');
	}).catch(function(err){
		res.send(500, err);
	});
});

module.exports = eventsController;
