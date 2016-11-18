'use strict';

const fs = require('mz/fs');
const path = require('path');
const sqlite = require('sqlite');
const lodash = require('lodash');

module.exports.checkIfDBExistsLocally = function(mm) {
  return fs.exists(mm.opts.sqlitePath);
}

module.exports.downloadDB = function(mm) {
  console.log(' --- fetch');
  return mm.dropbox.filesListFolder({path: ''})
  .then((list) => {
    const file = lodash.find(list.entries, {path_lower: mm.opts.sqlitePath});
    if(!file) return;

    return mm.dropbox.filesDownload({path: mm.opts.sqlitePath})
    .then((file) => {
      console.log(' --- downloaded');
      return fs.writeFile(mm.opts.sqlitePath, file.fileBinary, 'binary');
    });
  });
}

module.exports.uploadDB = function(mm) {
  console.log(' --- upload');
  return fs.readFile(mm.opts.sqlitePath)
  .then((contents) => {
    return mm.dropbox.filesUpload({
      contents: contents,
      path: '/' + path.basename(mm.opts.sqlitePath),
      mode: 'overwrite',
    });
  });
}

module.exports.openDB = function(mm) {
  console.log(' --- open');
  return sqlite.open(mm.opts.sqlitePath, { Promise })
  .then((db) => {
    mm.db = db;
  });
}

module.exports.migrateDB = function(mm) {
  console.log(' --- migrate');
  const migrationOpts = {
    migrationsPath: mm.opts.migrationsPath
  };
  if(mm.isDev) migrationOpts.force = 'last';
  return mm.db.migrate(migrationOpts);
}
