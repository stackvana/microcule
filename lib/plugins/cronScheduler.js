// cronScheduler.js - schedule function calls on a timer using a simple [Cron](https://en.wikipedia.org/wiki/Cron) syntax
// requires the `cron-parser` package

var request = require('hyperquest');
var parser = require('cron-parser');
var async = require('async');

// TODO: setup cron as a looped process running in a supervisor?

module.exports = function (config) {
  
  // config which cron jobs will need to be run
  // note: this is currently immutable, as in jobs cannot be added or updated unless the process is restarted

  // simple in-memory store ( useful for local development )
  var Store = require('./Store');

  config = config || {};

  // provider should be an instance of a node-redis client
  var provider = config.provider || new Store('memory', 'Cron Scheduler');

  // the services which we will be scheduling to execute
  config.services = config.services || [];
  
  var uris = [];
  
  // register state of jobs in provider, could be Memory or Redis
  // for every service in the config, register that service with the provider
  // note: for redis usage, this will update / override existing keys ( keyed on service.url )
  config.services.forEach(function(s){
    s.lastRan = new Date();
    uris.push(s.uri);
    // TODO: add support for not resetting lastRan time
    // register service as url with cron pattern
    // any default values should be specified in the service itself or as url query string variables
    provider.set(s.uri, s, function(err, res){
      console.log(err, res);
    })
  });

  processAllCrons(provider, uris);
  
  // in addition to starting the cron service, we mount a simple route for showing all registered crons
  return function cronHandler (req, res, next) {
    provider.mget(uris, function(err, crons){
      if (err) {
        return res.end(err.message);
      }
      res.json(crons);
    })
  }
  
}

function processAllCrons (provider, uris) {
  
  console.log(new Date(), 'processing crons', uris.length);
  
  provider.mget(uris, function (err, crons) {
    if (err) {
      return res.end(err.message);
    }

    // console.log('got crons', crons);
    
    if (crons.length === 0) {
      console.log("No cron jobs found!");
      return finish();
    }

    function runCron (h, cb) {

      // do not attempt to run malformed crons ( they will throw in `cron-parser` library )
      if (typeof h.cron === "undefined" || h.cron.length < 8) {
        return cb();
      }
      
      // console.log('running the cron', h)

      // Remark: For testing you can hard-code the crons to run every-second
      // h.cron = "*/1 * * * * *";

      var now = new Date();

      var lastCron;
      if (typeof h.lastRan === "undefined") {
        lastCron = now;
      } else {
        lastCron = h.lastRan;
      }

      parseCron();

      function parseCron () {

        var last = new Date(lastCron);
        var options = {
          currentDate: last
        };
        /*
        console.log('last', last)
        console.log('now', now)
        console.log(h.cron.toString());
        */
        var error = false;
        try {
          var interval = parser.parseExpression(h.cron.toString(), options);
          var next = interval.next();
        } catch (err) {
          console.log('Error: ' + err.message);
          error = true;
          // ignore errors, keep going
          // TODO: mark hook as inactive / disabled due to error?
        }
        if (error) {
          return cb();
        }
        // if the next time the cron is suppose to run is before now ( minus a few ticks )
        if (next.getTime() < now.getTime() - 10) {
          var _url = h.uri + "?ranFromCron=true";
          console.log('⏰  triggered', h.uri, h.cron, last)
          
          var stream = request.get(_url, function(err, res) {
            if (err) {
              console.log('error running service', err.message);
            }
            h.lastRan = new Date();
            provider.set(h.uri, h, cb);
          });
        } else {
          console.log('⏲  waiting', h.uri, h.cron, last)
          return cb();
        }
      }
    };

    function finish (err, res) {
      console.log(new Date(), 'completed', err, res)
      setTimeout(function(){
        processAllCrons(provider, uris);
      }, 5000);
    };

    // run services with a concurrency of 5
    async.eachLimit(crons, 5, runCron, finish);

  });
}