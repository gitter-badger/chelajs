var express = require('express.io'),
	swig = require('swig'),
	passport = require('passport');

var LevelStore = require('connect-level')(express);

var server = express();

// View engine
swig.setDefaults({
	root: './app/views',
	cache : false
});
var swigHelpers = require('./app/views/helpers');
swigHelpers(swig);

server.engine('html', swig.renderFile);
server.set('view engine', 'html');
server.set('views', __dirname + '/app/views');
server.set('view cache', false);

server.use(express.static('./public'));

if (process.env.NODE_ENV === 'production') {
	server.use(express.logger());
}else{
	server.use(express.logger('dev'));
}

// Server config
server.configure(function() {
	server.use(express.cookieParser());
	server.use(express.json());
	server.use(express.urlencoded());

	server.use(express.session({
		store: new LevelStore(),
		secret: 'super sekkrit'
	}));

	server.use(passport.initialize());
	server.use(passport.session());
});

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

server.get('/log-out', function (req, res) {
	req.session.destroy();

	res.redirect('/');
});

// Connections
var githubConnection = require('./app/connections/github');
githubConnection(server);

// Controllers
var homeController = require('./app/controllers/home');
var adminController = require('./app/controllers/admin');
var eventsController = require('./app/controllers/events');
var profilesController = require('./app/controllers/profiles');

homeController(server);
adminController(server);
eventsController(server);
profilesController(server);

server.listen(4000);
console.log('Server booted at', new Date() );

