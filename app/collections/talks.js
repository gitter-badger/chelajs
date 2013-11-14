var collections = require('../../lib/collection');

var talks = collections.sublevel('talks');

talks.fetch = function (callback) {
	var talksArray = [];

	talks.createValueStream()
	.on('data', function(data){
		talksArray.push(data);
	})
	.on('end', function(){
		callback(null, talksArray);
	})
	.on('error', function(err){
		callback(err, null);
	});
};

module.exports = talks;