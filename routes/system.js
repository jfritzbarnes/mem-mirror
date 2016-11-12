'use strict';

const System = require('../handlers/system.js');
const Joi = require('joi');

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

routes.push({
  method: 'POST',
  path: `${API_BASE_PATH}/shutdown`,
  handler: System.shutdown
});

routes.push({
  method: 'GET',
  path: `${API_BASE_PATH}/config/{name}`,
  handler: System.getConfig,
  config: {
    validate: {
      params: {
        name: Joi.string().min(1)
      },
    }
  }
});

routes.push({
  method: 'PUT',
  path: `${API_BASE_PATH}/config/{name}`,
  handler: System.addConfig,
  config: {
    validate: {
      params: {
        name: Joi.string().min(1)
      },
      payload: {
        value: Joi.string().required()
      }
    }
  }
});

module.exports = routes;
