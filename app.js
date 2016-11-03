'use strict';

const Hapi = require('hapi');
const inert = require('inert');
const Promise = require('bluebird');
const db = require('sqlite');

const server = new Hapi.Server();
server.connection({port: 8080});

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

server.route({
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
});

server.start((err) => {
  if(err) {
    throw err;
  }

  console.log(`Server running at: ${server.info.uri}`);
});
