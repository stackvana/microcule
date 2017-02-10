var microcule = require('../');
var express = require('express');
var app = express();

var handler = microcule.plugins.spawn({
  bin: 'echo',
  argv: ['hello', 'world']
});

// tail the ReadMe.md file
// any changes to ReadMe.md in root of project will stream to client
/*
var handler = microcule.plugins.spawn({
  bin: 'tail',
  argv: ['-f', 'ReadMe.md'],
  config: {
    SERVICE_MAX_TIMEOUT: 60000
  }
});
*/

// spawn simple ls command to show current directories
/*
var handler = microcule.plugins.spawn({
  bin: 'ls',
  argv: ['.']
});
*/

// spawn a gcc program ( needs to be precompiled )
// to compile go to gcc folder and run: `gcc -o hello hello.c`
/*
var handler = microcule.plugins.spawn({
  bin: __dirname + '/services/echo/gcc/hello'
});
*/

app.use(handler);

app.listen(3000, function () {
  console.log('server started on port 3000');
});