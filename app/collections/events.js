var Backbone = require('../../lib/Backbone');

var EventsModel = Backbone.Model.extend({
	dbName : 'events'
});

var Events = Backbone.Collection.extend({
	dbName : 'events',
	model : EventsModel
});

module.exports = Events;