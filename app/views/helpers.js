var _ = require('underscore');

var helpers = function(swig){
	swig.setFilter('isEmpty', function (obj) {
		return _.isEmpty(obj);
	});
	swig.setFilter('prettyDate', function(obj, format) {
		return obj.format(format);
	});
};

module.exports = helpers;