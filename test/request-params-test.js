// basic-tests.js
var test = require("tape");
var express = require('express');
var request = require('request');

var stack, handler, app, server;

stack = require('../');

test('attempt to start simple http server with spawn handler', function (t) {
  app = express();
  handler = stack.plugins.spawn({
    language: "javascript",
    code: function service (service) {
      service.res.json(service.params);
    }
  });
  app.use(stack.plugins.bodyParser());
  app.use(handler);
  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "started HTTP microservice server");
    t.end();
  });
});

test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/', function (err, res, body) {
    t.equal(body, '{}\n', 'got correct response');
    t.end();
  })
});

test('attempt to send JSON data to running microservice', function (t) {
  request({
    uri: 'http://localhost:3000/',
    method: "POST",
    json: {
      a: "b"
    }
  }, function (err, res, body) {
    t.equal(typeof body, "object", 'got correct response');
    t.equal(body.a, "b", "echo'd back property")
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});