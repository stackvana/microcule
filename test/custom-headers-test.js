// custom-headers-test.js
var test = require("tape");
var express = require('express');
var request = require('request');

var microcule, handler, app, server;

microcule = require('../');

test('attempt to start simple http server with spawn handler', function (t) {
  app = express();
  handler = microcule.plugins.spawn({
    language: "javascript",
    code: function service (req, res) {
      res.setHeader('x-custom', 'foo')
      res.writeHead(404);
      res.end();
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

test('attempt to send JSON data to running microservice', function (t) {
  request({
    uri: 'http://localhost:3000/',
    method: "POST"
  }, function (err, res, body) {
    t.equal(res.headers['x-custom'], 'foo')
    t.equal(res.statusCode, 404, 'got correct response');
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});