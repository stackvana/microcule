// basic-tests.js
var test = require("tape");
var express = require('express');
var request = require('request');

var microcule, handler, app, server;

microcule = require('../');

var logger = microcule.plugins.logger;
var mschema = microcule.plugins.mschema;
var rateLimiter = microcule.plugins.rateLimiter
var spawn = microcule.plugins.spawn;

var handler = spawn({
  language: "javascript",
  code: function service (req, res) {
    res.json(req.params);
  }
});

test('attempt to start simple http server with some of the plugins spawn handler', function (t) {
  app = express();
  app.use(logger());
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

  app.use(handler, function (req, res) {
    res.end();
  });
  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "started HTTP microservice server");
    t.end();
  });
});

test('attempt to send simple http request to running microservice', function (t) {
  request({
    uri: 'http://localhost:3000/',
    method: "GET",
    json: true
  }, function (err, res, body) {
    t.equal(typeof body, "object", 'got correct response');
    //t.equal(body, "b", "echo'd back property")
    t.end();
  })
});

test('attempt to send JSON data to running microservice', function (t) {
  request({
    uri: 'http://localhost:3000/',
    method: "POST",
    json: {
      hello: "world"
    }
  }, function (err, res, body) {
    t.equal(typeof body, "object", 'got correct response');
    t.equal(body.hello, "world", "echo'd back property")
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});