// all-languages-tests.js
var test = require("tape");
var express = require('express');
var request = require('request');

var stack, handler, app, server, examples;

stack = require('../');

// Remark: babel and coffee-script are commented out since they aren't included in the package
// Even as devDependencies they are too big
var languages = ['bash', /* 'babel', 'coffee-script', */ 'smalltalk', 'lua', 'javascript', 'perl', 'php', 'python', 'python3', 'ruby', 'scheme', 'tcl'];

test('attempt to require microservice-examples module', function (t) {
  examples = require('microservice-examples');
  t.equal(typeof examples.services, "object", "returned services object");
  t.end();
});

test('check if examples are available for all languages', function (t) {
  languages.forEach(function (lang) {
    t.equal(true, Object.keys(examples.services).indexOf(lang + '-hello-world') > 0, 'found example service for ' + lang);
  });
  t.end();
});

test('attempt to start server with handlers for all languages', function (t) {
  app = express();
  app.use(stack.plugins.bodyParser());
  languages.forEach(function (lang) {
    var service = examples.services[lang + '-hello-world'];
    var handler = stack.spawn({
      language: lang,
      code: service.code
    });
    app.use('/' + lang, handler);
    t.equal(typeof handler, "function", "/" + lang + " HTTP endpoint added");
  });
  server = app.listen(3000, function () {
    t.end();
  });
});

test('attempt to run hello world all languages', function (t) {
  t.plan(languages.length);
  languages.forEach(function (lang) {
    request('http://localhost:3000/' + lang, function (err, res, body) {
      var noCarriageReturn = ["perl", "scheme", "php"];
      if (noCarriageReturn.indexOf(lang) !== -1) {
        t.equal(body, 'hello world', 'got correct response from ' + lang);
      } else {
        t.equal(body, 'hello world\n', 'got correct response from ' + lang);
      }
    });
  });
});
// TODO: request params test with JSON / language specific output

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok(true, "ended server");
    t.end();
  });
});