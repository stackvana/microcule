var microcule = require('../');
var express = require('express');
var app = express();

var nodeService = function testService (opts) {
  var res = opts.res;
  console.log('logging to console');
  res.end('ran service');
};

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "javascript"
});


var bashService = microcule.plugins.spawn({
  code: 'echo "hello world"',
  language: "bash"
});

app.use('/myservice', handler);
app.use('/another-service', bashService);

app.use('/_cron', microcule.plugins.cronScheduler({
  precision: 5000, // run every 5 seconds ( with a mutex on concurrency, will not start until complete )
  services: [
    {
      uri: 'http://localhost:3000/myservice',
      cron: '* * * * *' // every minute
    },
    {
      uri: 'http://localhost:3000/another-service',
      cron: '*/5 * * * *' // every five minutes
    }
    
  ]
}));

app.listen(3000, function () {
  console.log('server started on port 3000');
});