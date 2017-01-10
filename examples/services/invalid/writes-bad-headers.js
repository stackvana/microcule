module.exports = function testService (req, res) {
  // does nothing...should trigger timeout
  res.writeHead("abc");

  res.writeHead(Infinity);
  res.writeHead(NaN);

  res.writeHead(99);
  res.statusCode = 99

  res.writeHead(1000);
  res.statusCode = 1000;
  
  res.writeHead(2, {
    123: 123,
    foo: undefined,
    _: new Date()
  });

  res.writeHead(200, {
    123: 123,
    foo: undefined,
    _: new Date()
  });

  res.statusMessage("abc");
  res.statusMessage = "abc";

  res.end();
};