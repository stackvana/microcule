var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  // console.log('logging to console');
  setTimeout(function(){
    res.json(opts.params);
  }, 50);
};

var logger = require('../lib/plugins/logger');
var mschema = require('../lib/plugins/mschema');
var bodyParser = require('../lib/plugins/bodyParser');
var rateLimiter = require('../lib/plugins/rateLimiter');
var spawn = require('../lib/plugins/spawn');

var handler = spawn({
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
app.use(rateLimiter({
  maxLimit: 1000,
  maxConcurrency: 2
}));
app.use(handler);
app.use(function(req, res, next){
  // Note: It's most likely you will not be able to call res.end or res.write here,
  // as the microcule.plugins.spawn handler should end the response
  // Any middlewares places after microcule.plugins.spawn should be considered "post processing" logic
  console.log('post process service');
})

app.listen(3000, function () {
  console.log('server started on port 3000');
});