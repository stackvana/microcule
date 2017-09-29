var microcule = require('../');
var express = require('express');
var app = express();
var plugins = microcule.plugins;

var nodeService = express();
nodeService.use(plugins.logger());
nodeService.use(plugins.mschema({
  "hello": {
    "type": "string",
    "required": true
  }
}));
nodeService.use(plugins.rateLimiter({
  maxLimit: 1000,
  maxConcurrency: 2
}));
nodeService.use(plugins.spawn({
  code: function testService (opts) {
    var res = opts.res;
    res.write('hello node!');
    res.end();
  },
  language: "javascript"
}))
app.use('/node', nodeService);

var bashService = express();
bashService.use(plugins.logger());
bashService.use(plugins.mschema({
  "hello": {
    "type": "string",
    "required": true
  }
}));
bashService.use(plugins.rateLimiter({
  maxLimit: 1000,
  maxConcurrency: 2
}));
bashService.use(plugins.spawn({
  code: 'echo "hello world"',
  language: "bash"
}))
app.use('/bash', bashService);

app.listen(3000, function () {
  console.log('server started on port 3000');
  console.log('node endpoint mount at /node');
  console.log('bash endpoint mount at /bash')
});