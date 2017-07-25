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

// in-case we didn't end the response in the python script, create a middleware at the end of the request to catch and close the response
app.use(function (req, res) {
  res.end();
});

app.listen(config.http.port, function () {
  console.log('server started on port '+config.http.port);
});
