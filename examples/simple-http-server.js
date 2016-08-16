var stack = require('../');
var http = require('http');

var bashService = 'echo "hello bash"';
var pythonService = 'print "hello python"';
var nodeService = function testService (opts) {
  var res = opts.res;
  res.write('hello node!');
  res.end();
};

var server = http.createServer(function(req, res){
  stack.spawn({
    code: nodeService,
    language: "javascript"
  }, req, res);
  // or you could use bash / any other supported language
  // stack.spawn({code: bashService, language: "bash" }, req, res);
  // stack.spawn({code: pythonService, language: "python" }, req, res);
  
});
server.listen(3000, function () {
  console.log('http server started on port 3000');
});