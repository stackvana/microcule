module.exports = function testService (opts) {
  // does nothing...should trigger timeout
  var x = a.b;
  opts.res.end('end');
};