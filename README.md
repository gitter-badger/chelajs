## Getting started
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/javascriptmx/chelajs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Running ChelaJs repo

    npm install

ChelaJs uses LevelDb as Database and session store, so no extra dependencies are needed, just node modules.

## Starting the server

ChelaJS requires the `NODE_PATH` variable to include the directory `./local_modules` e.g.

    NODE_PATH='$NODE_PATH:./local_modules' node server.js

If you use nodemon, this is configure in `nodemon.json` so alternatively you can just run

    nodemon

## Conf file

Copy sample config to config folder and add a github keys to sample

	mkdir config
	cp config-sample.json config/dev.json

### Set your self as admin

Go to dev.json and set you github username in the admin array

### Setting Github keys

Chela Js uses github as log in, we are developers after all.

Create your github keys [here](https://github.com/settings/applications/new)

Use http://chelajs-dev.com:3000/auth/github/callback as callback url.

You can add this to your host file(sudo vim/nano /etc/hosts)

	127.0.0.1  chelajs-dev.com

So you can develop with the oauth easier

### Template

Swig.js is used for the template engine, check documentation [here](http://paularmstrong.github.io/swig/docs/).

### Helping with the style

For help with styles, stylus + nib

	npm install stylus -g
	npm install nib -g

Then run

	stylus -u nib -w -c -o public/css/ public/stylus/*.styl
