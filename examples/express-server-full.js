var express = require('express');
var app = express();
var stack = require('../');

// could also be node service / php / python / etc
var bashService = 'echo "hello bash"';

app.use(
  stack.spawn({
  code: bashService, 
  language: "bash",
  view: "this is a custom view {{hook.output}}",
  presenter: function viewPresenter (opts, cb) {
    var $ = this.$;
    cb(null, $.html());
  }
}))

app.listen(3000);