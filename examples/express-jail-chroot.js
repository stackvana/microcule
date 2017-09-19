var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  console.log('logging to console');
  res.end('ran service');
};

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript",
  jail: "chroot",
  jailArgs: [ '/Users/worker']
});

app.use(handler);

app.listen(3000, function () {
  console.log('server started on port 3000');
});