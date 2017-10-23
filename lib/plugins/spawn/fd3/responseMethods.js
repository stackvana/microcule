// responseMethods.js
// This file handles mappings of JSON encoded HTTP response methods to actually HTTP response streams
// HTTP response methods are handled over STDERR encoded JSON instead of STDIO 3 and 4
// Overloading STDERR might not be the best design choice, but it does works and is leaves STDIO 3 and 4 open for future usage

var methods = {};
module['exports'] = methods;

/*
  The following HTTP methods are implemented...

    ✓ hook.res.writeHead
    ✓ hook.res.write
    ✓ hook.res.end
    ✓ hook.res.writeContinue
    ✓ hook.res.setTimeout ( missing callback argument )
    ✓ hook.res.statusCode (getter and setter)
    ✓ hook.res.statusMessage
    ✓ hook.res.setHeader
    ✓ hook.res.sendDate
    ✓ hook.res.removeHeader
    ✓ hook.res.addTrailers

    TODO:

      hook.res.headersSent
      hook.res.getHeader

*/

/*
 Remark: All methods carry the following signature:

  function (message, res)

  message: hash containing the hook.res.foo method payload
  res: the http response object

*/

methods.addTrailers = function (message, res) {
  res.addTrailers(message.payload.headers);
};

methods.removeHeader = function (message, res) {
  res.removeHeader(message.payload.name);
};

methods.setHeader = function (message, res) {
  try {
    res.setHeader(message.payload.name, message.payload.value);
  } catch (err) {
    // do nothing
  }
};

methods.setTimeout = function (message, res) {
  // TODO: add optional callback argument?
  res.setTimeout(message.payload.msecs);
};

methods.sendDate = function (message, res) {
  res.sendDate = message.payload.value;
};

methods.statusMessage = function (message, res) {
  res.statusMessage = message.payload.value;
};

methods.statusCode = function (message, res) {
  if (typeof message.payload.code === "number" && message.payload.code >= 100 && message.payload.code < 1000) {
    res.statusCode = message.payload.value;
  } else {
    // TODO: status.closed = true
    // res.end('bad res.statusCode values');
  }
};

methods.writeContinue = function (message, res) {
  res.writeContinue();
};

methods.writeHead = function (message, res) {
  if (typeof message.payload.code === "number" && message.payload.code >= 100 && message.payload.code < 1000) {
    try {
      res.writeHead(message.payload.code, message.payload.headers);
    } catch (err) {
      console.log('write head error', message);
    }
  } else {
    // TODO: status.closed = true
    // res.end('bad res.writeHead values');
  }
};