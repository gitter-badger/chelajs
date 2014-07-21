var fs = require('fs'),
	enviroment;

var readConf = function (filePath) {
	var conf = fs.readFileSync(filePath).toString();

	return JSON.parse(conf);
};

if( process.env.NODE_ENV === 'production' ){
	enviroment = readConf('./config/prod.json');
	enviroment.env = 'production';
}else{
	enviroment = readConf('./config/dev.json');
	enviroment.env = 'development';
}

// Siedrix test info
// This email list is just for test
enviroment.mailchimp = enviroment.mailchimp || {
	apiKey : '103864b5d07a9a1e404762ade4b0fefb-us8',
	listId : 'e2d19ce768',
	webhookKey : 'hi'
};

module.exports = enviroment;
