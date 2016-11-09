'use strict';

const API_BASE_PATH = '/hello';

const routes = [];

routes.push({
  method: 'GET',
  path: API_BASE_PATH,
  handler: (req, reply) => { reply('Hello, world!'); }
});

routes.push({
  method: 'GET',
  path: `${API_BASE_PATH}/{name}`,
  handler: (req, reply) => { reply('Hello, ' + encodeURIComponent(req.params.name) + '!'); }
});

module.exports = routes;
