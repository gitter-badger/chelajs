var repl = require('repl');

var terminal = repl.start({
	prompt: 'ChelaJs > ',
	input: process.stdin,
	output: process.stdout
});

terminal.context.Users   = require('./app/collections/users');
terminal.context.Talks   = require('./app/collections/talks');
terminal.context.Events  = require('./app/collections/events');
terminal.context.Tickets = require('./app/collections/tickets');

terminal.context.kill = function () {
	process.kill();
};
