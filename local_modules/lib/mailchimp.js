var mcapi = require('mailchimp-api'),
	conf = require('../../conf');

var mc = new mcapi.Mailchimp(conf.mailchimp.apiKey);

mc.listId = conf.mailchimp.listId;

module.exports = mc;