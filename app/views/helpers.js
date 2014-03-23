var _ = require('underscore');

var helpers = function(swig){
	swig.setFilter('isEmpty', function (obj) {
		return _.isEmpty(obj);
	});
};

module.exports = helpers;