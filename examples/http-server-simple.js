var microcule = require('../');
var http = require('http');

var service = function testService (opts) {
  opts.res.write('hello node!');ddd
  opts.res.end();
};

/* could also be bash or any supported language */
var handler = microcule.plugins.spawn({
  code: service,
  language: "javascript"
});

var server = http.createServer(function(req, res){
  handler(req, res, function (err) {
    if (err) {
      return res.end(err.message);
    }
    console.log('request completed', req.url);
  });
});

server.listen(3000, function () {
  console.log('http server started on port 3000');
});