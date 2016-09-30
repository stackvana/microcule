var psr = require('parse-service-request');

module.exports = function bodyParserMiddleware (schema) {
  return function bodyParserHandler (input, output, next) {
    psr(input, output, function(req, res){
      next();
    });
  }
}