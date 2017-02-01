'use strict';

const Dropbox = require('dropbox');
const sqlite = require('sqlite');
const rimraf = require('rimraf-promise');
const fs = require('mz/fs');
const lodash = require('lodash');

exports.dbInit = function(req, reply) {
  if(req.server.app.memMirror.ready) {
    return reply({status: 'fail', message: 'server is in ready state'});
  }

  return req.server.app.memMirror.dbInit(req.params.token)
  .then(() => {
    reply({status: 'success'});
  })
  .catch((err) => {
    console.log(err);
    reply({status: 'fail', message: err.message});
  });
};

exports.shutdown = function(req, reply) {
  if(!req.server.app.memMirror.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  return req.server.app.memMirror.shutdown()
  .then(() => {
    return reply({status: 'success'});
  })
  .catch((err) => {
    console.log(err);
    return reply({status: 'fail', message: err.message});
  });
};

exports.addConfig = function(req, reply) {
  if(!req.server.app.memMirror.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  console.log(`name=${req.params.name}, value=${req.payload.value}`);
  const sql = 'INSERT INTO config (name, value, updated_at) VALUES (?, ?, ?)';
  const params = [req.params.name, req.payload.value, Date.now()];
  return req.server.app.memMirror.getDB().run(sql, params)
    .then((result) => {
      //console.log('insert returned', result);
      return reply({status: 'success'});
    });
};

exports.getConfig = function(req, reply) {
  if(!req.server.app.memMirror.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  const sql = 'SELECT * FROM config WHERE name=?';
  return req.server.app.memMirror.getDB().get(sql, req.params.name)
    .then((data) => {
      //console.log('select returned', data);
      if(!data) {
        return reply({status: 'error', message: 'name not found'}).code(404);
      } else {
        return reply({status: 'success', data: data});
      }
    });
};
