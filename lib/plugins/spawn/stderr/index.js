// stderr/index.js - handles all STDERR output from spawned service
// Remark: STDERR is currently overloaded to support JSON messages
// Overloading STDERR might not be the best design choice, but it does works and is leaves STDIO 3 and 4 open for future usage

var responseMethods = require('./responseMethods');
var stderr = {};
module['exports'] = stderr;

// processes incoming stderr buffer
stderr.onData = function onStderrData (data, status, debug, output, input) {
  var messages = data.toString();

  // Remark: Ignore special case"\nmodule.js:333", which is module require error
  //         This is a bit brittle, but is okay for now
  if (messages.substr(0, 1) !== "{" && messages.substr(0, 14) !== "\nmodule.js:333") {
    // Remark: Encode any non JSON messages as a JSON error message
    var message = { "type": "error", "payload": { "error": messages }};
    return handleMessage(message, status, debug, output, input);
  } 
  messages = messages.split('\n');
  messages.forEach(function(message){
    if (message.length === 0) {
      return;
    }
    // attempt to parse incoming stderr as JSON message
    try {
      message = JSON.parse(message.toString());
    } catch (err) {
      // don't do anything, ignore
      // message = { "type": "error", "payload": { "error": message.toString() }};
    }
    handleMessage(message, status, debug, output, input);
  });
};

var handleMessage = stderr.handleMessage = function (message, status, debug, output, input) {

  var request = require('request');

  /*
    stderr message types:

    error: error event from vm, send error stack as plaintext to client.
    log: console.log logging event, send log entry to logging system
    end: hook.res.end was called inside the vm, call output.end()
    untyped: any untyped messages are considered type `error` and will be wrapped as error types

  */
  // check to see if incoming message is a response method ( like res.writeHead )
  if  (typeof responseMethods[message.type] === "function") {
    responseMethods[message.type](message, output);
    return;
  }

  // if the incoming message is end event, signal that is time to end the response
  if (message.type === "end") {
    status.serviceEnded = true;
  }

  // send logging messages to the debug function ( redis logs at this point )
  if (message.type === "log") {
    debug(message.payload.entry);
    return;
  }

  /*
    TODO: implement req param setters for middlewares
    if (message.type === "setvar") {
      console.log('calling setvar...', message.payload)
      input[message.payload.key] = message.payload.value;
      return;
    }
  */

  // if the incoming message is an error
  if (message.type === "error") {
    status.erroring = true;

    // we don't know what happened at this point, or how much more error information is coming
    // let's just set a timer to end the request after a few moments
    // this ensures that most ( if not the entire ) error stack gets sent to the client
    if(!status.ended && output) {
      // wait 200 ms to account for any errors to flush
      output.write(message.payload.error);
      status.serviceEnded = true;
      /*
      Removed with new middleware API
      Note: Should this be added back?
      // status.ended = true;
      setTimeout(function(){
        output.end();
      }, 200)
      */
    }
  }
}