var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function authedService (req, res, next) {
  res.end('logged in');
};

var basicAuth = require('./services/middlewares/basic-auth');

var nodeHandler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript"
});

var basicAuthHandler = microcule.plugins.spawn({
  code: basicAuth,
  language: "javascript"
});

var logger = microcule.plugins.logger;

app.use([logger(), basicAuthHandler, nodeHandler], function (req, res) {
  res.end('no middlewares ended response, ending now');
});

app.listen(3000, function () {
  console.log('server started on port 3000');
});