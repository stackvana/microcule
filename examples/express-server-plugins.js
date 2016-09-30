var stack = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  // console.log('logging to console');
  res.json(opts.params);
};


var logger = require('../lib/plugins/logger');
var mschema = require('../lib/plugins/mschema');
var bodyParser = require('../lib/plugins/bodyParser');
var rateLimiter = require('../lib/plugins/rateLimiter');

var handler = stack.spawn({
  code: nodeService,
  language: "javascript"
});

app.use(logger());
app.use(bodyParser());
app.use(mschema({
  "hello": {
    "type": "string",
    "required": true
  }
}));

app.use(handler);

app.listen(3000, function () {
  console.log('server started on port 3000');
});