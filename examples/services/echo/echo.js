module.exports = function (req, res) {
  res.write('Hello, this is a JavaScript function.\n');
  res.write('hook.params is populated with request parameters\n');
  res.write(JSON.stringify(req.params, true, 2));
  res.end('');
};