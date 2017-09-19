var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  console.log('logging to console');
  setTimeout(function(){
    res.end('ran service');
  }, 10)
};

var bash = microcule.plugins.spawn({
  code: 'ps -ax',
  language: "bash",
  jail: "nsjail",
  jailArgs: [ '-Mo', '--chroot', '/var/chroot/', '--user', '99999', '--group', '99999']
});

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript",
  jail: "nsjail",
  jailArgs: [ '-Mo', '--chroot', '/var/chroot/', '--user', '99999', '--group', '99999']
});

var ps = microcule.plugins.spawn({
  bin: "/bin/ps",
  argv: ['-ax' ]
});

var psJail = microcule.plugins.spawn({
  bin: "/bin/ps",
  argv: ['-ax' ],
  jail: "nsjail",
  jailArgs: [ '-Mo', '--chroot', '/var/chroot/', '--user', '99999', '--group', '99999']
});

app.use('/node', handler);
app.use('/ps', ps);
app.use('/psjail', psJail);

app.listen(3000, function () {
  console.log('server started on port 3000');
});