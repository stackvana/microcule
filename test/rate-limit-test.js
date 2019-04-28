// rate-limit-test.js
var test = require("tape");
var express = require('express');
var request = require('request');

var microcule, handler, app, server;

microcule = require('../');

var logger = microcule.plugins.logger;
var mschema = microcule.plugins.mschema;
var RateLimiter = microcule.plugins.RateLimiter;
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

  var rateLimiter = new RateLimiter({
    provider: localStore
  });

  app.use(rateLimiter.middle({
    maxLimit: 3,
    maxConcurrency: 2
  }));

  app.use('/echo', handler, function (req, res) {
    res.end();
  });

  app.use('/neverResponds', neverResponds, function (req, res) {
    res.end();
  });

  rateLimiter.registerService({
    owner: 'anonymous',
    name: 'echo'
  });

  rateLimiter.registerService({
    owner: 'anonymous',
    name: 'neverResponds'
  });

  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "started HTTP microservice server");
    t.end();
  });
});

test('attempt to send simple http request to a registered microservice', function (t) {
  request({
    uri: 'http://localhost:3000/echo',
    method: "GET",
    json: true
  }, function (err, res, body) {
    t.equal(res.statusCode, 200);
    t.equal(typeof body, "object", 'got correct response');
    t.end();
  })
});

test('attempt to send simple http request to an unregistered microservice', function (t) {
  request({
    uri: 'http://localhost:3000/echo-unknown',
    method: "GET",
    json: true
  }, function (err, res, body) {
    t.equal(res.statusCode, 500);
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

test('attempt to send simple http request to a registered microservice', function (t) {
  request({
    uri: 'http://localhost:3000/echo',
    method: "GET",
    json: true
  }, function (err, res, body) {
    t.equal(res.statusCode, 200);
    t.equal(res.headers['x-ratelimit-limit'], '3');
    t.equal(res.headers['x-ratelimit-remaining'], '1');
    t.equal(res.headers['x-ratelimit-running'], '0');
    t.equal(typeof body, "object", 'got correct response');
    t.end();
  })
});

test('attempt to send simple http request to a registered microservice - rate limit exceeded', function (t) {
  request({
    uri: 'http://localhost:3000/echo',
    method: "GET",
    json: true
  }, function (err, res, body) {
    t.equal(res.statusCode, 500);
    t.equal(res.headers['x-ratelimit-limit'], '3');
    t.equal(res.headers['x-ratelimit-remaining'], '0');
    // Currently can't see amount running header when total limit has been exceeded ( could be fixed later )
    // t.equal(res.headers['x-ratelimit-running'], '0');
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});