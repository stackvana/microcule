// service-as-middleware-tests.js
var test = require("tape");
var express = require('express');
var request = require('request');

var microcule, handlers = {}, app, server;

test('attempt to require microcule', function (t) {
  microcule = require('../');
  t.equal(typeof microcule, 'object', 'microcule module required');
  t.end();
});

test('attempt to create a few chainable microservice spawn handlers', function (t) {

  handlers['basicAuth'] = microcule.plugins.spawn({
    language: "javascript",
    code: function (req, res, next) {
      var auth = require('basic-auth')
      var credentials = auth(req)
      if (!credentials || credentials.name !== 'admin' || credentials.pass !== 'password') {
        //res.statusCode(401);
        res.setHeader('WWW-Authenticate', 'Basic realm="examples"')
        res.writeHead(401);
        res.end('Access denied');
      } else {
        next();
      }
    }
  });

  handlers['write-a'] = microcule.plugins.spawn({
    language: "bash",
    code: 'echo "a"'
  });
  handlers['write-b'] = microcule.plugins.spawn({
    language: "javascript",
    code: function (req, res, next) {
      res.write('b\n');
      next(); // call next() to indicate this services is not going to explictly end the response
    }
  });
  handlers['write-c'] = microcule.plugins.spawn({
    language: "bash",
    code: 'echo "c"'
  });
  t.end();
});

test('attempt to start simple http server with spawn handler', function (t) {
  app = express();

  app.use([handlers['basicAuth'], handlers['write-a'], handlers['write-b'], handlers['write-c']], function (req, res) {
    console.log("No middlewares ended response, made it to end");
    res.end('caught end')
  });

  server = app.listen(3000, function () {
    t.end();
  });
});

test('attempt to send simple http request to running microservice', function (t) {
  request('http://admin:password@localhost:3000/', function (err, res, body) {
    t.equal(body, 'a\nb\nc\ncaught end', 'got correct response');
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});