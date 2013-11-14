var repl = require("repl");

var terminal = repl.start({
	prompt: "ChelaJs > ",
	input: process.stdin,
	output: process.stdout
});

terminal.context.db = require('./lib/db');
terminal.context.users = require('./app/collections/users');
terminal.context.talks = require('./app/collections/talks');
terminal.context.events = require('./app/collections/events');

terminal.context.kill = function () {
	process.kill();
};
