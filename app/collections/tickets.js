var Backbone = require('../../lib/backbone');

var TicketsModel = Backbone.Model.extend({
	dbName : 'talks'
});

var Tickets = Backbone.Collection.extend({
	dbName : 'talks',
	model : TicketsModel
});

module.exports = Tickets;