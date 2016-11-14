'use strict';

const Dropbox = require('dropbox');
const sqlite = require('sqlite');
const rimraf = require('rimraf-promise');
const fs = require('mz/fs');
const lodash = require('lodash');

exports.dbInit = function(req, reply) {
  if(req.server.app.ready) {
    return reply({status: 'fail', message: 'server is in ready state'});
  }

  req.server.app.token = req.params.token;
  req.server.app.dropbox = new Dropbox({accessToken: req.server.app.token});

  return checkIfDBExistsLocally(req)
    .then((exists) => {
      let p = Promise.resolve();

      const isProd = req.server.app.nodeEnv === 'production';
      const isDev = req.server.app.nodeEnv === 'dev';
      const isQA = req.server.app.nodeEnv === 'qa';
      if(isProd || (isDev && !exists)) {
        p = p.then(() => downloadDB(req));
      }
      if(isQA) {
        p = p.then(() => rimraf('db.sqlite'));
      }
      p = p.then(() => openDB(req));
      const migrationOpts = isDev ? {force: 'last'} : {};
      p = p.then(() => migrateDB(req, migrationOpts));
      p.then(() => {
        req.server.app.ready = true;
        reply({status: 'success'});
      })
      .catch((err) => {
        console.log(err);
        reply({status: 'fail', message: err.message});
      });
      return p;
    });
};

exports.shutdown = function(req, reply) {
  if(!req.server.app.ready) {
    return reply({status: 'fail', message: 'server is not ready'});
  }

  req.server.app.ready = false;

  let p = Promise.resolve();

  const isProd = req.server.app.nodeEnv === 'production';
  const isDev = req.server.app.nodeEnv === 'dev';
  const isQA = req.server.app.nodeEnv === 'qa';

  if(isProd) {
    p = p.then(() => uploadDB(req));
  }
  if(isProd || isQA) {
    p = p.then(() => rimraf('./db.sqlite'));
  }

  return p.then(() => {
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

function uploadDB(req) {
  return fs.readFile('./db.sqlite')
    .then((contents) => {
      return req.server.app.dropbox.filesUpload({
        contents: contents,
        path: '/db.sqlite',
        mode: 'overwrite',
      });
    });
}

function checkIfDBExistsLocally(req) {
  return fs.exists('./db.sqlite');
}

function downloadDB(req) {
  console.log(' -- fetch');
  return req.server.app.dropbox.filesListFolder({path: ''})
    .then((list) => {
      const file = lodash.find(list.entries, {path_lower: '/db.sqlite'});
      if(!file) return;

      return req.server.app.dropbox.filesDownload({path: '/db.sqlite'})
        .then((file) => {
          console.log('file downloaded...');
          return fs.writeFile('./db.sqlite', file.fileBinary, 'binary');
       })
    });
}

function openDB(req) {
  console.log(' -- open');
  return sqlite.open('./db.sqlite', { Promise })
    .then((db) => {
      req.server.app.db = db;
    });
}

function migrateDB(req, opts) {
  console.log(' -- migrate');
  return req.server.app.db.migrate(opts);
}
