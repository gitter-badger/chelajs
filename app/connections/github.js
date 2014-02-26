var passport = require('passport'),
	GitHubStrategy = require('passport-github').Strategy,
	conf = require('../../conf');

var Users = require('../collections/users');

var connection = function (server) {
	passport.use(new GitHubStrategy({
			clientID: conf.github.clientID,
			clientSecret: conf.github.clientSecret,
			callbackURL: conf.github.callbackURL
		},
		function(accessToken, refreshToken, profile, done) {
			var users = new Users();

			users.fetchOne(function(item){
				return item.provider === 'github' && item.username === profile.username;
			}).then(function (user) {
				if(user){
					done(null, user.toJSON() );
				}else{
					profile.username = profile.username;
					profile.provider = 'github';
					profile.accessToken = accessToken;
					profile.data = profile._json;
					delete profile._raw;
					delete profile._json;

					var newUser = users.add(profile);

					var q = newUser.save();

					q.then(function(){
						done(null, profile );
					}).catch(function(err){
						done(err);
					});
				}
			});
		}
	));

	server.get('/auth/github', passport.authenticate('github') );

	server.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/?login-failed=true' }),
	function(req, res) {
		res.redirect('/');
	});
};

module.exports = connection;