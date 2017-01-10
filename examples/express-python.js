var microcule = require('../');
var config = require('../config');
var express = require('express');
var app = express();

var nodeService = 'import sys\n\
import logging\n\
import pprint\n\
pprint.pprint(globals())\n\
logging.getLogger("python").info("%s", globals())';

var handler = microcule.plugins.spawn({
  code: nodeService,
  language: "python"
});

app.use(handler);

app.listen(config.http.port, function () {
  console.log('server started on port '+config.http.port);
});
