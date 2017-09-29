var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (req, res, next) {
  res.json(req.params);
};

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript"
});

app.use(handler);

app.listen(3000, function () {
  console.log('server started on port 3000');
});