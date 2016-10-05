module.exports = function (config) {
  return function loggerHandler (req, res, next) {
    console.log('running service ' + req.url);
    next();
  }
}