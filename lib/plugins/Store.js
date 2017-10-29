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

Store.prototype.mget = function (services, cb) {
  var res = [], self = this;
  services.forEach(function(s){
    self.get(s, function(err, r){
      res.push(r);
    })
  });
  cb(null, res)
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

Store.prototype.sadd = function (key, value, cb) {
  this.services[key] = this.services[key] || [];
  // Note: will always add new and not overwrite ( this is not standard sadd behavior )
  this.services[key].push(value);
  cb(null, 'added');
};

Store.prototype.smembers = function (key, cb) {
  cb(null, this.services[key]);
};

//
// hash type
//

/*
Store.prototype.hdel = function hdel (key, cb) {
  cb(null, this.services[key]);
};
*/

Store.prototype.hget = function hget (key, field, cb) {
  if (typeof this.services[key] === 'undefined') {
    return cb(null, 0);
  }
  cb(null, this.services[key][field]);
};

Store.prototype.hkeys = function hkeys (key, cb) {
  cb(null, Object.keys(this.services[key]));
};

Store.prototype.hset = function hset (key, field, value, cb) {
  this.services[key] = this.services[key] || {};
  this.services[key][field] = value;
  cb(null, 1);
};

Store.prototype.hgetall = function hget (key, cb) {
  cb(null, this.services[key]);
};

Store.prototype.hincrby = function hget (key, field, value, cb) {
  this.services[key] = this.services[key] || {};
  if (typeof this.services[key][field] !== 'number') {
    this.services[key][field] = 0;
  }
  this.services[key][field] = this.services[key][field] + value; // could be negative value to decrement
  cb(null, 1);
};