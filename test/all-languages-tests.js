// all-languages-tests.js
var test = require("tape");
var express = require('express');
var request = require('request');
var async = require('async');

var microcule, handler, app, server, examples;

microcule = require('../');

// Remark: babel and coffee-script are commented out since they aren't included in the package
// Even as devDependencies they are too big
// TODO: update tests to use local examples folder for hello world?
// or should it also include microcule-examples echo tests?
var languages = ['bash', 'gcc', /* 'babel', 'coffee-script', */ 'smalltalk', 'lua', 'go', 'javascript', 'perl', 'php', 'python', 'python3', 'ruby', 'rust', 'r', 'scheme', 'tcl'];

test('attempt to require microcule-examples module', function (t) {
  examples = require('microcule-examples');
  t.equal(typeof examples.services, "object", "returned services object");
  t.end();
});

test('check if examples are available for all languages', function (t) {
  languages.forEach(function (lang) {
    t.equal(true, Object.keys(examples.services).indexOf(lang + '-hello-world') > 0, 'found example service for ' + lang);
  });
  t.end();
});

//
// Remark: Travis-Ci is not able to easily support multiple language binaries in a single test
//         There is a solution available at: https://github.com/travis-ci/travis-ci/issues/4090,
//         but this will require a bit of tinkering
//         Until we have improved the .travis.yml file, these tests have been commented out
//
//
// Note:  The following tests should pass locally if you remove the return,
//         and you have every single target language binary installed locally
//
return;

test('attempt to start server with handlers for all languages', function (t) {
  app = express();
  app.use(microcule.plugins.bodyParser());
  languages.forEach(function (lang) {
    var service = examples.services[lang + '-hello-world'];
    var handler = microcule.plugins.spawn({
      language: lang,
      code: service.code
    });
    app.use('/' + lang, handler, function(req, res){
      res.end();
    });
    t.equal(typeof handler, "function", "/" + lang + " HTTP endpoint added");
  });
  server = app.listen(3000, function () {
    t.end();
  });
});

test('attempt to run hello world all languages', function (t) {

  var customResponses = {
    'r': '[1] "hello world"\n'
  };

  async.eachSeries(languages, function iter (lang, next) {
    request('http://localhost:3000/' + lang, function (err, res, body) {
      var customResponses = {
        "r": '[1] "hello world"\n'
      };
      var noCarriageReturn = ["perl", "scheme", "php"];
      if (typeof customResponses[lang] !== 'undefined') {
        t.equal(body, customResponses[lang], 'got correct response from ' + lang);
        next();
        return;
      }
      var doCRLF = ["python", "python3"];
      var crlf = (process.platform == 'win32')?'\r\n':'\n';
      if (noCarriageReturn.indexOf(lang) !== -1) {
        t.equal(body, 'hello world', 'got correct response from ' + lang);
      } else if (doCRLF.indexOf(lang) !== -1) {
        t.equal(body, 'hello world'+crlf, 'got correct response from ' + lang);
      } else {
        if (noCarriageReturn.indexOf(lang) !== -1) {
          t.equal(body, 'hello world', 'got correct response from ' + lang);
        } else {
          t.equal(body, 'hello world\n', 'got correct response from ' + lang);
        }
      }
      next();
    });
  }, function complete (err) {
    t.end();
  });
});
// TODO: request params test with JSON / language specific output

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok(true, "ended server");
    t.end();
  });
});