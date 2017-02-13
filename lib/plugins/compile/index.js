var path = require('path');
var shasum = require('shasum');
var compileService = require('./compileServiceMappings');

module.exports = function compile (config) {
  // TODO: update API to use config...
  var Store = require('../Store');

  config = config || {};

  config.buildDir = path.resolve(__dirname + '/../../../tmp');

  // if no releaseDir is specified, will default to ./microcule/release directory
  config.releaseDir = config.releaseDir || path.resolve(__dirname + '/../../../release');

  console.log('using compile config', config)

  config.errorHandler = config.errorHandler || function (err, next) {
    if (err.message === "Bad credentials") {
      return next(new Error('Invalid Github oauth key: ' + config.token));
    }
    if (err.message === "Not Found") {
      return next(new Error('Could not load: ' + config.gistID));
    }
    return next(err);
  }

  // provider should be an instance of a node-redis client
  var provider = config.provider || new Store('memory', 'Source Github Repo');

  var _service = {};

  _service.code = config.service.code;
  // _service.schema = service.schema;
  _service.language = config.service.lang || config.service.language;

  _service.buildDir = config.buildDir;
  _service.releaseDir = config.releaseDir;

  // TODO: add provider pattern for state cache ( look into babel / coffee )

  if (typeof _service.code === "undefined" || typeof _service.language === "undefined") {
    throw new Error('invalid service object');
  }

  var targetCompiler = compileService[_service.language];
  if (typeof targetCompiler === "undefined") {
    throw new Error('invalid language choice: ' + _service.language);
  }

  // create shasum1 of service source code contents
  var sha = shasum(_service.code);
  _service.sha1 = sha;
  console.log('what is sha1', sha);
  
  
  // check if binary of same sha1 already exists ( has been previously compiled )
  // if compiled service already exists, simply continue with spawn and defined binary path

  // TODO: check that sha matches as well as language? potential issue here with same content files, but diffirent target languages

  // TODO: implement mutually exclusive lock for compilation step ( do not attempt to compile twice )
  // if service is compiling, simply return a 202 Accepted status until it's ready
  // mutually exclusive lock state is stored in Provider ( could be in-memory or in Redis )
  return function compileMiddleware (req, res, next) {
    req.service = _service;
    targetCompiler(req, res, function(err, result){
      if (err) {
        res.end(err.message);
      }
      next(null, result);
      // res.json(result);
    });
  }
}