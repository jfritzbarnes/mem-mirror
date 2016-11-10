'use strict';

const System = require('../handlers/system.js');

const API_BASE_PATH = '/system';

const routes = [];

routes.push({
  method: 'GET',
  path: API_BASE_PATH,
  handler: (req, reply) => { reply({db: {ready: req.server.app.ready}}); }
});

routes.push({
  method: 'POST',
  path: `${API_BASE_PATH}/dbinit/{token}`,
  handler: System.dbInit
});

module.exports = routes;
