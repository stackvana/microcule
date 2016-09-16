var stack = require('../');
var express = require('express');
var app = express();

var bashHandler = stack.spawn({
  code: 'echo "hello"',
  language: "bash",
  // log property is optional
  log: function() {
    console.log("custom console.log function", arguments);
  },
  // schema property is optional
  schema: {
    "foo": {
      "type": "string",
      "required": true
    }
  },
  // view property is optional
  view: "this is a custom view. output: {{hook.output}}",
  // presenter property is optional and is used to transform the View of a microservice
  presenter: function viewPresenter (opts, cb) {
    var $ = this.$;
    cb(null, $.html().toUpperCase());
  }
});

var nodeHandler = stack.spawn({
  code: function testService (opts) {
    var res = opts.res;
    res.write('hello node!');
    res.end();
  },
  language: "javascript",
  // log property is optional
  log: function() {
    console.log("custom console.log function", arguments);
  },
  // schema property is optional
  schema: {
    "foo": {
      "type": "string",
      "required": true
    }
  },
  // view property is optional
  // views can be written in HTML and transformed using a presenter
  // views automatically support Mustache style {{hook}} templates
  // {{hook.output}} will render the main output of the hook response
  view: "this is a custom view. output: {{hook.output}}",
  // presenter property is optional and is used to transform the View of a microservice
  presenter: function viewPresenter (opts, cb) {
    // the presenter is scoped to the rendered view template
    // the $ variable provides a server-side jQuery interface
    var $ = this.$;
    cb(null, $.html().toUpperCase());
  }
});

app.use('/bash', bashHandler);
app.use('/node', nodeHandler);

app.listen(3000, function () {
  console.log('server started on port 3000');
  console.log('services start on /bash and /node');
  console.log('try visiting http://localhost:3000/node?foo=bar');
});