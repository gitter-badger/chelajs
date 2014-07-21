var controller = require('stackers'),
	_ =  require('underscore'),
	marked = require('marked'),
	Promise = require('bluebird'),
	moment = require('moment'),
	mailchimp = require('lib/mailchimp'),
	config = require('../../conf'),
	GitHubApi = require('github');

var Users   = require('../collections/users');
var Tickets = require('../collections/tickets');
var Events  = require('../collections/events');
var Newsletter = require('../collections/mailchimp')

var github_key = config.github || {};
var github = new GitHubApi({
	version: "3.0.0",
	timeout: 2000
});

github.authenticate({
    type: "oauth",
    key: github_key.clientID,
    secret: github_key.clientSecret
});

var getReposFromUser = Promise.promisify( github.repos.getFromUser );

var profileController = controller({
	path : 'perfil'
});

profileController.param('userName', function (userName, done) {
	var users = new Users();

	var q = users.fetchOne(function (item) {
		return  item.username.toLowerCase() === userName.toLowerCase();
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
	var repos = [];
	var user;

	users.fetchFilter(function (item) {
		return  item.username === username;
	}).then(function(data){
		user = users.first();

		return tickets.fetchFilter(function (item) {
			return item.user === username && item.used;
		})
	}).then(function () {
		return getReposFromUser({
			user: user.get('username')
		}).tap(function( res ) {
			_.each( res, function( repo ){
				var repos_aux = {}
				repos_aux.id = repo.id.toString();
				repos_aux.name = repo.name;
				repos_aux.full_name = repo.full_name;
				repos.push( repos_aux );
			});
		});
	}).then(function () {
		var eventsAssisted = tickets.map(function (ticket) {return ticket.get('event');});

		return events.fetchFilter(function (item) {return eventsAssisted.indexOf(item.slug) >= 0; });
	}).then(function () {
		var updatedBio = req.query['update-bio'] ? true : false;
		var subscribe  = req.query.subscribe ? true : false;

		var bioAsHtml  = marked(user.get('bio') || '');

		var emails = user.get('emails');

		if( !(user.get('email') !== null || user.get('email') !== undefined) && emails.length){
			user.set('email', emails[0].value);
		}
		user.set('displayName', user.get('displayName') || user.get('username') );
		console.log('isSubcribed?', Newsletter.hasByEuid( user.get('euid') ) );

		res.render('profiles/profile', {
			user         : req.session.passport.user,
			currentUser  : user.toJSON(),
			events       : events.toJSON(),
			profileOwner : true,
			updatedBio   : updatedBio,
			isSubscribed : Newsletter.hasByEuid( user.get('euid') ),
			subscribe    : subscribe,
			bioAsHtml    : bioAsHtml,
			repos        : repos
		});
	}).catch(function (err) {
		res.send(500, err);
	});
});

profileController.get('/:userName', function (req, res) {
	if(_.isEmpty(res.data.userName)){return res.sendError(404, 'user not found');}

	var user = res.data.userName;
	var profileOwner = false;

	var repos = [];
	var tickets = new Tickets();
	var events = new Events();

	tickets.fetchFilter(function (item) {
		return item.user === user.get('username') && item.used;
	}).then(function () {
		var eventsAssisted = tickets.map(function (ticket) {return ticket.get('event');});
		return events.fetchFilter(function (item) {return eventsAssisted.indexOf(item.slug) >= 0; });
	}).then(function () {
		moment.lang('es');
		return getReposFromUser({
			user: user.get('username')
		}).tap(function( res ) {
			_.each( res, function( repo ){
				var repos_aux = {};
				repos_aux.id = repo.id.toString();
				repos_aux.name = repo.name;
				repos_aux.full_name = repo.full_name;
				repos_aux.description = repo.description;
				repos_aux.fork = repo.fork;
				repos_aux.last_update = repo.updated_at; 
				repos_aux.last_update_from_now = moment( repo.updated_at, "YYYY-MM-DDTHH:mm:ss").fromNow();
				if( _.indexOf( user.get('repos'), repos_aux.id) >= 0 ){
					repos.push( repos_aux );
				}
			});
			repos.sort(function(a,b){
				return new Date(b.last_update) - new Date(a.last_update);
			});
		});
	}).then(function () {
		var updatedBio = req.query['update-bio'] ? true : false;
		var bioAsHtml  = marked(user.get('bio') || '');

		res.render('profiles/profile', {
			user         : req.session.passport.user,
			currentUser  : user.toJSON(),
			events       : events.toJSON(),
			profileOwner : profileOwner,
			updatedBio   : updatedBio,
			bioAsHtml    : bioAsHtml,
			repos        : repos
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
	var users = new Users();

	users.fetchFilter(function (item) {
		return  item.username === username;
	}).then(function(){
		var user = users.first();

		user.set('displayName', req.body['display-name']);
		user.set('email', req.body.email);
		user.set('bio', req.body.bio);

		return user.save();
	}).then(function () {
		res.redirect( 'perfil/?update-bio=true' );
	}).catch(function (err) {
		res.sendError(500, err);
	});
});

profileController.post('/subscribe', function(req,res){
	if( !(req.session.passport && req.session.passport.user && req.session.passport.user.username) ){
		return res.sendError(403, 'forbiden');
	}

	var username = req.session.passport.user.username;
	var user;
	var users = new Users();

	users.fetchFilter(function (item) {
		return  item.username === username;
	}).then(function(){
		user = users.first();

		if(!user){
			return false;
		}

		return new Promise(function (resolve, reject) {
			mailchimp.lists.subscribe({
				id: config.mailchimp.listId, // List 
				email:{
					email:user.get('email'),// User email
				},
				merge_vars:{
					name:user.get('displayName')
				},
				send_welcome: true,
				double_optin: true,
				update_existing: true
			},
			function(data) {
				console.log('sucess', data);
				resolve(data);
			},
			function(err) {
				console.log('error', err);
				reject(err);
			});
		});
	}).then(function (data) {
		if(!data.euid){
			return false;
		}

		user.set('euid', data.euid);
		return user.save();
	}).then(function () {
		res.redirect( 'perfil/?subscribe=true' );
	}).catch(function (err) {
		res.sendError(500, err);
	});
});


profileController.post('/unsubscribe', function(req,res){
	if( !(req.session.passport && req.session.passport.user && req.session.passport.user.username) ){
		return res.sendError(403, 'forbiden');
	}

	var username = req.session.passport.user.username;
	var user;
	var users = new Users();

	users.fetchFilter(function (item) {
		return  item.username === username;
	}).then(function(){
		user = users.first();

		if(!user){
			return false;
		}

		return new Promise(function (resolve, reject) {
			mailchimp.lists.unsubscribe({
				id: config.mailchimp.listId, // List 
				email:{
					euid:user.get('euid'),// User email
				}
			},
			function(data) {
				console.log('sucess', data);
				resolve(data);
			},
			function(err) {
				console.log('error', err);
				reject(err);
			});
		});
	}).then(function (data) {
		if(!data.euid){
			return false;
		}

		user.set('euid', data.euid);
		return user.save();
	}).then(function () {
		res.redirect( 'perfil/?unsubscribe=true' );
	}).catch(function (err) {
		res.sendError(500, err);
	});
});

profileController.post('/update-repos', function (req, res) {
	if( !(req.session.passport && req.session.passport.user && req.session.passport.user.username) ){
		return res.sendError(403, 'forbiden');
	}

	var username = req.session.passport.user.username;
	var users = new Users();

	users.fetchFilter(function (item) {
		return  item.username === username;
	}).then(function(){
		var user = users.first();
		user.set('repos', req.body.repos);
		return user.save();
	}).then(function () {
		res.redirect( 'perfil/?update-bio=true' );
	}).catch(function (err) {
		res.sendError(500, err);
	});
});

module.exports = profileController;