// rate-limit-test.js
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

var neverResponds = spawn({
  language: "javascript",
  customTimeout: 100,
  code: function service (req, res) {
    // does nothing
    console.log('never responding')
  }
});

var Store = require('../lib/plugins/Store');
var localStore = new Store('memory', 'Rate-Limiter');

test('attempt to start simple http server with rate limiter plugin', function (t) {
  app = express();

  app.use(rateLimiter({
    maxLimit: 1000,
    maxConcurrency: 2,
    provider: localStore
  }));

  app.use('/echo', handler, function (req, res) {
    res.end();
  });

  app.use('/neverResponds', neverResponds, function (req, res) {
    res.end();
  });

  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "started HTTP microservice server");
    t.end();
  });
});

test('attempt to send simple http request to microservice', function (t) {
  request({
    uri: 'http://localhost:3000/echo',
    method: "GET",
    json: true
  }, function (err, res, body) {
    t.equal(typeof body, "object", 'got correct response');
    //t.equal(body, "b", "echo'd back property")
    t.end();
  })
});

test('check metrics for current user', function (t) {

  t.equal(localStore.services['/system/report'].totalHits, 1, 'correct total hits - system report')
  t.equal(localStore.services['/system/report'].running, 0, 'correct currently running- system report')

  t.equal(localStore.services['/anonymous/echo/report'].totalHits, 1, 'correct total hits - service report')
  t.equal(localStore.services['/anonymous/echo/report'].running, 0, 'correct currently running- service report')

  t.equal(localStore.services['/anonymous/report'].totalHits, 1, 'correct total hits - user report')
  t.equal(localStore.services['/anonymous/report'].running, 0, 'correct currently running- user report')

  t.end();
});

test('attempt to send simple http request to microservice that never responds', function (t) {
  request({
    uri: 'http://localhost:3000/neverResponds',
    method: "GET",
    json: true
  }, function (err, res, body) {
    // t.equal(res.statusCode, 500);
    t.equal(res.statusCode, 200);
    t.end();
  })
});

test('check metrics for current user', function (t) {

  t.equal(localStore.services['/system/report'].totalHits, 2, 'correct total hits - system report')
  t.equal(localStore.services['/system/report'].running, 0,  'correct currently running- system report')

  t.equal(localStore.services['/anonymous/neverResponds/report'].totalHits, 1, 'correct total hits - service report')
  t.equal(localStore.services['/anonymous/neverResponds/report'].running, 0, 'correct currently running- service report')

  t.equal(localStore.services['/anonymous/report'].totalHits, 2, 'correct total hits - user report')
  t.equal(localStore.services['/anonymous/report'].running, 0, 'correct currently running- user report')

  t.end();
});


test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});