var Backbone = require('../../lib/backbone');

var TicketsModel = Backbone.Model.extend({
	dbName : 'tickets'
});

var Tickets = Backbone.Collection.extend({
	dbName : 'tickets',
	model : TicketsModel
});

module.exports = Tickets;