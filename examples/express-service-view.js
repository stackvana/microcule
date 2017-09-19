var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  console.log('logging to console');
  res.end('Hello world!');
};

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript"
});

//var view = microcule.plugins.viewPresenter({}, req, res, next);

app.use('/view', function(req, res, next){
  microcule.viewPresenter({
    view: "Service outputs: {{hook.output}}"
  }, req, res, function(err, req, output){
    handler(req, output, next)
  })
});

/* presenter API has been removed ( for now )
app.use('/view-presenter', function(req, res, next){
  microcule.viewPresenter({
    view: "Service outputs: {{hook.output}} <div class='output'><div>",
    presenter: function (opts, cb) {
      opts.res.setHeader('Content-type', 'text/html');
      var $ = this.$;
      $('.output').html('presenters can use $ selectors');
      cb(null, $.html());
    }
  }, req, res, function(err, req, output){
    handler(req, output, next)
  })
});
*/

app.listen(3000, function () {
  console.log('server started on port 3000');
});