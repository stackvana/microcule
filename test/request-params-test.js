// basic-tests.js
var tap = require("tape");
var express = require('express');
var request = require('request');

var stack, handler, app, server;

stack = require('../');

tap.test('attempt to start simple http server with spawn handler', function (t) {
  app = express();
  handler = stack.spawn({
    language: "javascript",
    code: function service (service) {
      service.res.json(service.params);
    }
  });
  app.use(handler);
  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "returned HTTP middleware function")
    t.end('created stack spawn handler');
  });
});

tap.test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/', function (err, res, body) {
    t.equal(body, '{}\n', 'got correct response');
    t.end('completed HTTP request');
  })
});

tap.test('attempt to send JSON data to running microservice', function (t) {
  request({
    uri: 'http://localhost:3000/',
    method: "POST",
    json: {
      a: "b"
    }
  }, function (err, res, body) {
    t.equal(typeof body, "object", 'got correct response');
    t.equal(body.a, "b", "echo'd back property")
    t.end('completed HTTP request');
  })
});

tap.test('attempt to end server', function (t) {
  server.close(function(){
    t.end("server ended");
  });
});