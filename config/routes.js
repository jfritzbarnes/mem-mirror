'use strict';
const path = require('path');
const Routes = require('../src/routes.js');

module.exports = {
  register: Routes,
  options: {
    pathToRoutes: path.normalize(__dirname + '/../routes')
  }
};
