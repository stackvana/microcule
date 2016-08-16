module.exports = function (hook) {
  hook.res.write('Hello, this is a JavaScript function.\n');
  hook.res.write('hook.params is populated with request parameters\n');
  hook.res.write(JSON.stringify(hook.params, true, 2));
  hook.res.end('');
};