var Backbone = require('lib/backbone');

var EventsModel = Backbone.Model.extend({
	dbName : 'events'
});

var Events = Backbone.Collection.extend({
	dbName : 'events',
	model : EventsModel
});

//TODO validate that an event's type is one of these
Events.Types = {
	MEETUP: 'meetup',
	CODING: 'coding'
};

module.exports = Events;
