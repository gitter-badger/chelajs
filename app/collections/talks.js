var Backbone = require('../../lib/backbone');

var TalksModel = Backbone.Model.extend({
	dbName : 'talks'
});

var Talks = Backbone.Collection.extend({
	dbName : 'talks',
	model : TalksModel
});

module.exports = Talks;