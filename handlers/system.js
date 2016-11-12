'use strict';

const Dropbox = require('dropbox');
const sqlite = require('sqlite');
const rimraf = require('rimraf-promise');
const fs = require('mz/fs');

exports.dbInit = function(req, reply) {
  if(req.server.app.ready) {
    return reply({status: 'fail', message: 'server is in ready state'});
  }

  req.server.app.token = req.params.token;
  const dbx = new Dropbox({accessToken: req.server.app.token});
  dbx.filesListFolder({path: ''})
    .then((list) => {
      if(list.entries.length === 0 && !list.has_more) {
        console.log(' -- createSqlite');
        return createSqliteInstance(req);
      } else {
        console.log(' -- fetchSqlite');
        return fetchSqliteInstance(req, req.server.app.token);
      }
    })
    .then((data) => {
      return reply({data: data});
    })
    .catch((err) => {
      console.log(err);
      return reply({status: 'fail', message: err.message});
    });
};

exports.shutdown = function(req, reply) {
  if(!req.server.app.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  req.server.app.ready = false;
  return req.server.app.db.close()
    .then(() => uploadSqlite(req.server.app.token))
    .then(() => rimraf('./db.sqlite'))
    .then(() => {
      return reply({status: 'success'});
    })
    .catch((err) => {
      console.log(err);
      return reply({status: 'fail', message: err.message});
    });
};

exports.addConfig = function(req, reply) {
  if(!req.server.app.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  console.log(`name=${req.params.name}, value=${req.payload.value}`);
  const sql = 'INSERT INTO config (name, value, updated_at) VALUES (?, ?, ?)';
  const params = [req.params.name, req.payload.value, Date.now()];
  return req.server.app.db.run(sql, params)
    .then((result) => {
      //console.log('insert returned', result);
      return reply({status: 'success'});
    });
};

exports.getConfig = function(req, reply) {
  if(!req.server.app.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  const sql = 'SELECT * FROM config WHERE name=?';
  return req.server.app.db.get(sql, req.params.name)
    .then((data) => {
      //console.log('select returned', data);
      if(!data) {
        return reply({status: 'error', message: 'name not found'}).code(404);
      } else {
        return reply({status: 'success', data: data});
      }
    });
};

function createSqliteInstance(req) {
  return sqlite.open('./db.sqlite', { Promise })
    .then((db) => {
      req.server.app.db = db;
      return req.server.app.db.migrate({force: 'last'});
    })
    .then(() => {
      req.server.app.ready = true;
      return {status: 'success'};
    });
}

function fetchSqliteInstance(req, token) {
  const dbx = new Dropbox({accessToken: token});
  return dbx.filesDownload({path: '/db.sqlite'})
    .then((file) => {
      console.log('file downloaded...');
      return fs.writeFile('./db.sqlite', file.fileBinary, 'binary');
    })
    .then(() => sqlite.open('./db.sqlite', { Promise }))
    .then((db) => {
      req.server.app.db = db;
      return req.server.app.db.migrate({force: 'last'});
    })
    .then(() => {
      req.server.app.ready = true;
      return {status: 'success'};
    });
}

function uploadSqlite(token) {
  const dbx = new Dropbox({accessToken: token});
  return fs.readFile('./db.sqlite')
    .then((contents) => {
      return dbx.filesUpload({
        contents: contents,
        path: '/db.sqlite',
        mode: 'overwrite',
      });
    });
}
