/*

    Store.js - in-memory store which mocks some very simple redis commands for local development / testing

    Important: You should not be using this Store in production settings.
               Instead of using the default memory store, pass in a node-redis client instead

*/

var Store = function Store (provider, plugin) {
  var self = this;
  self.services = {};
  self.files = {};
  console.log('Warning: ' + plugin + ' is using default memory store. This is not suitable for production. Instead pass in a node-redis client.');
  return self;
};
module.exports = Store;
Store.prototype.get = function (service, cb) {
  cb(null, this.services[service] || 0)
};
Store.prototype.set = function (key, val, cb) {
  this.services[key] = val;
  cb(null, true)
};

Store.prototype.incr = function (service) {
  // callback not required, fire and forget to update value
  this.services[service] = this.services[service] || 0;
  this.services[service] += 1;
};

Store.prototype.incrby = function (service, by) {
  if (typeof by === "undefined") {
    by = 1;
  }
  this.services[service] = this.services[service] || 0;
  this.services[service] += by;
};

//
// Important: Redis sorted set commands ( zscore and zincrby ) are mocked here,
//            and will not perform a true sorted set operation.
//            These methods are only used for local dev and testing.
//
Store.prototype.zscore = function (zset, member, cb) {
  this.get(zset + '/' + member, cb)
};
Store.prototype.zincrby = function (args, cb) {
  if (typeof cb !== "function") {
    cb = function (err, res) {
    }
  }
  this.incrby(args[0] + "/" + args[2], args[1])
  cb(null);
};
