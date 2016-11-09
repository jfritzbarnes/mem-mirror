'use strict';

const fs = require('fs');
const lodash = require('lodash');

const Routes = {
  register: (server, {pathToRoutes, cors, security}, next) => {
    fs.readdirSync(pathToRoutes).forEach((file) => {
      // only attempt to require javascript files
      if(/\.js$/.test(file)) {
        lodash.each(require(`${pathToRoutes}/${file}`), (route) => {
          server.bind(server);
          server.route(route);
        });
      }
    });
    next();
  }
};

Routes.register.attributes = {
  name: 'Routes',
  version: '1.0.0'
};

module.exports = Routes;
