'use strict';

const bunyan = require('bunyan');

const Logger = {
  register: function(server, options, next) {
    const log = bunyan.createLogger(options);

    server.decorate('server', 'logger', log);
    return next();
  }
};

Logger.register.attributes = {
  name: 'Logger',
  version: '1.0.0'
};

module.exports = Logger;
