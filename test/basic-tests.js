// basic-tests.js
var tap = require("tape");
var express = require('express');
var request = require('request');

var stack, handler, app, server;

tap.test('attempt to require stack', function (t) {
  stack = require('../');
  t.equal(typeof stack, "object");
  t.end('stack module required');
});

tap.test('attempt to create microservice spawn handler', function (t) {
  handler = stack.spawn({
    language: "bash",
    code: 'echo "hello world"'
  });
  t.equal(typeof handler, "function", "returned HTTP middleware function")
  t.end('created stack spawn handler');
});

tap.test('attempt to start simple http server with spawn handler', function (t) {
  app = express();
  app.use(handler);
  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "returned HTTP middleware function")
    t.end('created stack spawn handler');
  });
});

tap.test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/', function (err, res, body) {
    t.equal(body, 'hello world\n', 'got correct response');
    t.end('completed HTTP request');
  })
});

tap.test('attempt to end server', function (t) {
  server.close(function(){
    t.end("server ended");
  });
});
