'use strict';

const Joi = require('joi');

const API_BASE_PATH = '/config';
const routes = [];

routes.push({
  method: 'GET',
  path: `${API_BASE_PATH}/{name}`,
  handler: getConfig,
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
  path: `${API_BASE_PATH}/{name}`,
  handler: addConfig,
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

function getConfig(req, reply) {
  if(!req.server.app.memMirror.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  console.log('db object', req.db);

  const sql = 'SELECT * FROM config WHERE name=?';
  //return req.server.app.memMirror.getDB().get(sql, req.params.name)
  return req.db.get(sql, req.params.name)
  .then((data) => {
    if(!data) {
      return reply({status: 'error', message: 'name not found'}).code(404);
    } else {
      return reply({status: 'success', data: data});
    }
  });
}

function addConfig(req, reply) {
  if(!req.server.app.memMirror.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  const sql = 'INSERT INTO config (name, value, updated_at) VALUES (?, ?, ?)';
  const params = [req.params.name, req.payload.value, Date.now()];
  return req.server.app.memMirror.getDB().run(sql, params)
  .then((result) => {
    return reply({status: 'success'});
  })
  .catch((e) => {
    return reply({status: 'fail', message: e.message});
  });
}
