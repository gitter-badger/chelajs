var _ = require('underscore');

var helpers = function(swig){
	swig.setFilter('isEmpty', function (obj) {
		return _.isEmpty(obj);
	});
	swig.setFilter('prettyDate', function(obj, format) {
		return obj.format(format);
	});
	swig.setFilter('has', function(array, item){
		return array.indexOf(item) !== -1 ? true : false;
	});
};

module.exports = helpers;