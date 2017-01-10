var microcule = require('../');
var config = require('../config');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  console.log('logging to console');
  res.end('ran service');
};

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript"
});

app.use(handler);

app.listen(config.http.port, function () {
  console.log('server started on port ' + config.http.port);
});