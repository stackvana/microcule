module.exports = function (hook) {
  hook.res.write(hook.params.STDIN);
  hook.res.end('\n');
};