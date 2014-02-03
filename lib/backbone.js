var Backbone = require('Backbone'),
    levelDbBackboneAdapter = require('leveldb-backbone-adapter');

levelDbBackboneAdapter(Backbone, {
	db : 'chela-db'
});

module.exports = Backbone;