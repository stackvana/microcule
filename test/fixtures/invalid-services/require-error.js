var x = a.b;

module.exports = function testService (opts) {
  // does nothing...should trigger timeout
  opts.res.end('end');
};