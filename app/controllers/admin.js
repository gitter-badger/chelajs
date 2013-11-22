var controller = require('../../lib/controller'),
	_ = require('underscore'),
	conf = require('../../conf');

_.str = require('underscore.string');

var users = require('../collections/users'),
	events = require('../collections/events'),
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
	users.fetch(function(err, data){
		res.render('admin/users',{
			users : data
		});
	});
});

adminController.get('/events', function (req, res) {
	events.fetch(function(err, data){
		res.render('admin/events',{
			events : data
		});
	});
});

adminController.get('/events/new', function (req, res) {
	res.render('admin/events-edit',{
		event : {}
	});
});

adminController.post('/events/new', function (req, res) {
	req.body.slug = _.str.slugify(req.body.name);
	events.put(req.body.slug, req.body, function () {
		res.redirect('/admin/events/edit/'+req.body.slug);
	});
});

adminController.get('/events/edit/:slug', function (req, res) {
	events.get(req.params.slug, function (err, data) {
		res.render('admin/events-edit',{
			event : data
		});
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