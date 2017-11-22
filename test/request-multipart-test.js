// request-multipart-test.js
var test = require("tape");
var express = require('express');
var fs = require('fs');
var request = require('request');
var microcule, handler, app, server;

microcule = require('../');

test('attempt to start simple http server with spawn handler', function (t) {
  app = express();
  handler = microcule.plugins.spawn({
    language: "javascript",
    code: function service (req, res, next) {
      console.log(req.params)
      req.params.my_file.pipe(res);
      // res.end(req.params)
    }
  });
  app.use(handler, function(req, res){
    res.end();
  });
  server = app.listen(3000, function () {
    t.equal(typeof handler, "function", "started HTTP microservice server");
    t.end();
  });
});

/*
test('attempt to send simple http request to running microservice', function (t) {
  request('http://localhost:3000/', function (err, res, body) {
    t.equal(body, '{}\n', 'got correct response');
    t.end();
  })
});
*/

test('attempt to send multipart form data to running microservice', function (t) {
  
  var formData = {
    // Pass a simple key-value pair
    my_field: 'my_value',
    // Pass data via Buffers
    my_buffer: new Buffer([1, 2, 3]),
    // Pass data via Streams
    my_file: fs.createReadStream(__dirname + '/fixtures/assets/file.txt'),
    // Pass multiple values /w an Array
    attachments: [
      fs.createReadStream(__dirname + '/request-params-test.js'),
      fs.createReadStream(__dirname + '/basic-tests.js')
    ]
    /*
    ,
    // Pass optional meta-data with an 'options' object with style: {value: DATA, options: OPTIONS}
    // Use case: for some types of streams, you'll need to provide "file"-related information manually.
    // See the `form-data` README for more information about options: https://github.com/form-data/form-data
    custom_file: {
      value:  fs.createReadStream('/dev/urandom'),
      options: {
        filename: 'topsecret.jpg',
        contentType: 'image/jpeg'
      }
    }
    */
  };

  request.post({url:'http://localhost:3000/', formData: formData }, function optionalCallback(err, httpResponse, body) {
    t.error(err);
    t.equal(body, 'hello world\nline two');
    t.ok(true, 'did not error on multipart upload');
    t.end();
  });

  /*
  request({
    uri: 'http://localhost:3000/',
    method: "POST",
    json: {
      a: "b"
    }
  }, function (err, res, body) {
    t.equal(typeof body, "object", 'got correct response');
    t.equal(body.a, "b", "echo'd back property")
  })
  */
});

test('attempt to end server', function (t) {
  server.close(function(){
    t.ok("server ended");
    t.end();
  });
});