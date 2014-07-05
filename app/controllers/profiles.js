var controller = require('stackers'),
	_ =  require('underscore'),
	marked = require('marked');

var Users   = require('../collections/users');
var Tickets = require('../collections/tickets');
var Events  = require('../collections/events');

var profileController = controller({
	path : 'perfil'
});

profileController.param('userName', function (userName, done) {
	var users = new Users();

	var q = users.fetchOne(function (item) {
		return  item.username === userName;
	});

	q.then(function (user) {
		done(null, user || {});
	}).catch(function (err) {
		done(err);
	});
});

profileController.get('', function (req, res) {
	if( !(req.session.passport && req.session.passport.user && req.session.passport.user.username ) ){
		return res.send('Render log in options');
	}

	var username = req.session.passport.user.username;

	var tickets = new Tickets();
	var events = new Events();
	var users = new Users();
	var user;

	users.fetchFilter(function (item) {
		return  item.username === username;
	}).then(function(data){
		user = users.first();

		return tickets.fetchFilter(function (item) {
			return item.user === username && item.used;
		})
	}).then(function () {
		var eventsAssisted = tickets.map(function (ticket) {return ticket.get('event');});

		return events.fetchFilter(function (item) {return eventsAssisted.indexOf(item.slug) >= 0; });
	}).then(function () {
		var updatedBio = req.query['update-bio'] ? true : false;
		var bioAsHtml  = marked(user.get('bio') || '');

		res.render('profiles/profile', {
			user         : req.session.passport.user,
			currentUser  : user.toJSON(),
			events       : events.toJSON(),
			profileOwner : true,
			updatedBio   : updatedBio,
			bioAsHtml    : bioAsHtml
		});
	}).catch(function (err) {
		res.send(500, err);
	});	
});

profileController.post('/update-bio', function (req, res) {

	if( !(req.session.passport && req.session.passport.user && req.session.passport.user.username) ){
		return res.sendError(403, 'forbiden');
	}

	var username = req.session.passport.user.username;
	var user;
	var users = new Users();

	users.fetchFilter(function (item) {
		return  item.username === username;
	}).then(function(){
		var user = users.first();
		user.set('bio', req.body.bio);
		
		return user.save()
	}).then(function () {
		res.redirect( 'perfil/?update-bio=true' );
	}).catch(function (err) {
		res.sendError(500, err);
	});
});

profileController.get('/:userName', function (req, res) {
	if(_.isEmpty(res.data.userName)){return res.sendError(404, 'user not found');}

	var user = res.data.userName;
	var profileOwner = false;

	if(req.session.passport && req.session.passport.user && req.session.passport.user.username === user.get('username')){
		profileOwner = true;
	}

	var tickets = new Tickets();
	var events = new Events();

	tickets.fetchFilter(function (item) {
		return item.user === user.get('username') && item.used;
	}).then(function () {
		var eventsAssisted = tickets.map(function (ticket) {return ticket.get('event');});

		return events.fetchFilter(function (item) {return eventsAssisted.indexOf(item.slug) >= 0; });
	}).then(function () {
		var updatedBio = req.query['update-bio'] ? true : false;
		var bioAsHtml  = marked(user.get('bio') || '');

		res.render('profiles/profile', {
			user         : req.session.passport.user,
			currentUser  : user.toJSON(),
			events       : events.toJSON(),
			profileOwner : profileOwner,
			updatedBio   : updatedBio,
			bioAsHtml    : bioAsHtml
		});
	}).catch(function (err) {
		res.send(500, err);
	});
});

module.exports = profileController;