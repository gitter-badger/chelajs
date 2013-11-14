var collections = require('../../lib/collection');

var events = collections.sublevel('events');

events.fetch = function (callback) {
	var eventsArray = [];

	events.createValueStream()
	.on('data', function(data){
		eventsArray.push(data);
	})
	.on('end', function(){
		callback(null, eventsArray);
	})
	.on('error', function(err){
		callback(err, null);
	});
};

module.exports = events;