var Backbone = require('lib/backbone'),
	mailchimp = require('lib/mailchimp'),
	conf = require('../../conf');

var MailModel = Backbone.Model.extend({
	dbName : 'mails'
});

var MailCollection = Backbone.Collection.extend({
	dbName : 'mails',
	model : MailModel
});

MailCollection.prototype.fetch = function() {
	var self = this;

	this.reset();
	mailchimp.lists.members({id: conf.mailchimp.listId},
	function(res) {
		console.log('Newsletter subscribers: ', res.total);

		self.add(res.data);
	},
	function(err) {
		console.log('error', err);
	});
};

MailCollection.prototype.hasByEuid = function(euid) {
	var items = this.filter(function(item){
		return item.get('euid') === euid;
	});

	return items.length ? true : false;
};

module.exports = new MailCollection();