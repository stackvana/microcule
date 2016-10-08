// rateLimiter.js

//
// Built-in Memory Store
//
//  This is used to keep track of rate-limits in-memory
//  You should not be using this Memory store for production usage,
//  as it's state will fresh everytime you reinitialization / load the rateLimiter plugin
//

//
// Storing rate limit data Redis
//
/*
  The rateLimiter plugin expects a 'provider' option is passed into it's configuraiton
  This provider will default to in-memory, but can easily be extended to Redis by passing in a Redis client

  The rateLimiter provider requires the follow methods:

    provider.incr
    provider.incrBy

  If you are using a redis client, you should already have `incr` and `incrby` available.

*/

// X-RateLimit-Limit
// X-RateLimit-Remaining
// TODO: X-RateLimit-Concurrency
// X-RateLimit-Running
// TODO: X-RateLimit-Reset
/*
| X-RateLimit-Limit           | Request limit per hour                      |
+-----------------------------+---------------------------------------------+
| X-RateLimit-Remaining       | The number of requests left for the time    |
|                             | window                                      |
+-----------------------------+---------
*/

var Store = require('./Store');

module.exports = function rateLimitingMiddleware (config) {

  config = config || {};
  config.maxLimit = config.maxLimit || 1000;
  config.maxConcurrency = config.maxConcurrency || 2;

  config.maxConcurrencyMessage = "Rate limited: Max concurrency limit hit: " + config.maxConcurrency;
  config.maxLimitMessage = "Rate limited: Max services limit hit: " + config.maxLimit;

  // provider should be an instance of a node-redis client
  var provider = config.provider || new Store('memory');

  return function rateLimitingHandler (req, res, next) {
    var write = res.write;
    var end = res.end;

    // TODO: better default identity provider, perhaps get user name from system
    var owner = req.params.owner || "anonymous";

    res.on('close', function(){
      // console.log("res.close".magenta, res.statusCode);
      if (req.reduceCount === false) {
      } else {
        provider.zincrby(['running', -1, owner]);
      }
    });

    res.on('finish', function(){
      // console.log("res.finish".magenta, res.statusCode);
      if (req.reduceCount === false) {
      } else {
        provider.zincrby(['running', -1, owner]);
      }
    });

    res.setHeader('X-RateLimit-Limit', config.maxLimit);

    provider.zscore("hits", owner, function (err, hits) {

      // console.log('metric.' + owner + '.hits'.green, err, hits);
      res.setHeader('X-RateLimit-Remaining', (config.maxLimit - hits).toString());

      // if total hits for user account is exceeded, rate-limit
      if (Number(hits) >= config.maxLimit) {
        // TODO: better error message
        res.writeHead(500);
        req.reduceCount = false;
        return res.end(config.maxLimitMessage);
      }

      // Get total amount of running hooks for current user
      provider.zscore("running", owner, function (err, total) {
        if (err) {
          return res.end(err.message);
        }
        if (total === null) {
          total = 0;
        }
        res.setHeader('X-RateLimit-Running', total.toString());
        // console.log('metric.' + owner + '.running'.green, total, config.maxConcurrency)
        // if total running is greater than account concurrency limit, rate-limit the request
        if (Number(total) >= config.maxConcurrency) {
          // TODO: better error message
          res.writeHead(500);
          req.reduceCount = false;
          return res.end(config.maxConcurrencyMessage);
        }
        provider.zincrby(['hits', 1, owner]);
        provider.zincrby(['running', 1, owner], next);
        next();
      });
    });
  };
};