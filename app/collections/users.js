var Backbone = require('../../lib/backbone');

var UserModel = Backbone.Model.extend({
	dbName : 'users'
});

var users = Backbone.Collection.extend({
	dbName : 'users',
	model : UserModel
});

module.exports = users;