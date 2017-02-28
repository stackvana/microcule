// basic-tests.js
var test = require("tape");
var express = require('express');
var request = require('request');

var microcule, handler, app, server;

test('attempt to require microcule', function (t) {
  microcule = require('../');
  t.equal(typeof microcule, 'object', 'microcule module required');
  t.end();
});

test('attempt to create microservice spawn handler', function (t) {
  handler = microcule.plugins.spawn({
    language: "bash",
    code: 'echo "hello world"'
  });
  t.equal(typeof handler, "function", "returned HTTP middleware function")
  t.end();
});

test('attempt to start simple http server with spawn handler', function (t) {
  app = express();
  app.use(handler);
  // Required for non-js services ( or else response will not end )
  app.use(function(req, res){
    res.end();
  });
  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "created listening HTTP server")
    t.end();
  });
});

test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/', function (err, res, body) {
    t.equal(body, 'hello world\n', 'got correct response');
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});