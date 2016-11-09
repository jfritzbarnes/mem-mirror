'use strict';

const Logger = require('../src/logger.js');

module.exports = {
  register: Logger,
  options: {
    name: 'dropbox-service'
  }
};
