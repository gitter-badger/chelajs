var controller = require('stackers'),
	config = require('../../conf');

var mailCollection = require('../collections/mailchimp');

var webHooksController = controller({
	path : '/webhooks'
});

webHooksController.get('/mailchimp', function (req, res) {
	if(req.query.key === config.mailchimp.webhookKey){
		mailCollection.fetch();

		res.send(200, {success:true});
	}else{
		res.send(403);
	}
});

webHooksController.post('/mailchimp', function (req, res) {
	if(req.query.key === config.mailchimp.webhookKey){
		mailCollection.fetch();

		res.send(200, {success:true});
	}else{
		res.send(403);
	}
});

module.exports = webHooksController;