var controller = require('stackers'),
	_ = require('underscore'),
	Promise = require('bluebird'),
	conf = require('../../conf');

_.str = require('underscore.string');

var Users = require('../collections/users'),
	Events = require('../collections/events'),
	Tickets = require('../collections/tickets');

var adminController = controller({
	path : 'admin'
});

adminController.beforeEach(function(req, res, next){
	// Validates that user is an admin in the conf file
	if(req.session &&
	req.session.passport &&
	req.session.passport.user &&
	conf.admins.indexOf(req.session.passport.user.username) >= 0){
		res.data.user = req.session.passport.user;
		next();
	} else {
		res.redirect('/');
	}
});

adminController.get('', function (req, res) {
	res.render('admin/home');
});

adminController.get('/users', function (req, res) {
	var users = new Users();
	users.fetch().then(function(){
		res.render('admin/users',{
			users : users.toJSON()
		});
	});
});

var eventList = function(eventType){
	return function (req, res) {
		var events = new Events();

		var q = events.fetchFilter(function(item){
			return item.type === eventType;
		});
		q.then(function(){
			res.render('admin/events',{
				events : events.toJSON(),
				eventType : eventType
			});
		});
	};
};

var eventNew = function (eventType) {
	return function (req, res) {
		res.render('admin/events-edit',{
			event : {},
			eventType : eventType
		});
	};
};

var eventCreate = function (eventType) {
	return function (req, res) {
		var events = new Events();
		var slug = _.str.slugify(req.body.name);
		var vent;

		events.fetchOne(function(item){
			return item.slug === slug;
		}).then(function(){
			if(events.length > 0){return res.send('Error: Event already exist[slug]');}

			req.body.slug = slug;
			req.body.type = eventType;
			vent = events.add(req.body);

			return vent.save();
		}).then(function(vent){
			res.redirect('/admin/'+ eventType +'/edit/'+vent.get('slug'));
		}).catch(function(err){
			res.send(500, err);
		});
	};
};

var eventSingle = function (eventType) {
	return function (req, res) {
		var events  = new Events();
		var users   = new Users();
		var tickets = new Tickets();
		var event;

		events.fetchOne(function(item){
			return item.slug === req.params.slug &&
				item.type === eventType;
		}).then(function(vent){
			if(!vent){ return res.send(404, 'Event doesnt exist'); }
			event = vent;

			return tickets.fetchFilter(function(item) {
				return item.event === vent.get('slug');
			});
		}).then(function () {
			return users.fetchFilter(function(user){
				var ticket = tickets.find(function(ticket){
					return ticket.get('user') === user.username;
				});

				if(ticket){
					ticket.set('displayName', user.displayName);

					if(user.emails && user.emails[0] && user.emails[0].value){
						ticket.set('email', user.emails[0].value);
					}
				}
			});
		}).then(function () {
			res.render('admin/events-edit',{
				event : event.toJSON(),
				eventType : eventType,
				tickets : tickets.toJSON()
			});
		}).catch(function(err){
			res.send(500, err);
		});
	};
};

var eventEdit = function (eventType) {
	return function (req, res) {
		var events = new Events(),
			vent;

		events.fetchOne(function(item){
			return item.slug === req.params.slug &&
				item.type === eventType;
		}).then(function(_vent){
			if(!_vent){ return res.send(404, 'Event doesnt exist');}
			vent = _vent;

			vent.set(req.body);

			return vent.save();
		}).then(function(){
			res.redirect('/admin/'+ eventType +'/edit/'+vent.get('slug'));
		}).catch(function(err){
			res.send(500, err);
		});
	};
};

adminController.get('/meetup', eventList(Events.Types.MEETUP));
adminController.get('/coding', eventList(Events.Types.CODING));

adminController.get('/meetup/new', eventNew(Events.Types.MEETUP));
adminController.get('/coding/new', eventNew(Events.Types.CODING));

adminController.post('/meetup/new', eventCreate(Events.Types.MEETUP));
adminController.post('/coding/new', eventCreate(Events.Types.CODING));

adminController.get('/meetup/edit/:slug', eventSingle(Events.Types.MEETUP));
adminController.get('/coding/edit/:slug', eventSingle(Events.Types.CODING));

adminController.post('/meetup/edit/:slug', eventEdit(Events.Types.MEETUP));
adminController.post('/coding/edit/:slug', eventEdit(Events.Types.CODING));

adminController.post('/meetup/set-as-current', function(req, res) {
	var slug = req.body.slug,
	events = new Events();

	if (!slug) {
		return res.send(404, {error: 'Event doesnt exist'});
	}

	var unsetCurrent = function() {
		return events.fetchOne(function (item) {
			return item.current  &&
				item.type === Events.Types.MEETUP;
		}).then(function(current) {
			if(!current) return true;

			current.set('current', false);
			return current.save();
		}).then(function() {
			return true;
		});
	};

	var setCurrent = function(slug) {
		return events.fetchOne(function (item) {
			return item.slug === slug  &&
				item.type === Events.Types.MEETUP;
		}).then(function(newCurrent) {
			if(!newCurrent){
				var err = new Error('object not found');
				err.status = 404;
				throw err;
			}

			newCurrent.set('current', true);
			return newCurrent.save();
		}).then(function() {
			return true;
		});
	};

	Promise.all([unsetCurrent(), setCurrent(slug)]).then(function(results) {
		res.send({results: results});
	}).catch(function(err) {
		var status = err.status || 500;
		res.send(status, err);
	});
});

adminController.post('/coding/set-as-current', function (req, res) {
	var slug = req.body.slug,
		events = new Events();

	if (!slug) {
		return res.send(404, {error: 'Event doesnt exist'});
	}

	events.fetchOne(function (item) {
		return item.slug === slug  &&
			item.type === Events.Types.CODING;
	}).then(function(current) {
		if(!current) return false;

		current.set('current', true);
		return current.save();
	}).then(function() {
		res.send({success: true});
	}).catch(function(err) {
		var status = err.status || 500;
		res.send(status, err);
	});
});

adminController.post('/coding/unset-as-current', function (req, res) {
	var slug = req.body.slug,
		events = new Events();

	if (!slug) {
		return res.send(404, {error: 'Event doesnt exist'});
	}

	events.fetchOne(function (item) {
		return item.slug === slug  &&
			item.type === Events.Types.CODING;
	}).then(function(current) {
		if(!current) return false;

		current.set('current', false);
		return current.save();
	}).then(function() {
		res.send({success: true});
	}).catch(function(err) {
		var status = err.status || 500;
		res.send(status, err);
	});
});

var utilsController = require('./utils');

adminController.attach(utilsController);

module.exports = adminController;
