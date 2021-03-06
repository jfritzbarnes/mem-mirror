'use strict';

const Hapi = require('hapi');
const path = require('path');
const MemMirror = require('../mem-mirror.js');

const server = new Hapi.Server();
server.connection({port: 8080});

var opts = {
  addSimpleUIRoutes: true,
  dropboxClientID: process.env.CLIENTID,
  migrationsPath: path.resolve(__dirname, '../migrations'),
};
const mm = new MemMirror(server, opts);

const routes = require('./routes.js');
server.route(routes);

mm.prepare()
  .then(() => server.start())
  .then(() => {
    console.log(`Server running at: ${server.info.uri}`);
  })
  .catch((e) => {
    console.log(`Server start error: ${e.message}`);
    console.log(e);
  });


