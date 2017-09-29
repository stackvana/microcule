var psr = require('parse-service-request');

module.exports = function bodyParserMiddleware () {
  return function bodyParserHandler (input, output, next) {
    psr(input, output, function(req, res){
      next();
    });
  }
}