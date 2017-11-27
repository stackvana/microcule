// invalid-service-test.js
// attempts to run several user-defined services which may error in unique ways
var test = require("tape");
var express = require('express');
var request = require('request');
var fs = require('fs');
var path = require('path');

var microcule, handlers = {}, app, server;

test('attempt to require microcule', function (t) {
  microcule = require('../');
  t.equal(typeof microcule, 'object', 'microcule module required');
  t.end();
});

test('attempt to create multiple invalid spawn handlers', function (t) {

  handlers['missing-exports'] = microcule.plugins.spawn({
    language: "javascript",
    code: fs.readFileSync(__dirname + '/fixtures/invalid-services/missing-exports.js').toString()
  });

  handlers['never-responds'] = microcule.plugins.spawn({
    language: "javascript",
    code: fs.readFileSync(__dirname + '/fixtures/invalid-services/never-responds.js').toString(),
    customTimeout: 1600
  });

  handlers['require-error'] = microcule.plugins.spawn({
    language: "javascript",
    code: fs.readFileSync(__dirname + '/fixtures/invalid-services/require-error.js').toString()
  });

  handlers['syntax-error'] = microcule.plugins.spawn({
    language: "javascript",
    code: fs.readFileSync(__dirname + '/fixtures/invalid-services/syntax-error.js').toString()
  });

  handlers['writes-bad-headers'] = microcule.plugins.spawn({
    language: "javascript",
    code: fs.readFileSync(__dirname + '/fixtures/invalid-services/writes-bad-headers.js').toString()
  });

  handlers['missing-command'] = microcule.plugins.spawn({
    language: "bash",
    redirectStderrToStdout: true, // shows error in response for non-zero exit codes
    code: fs.readFileSync(__dirname + '/fixtures/invalid-services/missing-command.sh').toString()
  });

  handlers['missing-command-silent'] = microcule.plugins.spawn({
    language: "bash",
    code: fs.readFileSync(__dirname + '/fixtures/invalid-services/missing-command.sh').toString()
  });

  t.end();
});

test('attempt to start simple http server with multiple invalid services', function (t) {
  app = express();

  app.use('/missing-exports', handlers['missing-exports']);
  app.use('/never-responds', handlers['never-responds']);
  app.use('/require-error', handlers['require-error']);
  app.use('/syntax-error', handlers['syntax-error']);
  app.use('/writes-bad-headers', handlers['writes-bad-headers']);
  app.use('/missing-command', handlers['missing-command']);
  app.use('/missing-command-silent', handlers['missing-command-silent']);

  // Required for non-js services ( or else response will not end )
  app.use(function(req, res){
    res.end();
  });

  server = app.listen(3000, function () {
    t.end();
  });
});

test('attempt to send request to javascript missing-exports service', function (t) {
  request('http://localhost:3000/missing-exports', function (err, res, body) {
    t.equal(res.statusCode, 500);
    t.equal(body, 'service is undefined', 'got correct response');
    t.end();
  })
});

test('attempt to send request to javascript never-responds', function (t) {
  request('http://localhost:3000/never-responds', function (err, res, body) {
    // timeouts return 200 instead of 500
    // t.equal(res.statusCode, 500);
    t.equal(res.statusCode, 200);
    t.equal(body.substr(0, 7), 'Timeout', 'got timeout response');
    t.end();
  })
});

test('attempt to send request to javascript require-error', function (t) {
  request('http://localhost:3000/require-error', function (err, res, body) {
    t.equal(res.statusCode, 500);
    t.equal(body, 'a is not defined', 'got correct node error');
    t.end();
  })
});

test('attempt to send request to javascript writes-bad-headers', function (t) {
  request('http://localhost:3000/writes-bad-headers', function (err, res, body) {
    t.equal(res.statusCode, 200);
    t.equal(body, '', 'got correct node error');
    t.end();
  })
});

test('attempt to send request to bash - missing command', function (t) {
  request('http://localhost:3000/missing-command', function (err, res, body) {
    t.equal(res.statusCode, 500);
    // t.equal(body, path.resolve(__dirname + '/../bin/binaries/micro-bash') + ': line 19: asdasd: command not found\n', 'got correct bash error');
    t.end();
  })
});

test('attempt to send request to bash - missing command - silent stderr', function (t) {
  request('http://localhost:3000/missing-command-silent', function (err, res, body) {
    t.equal(res.statusCode, 500);
    t.equal(body, '', 'got correct empty error response');
    t.end();
  })
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});