'use strict';

const nullLogger = require('./src/nullLogger.js');
const inert = require('inert');
const lodash = require('lodash');
const path = require('path');
const rimraf = require('rimraf-promise');
const Dropbox = require('dropbox');
const helpers = require('./src/helpers.js');

const defaultOpts = {
  dropboxClientID: 'unspecified',
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
        .then(() => this.server.register(require('vision')))
        .then(() => {
          this.server.views({
            engines: {
              js: {
                module: require('handlebars'),
                compileMode: 'sync',
                path: path.resolve(__dirname, 'html'),
              }
            }
          });

          this.server.route({
            method: 'GET',
            path: `${this.opts.simpleUIRoutesPath}/auth.js`,
            handler: (req, reply) => {
              const data = {
                version: '1.0',
                db_clientid: this.opts.dropboxClientID,
                authentication_url: 'http://localhost:8080' + this.opts.simpleUIRoutesPath + '/auth'
              };
              return reply.view('auth.js', data);
            }
          });

          console.log(`adding simple ui at: ${this.opts.simpleUIRoutesPath}`);
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

    this.server.decorate('request', 'db', () => {
      return (this.ready) ? this.db : null;
    }, {apply: true});

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

  getDB() {
    if(!this.ready) throw new Error('server is not ready');
    return this.db;
  }
};

module.exports = MemMirror;
