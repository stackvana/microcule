var microcule = require('../');
var express = require('express');
var app = express();
var multiline = require('multiline');

var service = {
  language: 'c',
  code: multiline(function(){/*
  #include<stdio.h>
  int main(void)
  { // This is a comment
    printf("Hello world!\n");
    return 0;
  }
*/})
};

var compile = microcule.plugins.compile(service);

app.use(function(req, res, next){
  compile(req, res, function (err, service){
    // service.bin
    // service.argv
    console.log('attempting to spawn', service)
    var spawn = microcule.plugins.spawn({
      bin: service.bin,
      argv: ['hello', 'world']
    });
    spawn(req, res, next);
  })
});

app.listen(3000, function () {
  console.log('server started on port 3000');
});