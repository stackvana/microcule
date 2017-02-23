var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (req, res, next) {
  console.log('inside a')
  res.write('HELLO\n')
  next();
};

var nodeServiceB = function testService (req, res, next) {
  console.log('inside b')
  res.write('WORLD\n')
  res.end('ended request');
};

var handlerA = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript"
});

var handlerB = microcule.plugins.spawn({
  code: nodeServiceB,
  language: "javascript"
});

var logger = microcule.plugins.logger;

app.use([logger(), handlerA, handlerB], function (req, res) {
  console.log("No middlewares ended response, made it to end");
  res.end('caught end')
});


app.listen(3000, function () {
  console.log('server started on port 3000');
});