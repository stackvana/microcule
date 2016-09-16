var stack = require('../');
var http = require('http');

var handler = function testService (req, res) {
  res.write('hello node!');
  res.end();
};

/* could also be bash or any supported language 
  var handler = stack.spawn({
    code: 'echo "hello bash";', 
    language: "bash"
  });
*/

var server = http.createServer(function(req, res){
  handler(req, res);
});

server.listen(3000, function () {
  console.log('http server started on port 3000');
});