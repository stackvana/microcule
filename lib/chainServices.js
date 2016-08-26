// chainServices.js - Responsible for chaining multiple services together
//                    current behavior is such that all service outputs are concat together
//                    It would probably be better if the services could also mutate req.resource.params

var spawn = require('./spawn');
var async = require('async');
var through = require('through2');
var streamBuffers = require('stream-buffers');

module.exports = function chainServices (services, input, output) {

  // TODO: chain interface would be better if spawn had an actual stream interface with .pipe()

  return function chainServicesMiddleware (input, output, next) {

    var hookOutput = new streamBuffers.WritableStreamBuffer({
        initialSize: (100 * 1024),        // start as 100 kilobytes.
        incrementAmount: (10 * 1024)    // grow by 10 kilobytes each time buffer overflows.
    });

    async.eachSeries(services, _chain, function(err){
      var contents = hookOutput.getContents();
      output.end(contents);
    });
  
    function _chain (service, cb) {

      // console.log('_chain.service'.green, service);

      var _output = through(function (chunk, enc, callback) {
        hookOutput.write(chunk);
        callback();
      }, function(){
        // console.log('done writing to output'.red);
        cb();
      });

      _output.on('error', function(err){
        // This should not actually fire, unless stream error
        console.log('_output ERROR', err.message);
        // TODO: add erroring boolean with timer?
        return output.end(err.message);
      });
      var handler = spawn(service);
      handler(input, _output);
    }
  }

};