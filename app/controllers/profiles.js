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
		var bioAsHtml  = marked(user.get('bio'));

		console.log('bioAsHtml?', bioAsHtml);

		res.render('profiles/profile', {
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

profileController.post('/:userName/update-bio', function (req, res) {
	var user = res.data.userName;

	if( _.isEmpty(res.data.userName) ){return res.sendError(404, 'user not found');}
	if( !(req.session.passport && req.session.passport.user && req.session.passport.user.username === user.get('username')) ){return res.sendError(403, 'forbiden');}

	user.set('bio', req.body.bio);
	user.save().then(function () {
		res.redirect( 'perfil/' + user.get('username') + '?update-bio=true' );
	}).catch(function (err) {
		res.sendError(500, err);
	});
});

module.exports = profileController;