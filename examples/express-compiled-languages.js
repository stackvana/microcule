var microcule = require('../');
var express = require('express');
var app = express();

var service = {
  language: 'gcc',
  code: require('fs').readFileSync(__dirname + '/services/hello-world/hello.c').toString()
};

var spawn = microcule.plugins.spawn(service);

app.use(function(req, res, next){
  console.log('attempting to spawn', service)
  spawn(req, res, next);
});

app.listen(3000, function () {
  console.log('server started on port 3000');
});