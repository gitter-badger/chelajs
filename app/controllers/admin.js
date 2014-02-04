var controller = require('../../lib/controller'),
	_ = require('underscore'),
	conf = require('../../conf');

_.str = require('underscore.string');

var Users = require('../collections/users'),
	Events = require('../collections/events'),
	talks = require('../collections/talks');

var adminController = controller({
	path : 'admin'
});

adminController.beforeEach(function(req, res, next){
	req.data = {};
	// Validates that user is an admin in the conf file
	if(req.session && req.session.passport && req.session.passport.user && conf.admins.indexOf(req.session.passport.user.username) >= 0){
		req.data.user = req.session.passport.user;
		next();
	}else{
		res.redirect('/');
	}
});

adminController.get('', function (req, res) {
	res.render('admin/home');
});

adminController.get('/users', function (req, res) {
	var users = new Users();
	var q = users.fetch();
	q.then(function(){
		var data_user = users.toJSON();
		console.log( data_user[0].emails );
		res.render('admin/users',{
			users : users.toJSON()
		});
	});
});

adminController.get('/events', function (req, res) {
	var events = new Events();

	var q = events.fetch();
	q.then(function(){
		res.render('admin/events',{
			events : events.toJSON()
		});
	});
});

adminController.get('/events/new', function (req, res) {
	res.render('admin/events-edit',{
		event : {}
	});
});

adminController.post('/events/new', function (req, res) {
	var events = new Events();
	var slug = _.str.slugify(req.body.name);

	var q = events.fetchOne(function(item){
		return item.slug === slug
	});	

	q.then(function(model){
		if(events.length > 0){
			res.send('Error: Event already exist');
		}

		req.body.slug = slug;
		var vent = events.add(req.body);

		var q = vent.save();

		q.then(function(){
			res.redirect('/admin/events/edit/'+vent.get('slug'));
		}).fail(function(err){
			res.send(500, err);
		});		
	});
});

adminController.get('/events/edit/:slug', function (req, res) {
	var events = new Events();

	var q = events.fetchOne(function(item){
		return item.slug === req.params.slug;
	});

	q.then(function(vent){
		if(!vent){
			res.send(404, 'Event doesnt exist');
		}

		res.render('admin/events-edit',{
			event : vent.toJSON()
		});
	});

	q.fail(function(err){
		res.send(500, err);
	});
});

adminController.post('/events/edit/:slug', function (req, res) {
	events.get(req.params.slug, function (err, data) {
		data = _.extend(data, req.body);

		events.put(req.params.slug, data, function () {
			res.redirect('/admin/events/edit/'+data.slug);
		});
	});
});

adminController.get('/talks', function (req, res) {
	talks.fetch(function(err, data){
		res.render('admin/talks',{
			talks : data
		});
	});
});

module.exports = adminController;