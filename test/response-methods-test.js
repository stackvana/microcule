// response-methods-test.js
var test = require("tape");
var express = require('express');
var fs = require('fs');
var request = require('request');
var microcule, app, server;

microcule = require('../');

test('attempt to start simple http server with spawn handler', function (t) {
  app = express();

  var handler = microcule.plugins.spawn({
    language: "javascript",
    code: function service (req, res) {
      res.statusCode = 404;
      res.end('ended');
    }
  });
  app.use('/res-statusCode', handler, function (req, res) {
    res.end();
  });

  var resStatus = microcule.plugins.spawn({
    language: "javascript",
    code: function service (req, res) {
      res.status(403);
      res.end('ended');
    }
  });
  app.use('/res-status', resStatus, function (req, res) {
    res.end();
  });

  var resWriteHead = microcule.plugins.spawn({
    language: "javascript",
    code: function service (req, res) {
      res.writeHead(500, { 'custom-header-x': 'custom-val-0' });
      res.end('ended');
    }
  });
  app.use('/res-writeHead', resWriteHead, function (req, res) {
    res.end();
  });


  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "started HTTP microservice server");
    t.end();
  });
});

test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/res-statusCode', function (err, res, body) {
    t.equal(body, 'ended\n', 'got correct response');
    t.equal(res.statusCode, 404)
    t.end();
  })
});

test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/res-status', function (err, res, body) {
    t.equal(body, 'ended\n', 'got correct response');
    t.equal(res.statusCode, 403)
    t.end();
  })
});

test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/res-writeHead', function (err, res, body) {
    t.equal(body, 'ended\n', 'got correct response');
    t.equal(res.statusCode, 500);
    t.equal(res.headers['custom-header-x'], 'custom-val-0');
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});