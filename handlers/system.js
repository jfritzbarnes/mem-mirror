'use strict';

const Dropbox = require('dropbox');

exports.dbInit = function(req, reply) {
  if(req.server.app.ready) {
    return reply({status: 'fail', message: 'server is in ready state'});
  }

  const token = req.params.token;
  var dbx = new Dropbox({accessToken: token});
  dbx.filesListFolder({path: ''})
    .then((list) => {
      return reply({listFiles: list});
    })
    .catch((err) => {
      console.log(err);
      return reply({status: 'fail', message: err.message});
    });
};
