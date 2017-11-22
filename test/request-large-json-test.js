// request-large-json-test.js
var test = require("tape");
var express = require('express');
var request = require('request');

var microcule, handler, luaHandler, app, server;

microcule = require('../');

test('attempt to start simple http server with spawn handler', function (t) {
  app = express();
  handler = microcule.plugins.spawn({
    language: "javascript",
    code: function service (req, res) {
     res.end('responded');
    }
  });
  app.use(handler, function (req, res) {
    res.end();
  });
  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "started HTTP microservice server");
    t.end();
  });
});

test('attempt to send large amount of JSON data to running microservice', function (t) {
  
  // create a large JSON object
  var obj = {};
  for (var i = 0; i < 100; i++) {
    obj[i] = new Buffer(1000).toString()
  }

  request({
    uri: 'http://localhost:3000/',
    method: "POST",
    json: obj
  }, function (err, res, body) {
    // console.log('bbb', body)
    t.equal(typeof body, "string", 'got correct response type');
    t.equal(body, "responded\n", 'got correct response');
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});