'use strict';

const nullLogger = require('./src/nullLogger.js');
const inert = require('inert');
const lodash = require('lodash');
const path = require('path');
const rimraf = require('rimraf-promise');
const Dropbox = require('dropbox');
const helpers = require('./src/helpers.js');

const defaultOpts = {
  addSimpleUIRoutes: false,
  addSystemRoutes: true,
  simpleUIRoutesPath: '/mem-mirror',
  nodeModulesPath: './',
  migrationsPath: './migrations',
  sqlitePath: './db.sqlite',
};

class MemMirror {
  constructor(server, opts, log) {
    this.server = server;
    this.opts = lodash.assign({}, defaultOpts, opts);
    this.log = log || nullLogger;

    if(server.app.memMirror) {
      throw new Error('memMirror already attached to server instance');
    }
    server.app.memMirror = this;
    this.ready = false;
    this.nodeEnv = process.env.NODE_ENV || 'production';
    this.isProd = this.nodeEnv === 'production';
    this.isDev = this.nodeEnv === 'dev';
    this.isQA = this.nodeEnv === 'qa';
  }

  prepare() {
    let p = Promise.resolve(true);

    if(this.opts.addSimpleUIRoutes) {
      p = p.then(() => this.server.register(inert))
        .then(() => {
          this.server.route({
            method: 'GET',
            path: `${this.opts.simpleUIRoutesPath}/{param*}`,
            handler: {
              directory: {
                path: path.resolve(__dirname, 'html'),
                defaultExtension: 'html'
              }
            }
          });

          this.server.route({
            method: 'GET',
            path: `${this.opts.simpleUIRoutesPath}/dropbox/{param*}`,
            handler: {
              directory: {
                path: path.resolve(__dirname, this.opts.nodeModulesPath, 'node_modules/dropbox/dist')
                //path: path.resolve(__dirname, 'node_modules/dropbox/dist')
              }
            }
          });
        });
    }

    console.log(' -> oops...');
    if(this.opts.addSystemRoutes) {
      //this.server.register(require('./config/)
      console.log(' -> add system route...');
      p = p.then(() => {
        const systemRoutes = require('./routes/system.js');
        return this.server.route(systemRoutes);
      });
    }

    return p;
  }

  dbInit(token) {
    //this.dropboxToken = token;
    this.dropbox = new Dropbox({accessToken: token});

    return helpers.checkIfDBExistsLocally(this)
    .then((exists) => {
      let p = Promise.resolve();
      if(this.isProd || (this.isDev && !exists)) {
        p = p.then(() => helpers.downloadDB(this));
      }
      if(this.isQA) {
        p = p.then(() => rimraf(this.opts.sqlitePath));
      }
      p = p.then(() => helpers.openDB(this));
      p = p.then(() => helpers.migrateDB(this));
      p = p.then(() => {this.ready = true;});
      return p;
    });
  }

  shutdown() {
    this.ready = false;
    let p = Promise.resolve();
    if(this.isProd) {
      p = p.then(() => helpers.uploadDB(this));
    }
    if(this.isProd || this.isQA) {
      p = p.then(() => rimraf(this.opts.sqlitePath));
    }
    return p;
  }
};

module.exports = MemMirror;
