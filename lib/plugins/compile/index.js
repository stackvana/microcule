var compileService = require('./compileServiceMappings');

module.exports = function compile (service) {

  var _service = {};

  _service.code = service.code;
  // _service.schema = service.schema;
  _service.language = service.lang || service.language;

  if (typeof _service.code === "undefined" || typeof _service.language === "undefined") {
    throw new Error('invalid service object');
  }

  var targetCompiler = compileService[_service.language];
  if (typeof targetCompiler === "undefined") {
    throw new Error('invalid language choice: ' + _service.language);
  }

  return function compileMiddleware (req, res, next) {
    targetCompiler(_service, function(err, result){
      if (err) {
        res.end(err.message);
      }
      next(null, result);
      // res.json(result);
    });
  }
}