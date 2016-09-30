// TODO: finish, this module is not complete / working yet
// see: http://stackoverflow.com/questions/16022624/examples-of-http-api-rate-limiting-http-response-headers

var Store = function Store (provider) {
  var self = this;
  self.services = {};
  return self;
};

Store.prototype.get = function (service) {
  return this.services[service] || 0;
};
Store.prototype.incr = function (service, incr) {
  this.services[service] = this.services[service] || 0;
  this.services[service] += incr;
};

module.exports = function rateLimitingMiddleware (config) {
  config = config || {};
  var provider = config.provider || new Store('memory');

  return function rateLimitingHandler (req, res, next) {
    // X-RateLimit-Limit
    // X-RateLimit-Remaining
    // X-RateLimit-Reset
    // TODO: check against provider for concurrency limits
    
    // check if store turns positive integer
    provider.incr(req.url, 1);
    console.log('services', provider.services);
    // TODO: make redis pluggable provider
    return res.end('Not implemented yet.');
    next();
  };
};

