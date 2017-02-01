'use strict';

const Hapi = require('hapi');
const inert = require('inert');
const Promise = require('bluebird');
const db = require('sqlite');

const server = new Hapi.Server();
server.connection({port: 8080});

server.app.nodeEnv = process.env.NODE_ENV || 'production';

server.register(inert, (err) => {
  if(err) throw err;

  server.route({
    method: 'GET',
    path: '/html/{param*}',
    handler: {
      directory: {
        path: 'html',
        defaultExtension: 'html'
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/dropbox/{param*}',
    handler: {
      directory: {
        path: 'node_modules/dropbox/dist'
      }
    }
  });
});

// load application plugins
const plugins = [
  require('./config/logs'),
  require('./config/routes'),
];

/*function register() {
  return server.register(plugins);
}
exports.register = register;

function start() {
  return register(plugins)
    .then(server.start.bind(server));
}
exports.start = start;

exports.server = server;*/

//console.log('going to attempt register...');
server.register(plugins)
  .then(() => {
    /*server.route({
      method: 'GET',
      path: '/',
      handler: (req, reply) => {
        reply('Hello, world!');
      }
    });

    server.route({
      method: 'GET',
      path: '/{name}',
      handler: (req, reply) => {
        reply('Hello, ' + encodeURIComponent(req.params.name) + '!');
      }
    });*/

    return server.start();
  }).then(() => {
    console.log(`Server running at: ${server.info.uri}`);
  }).catch((err) => {
    console.log(`Server start error: ${err.message}`);
    console.log(err);
  });
  


/*server.start((err) => {
  if(err) {
    throw err;
  }

  console.log(`Server running at: ${server.info.uri}`);
});*/
