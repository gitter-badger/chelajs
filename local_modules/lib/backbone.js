var Backbone = require('backbone'),
    levelDbBackboneAdapter = require('leveldb-backbone-adapter');

levelDbBackboneAdapter(Backbone, {
	db : 'chela-db'
});

module.exports = Backbone;