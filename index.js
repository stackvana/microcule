var stack = {};

stack.requireService = require('./lib/requireService');
stack.requireServiceSync = require('./lib/requireServiceSync');

stack.plugins = {
  "bodyParser": require('./lib/plugins/bodyParser'),
  "logger": require('./lib/plugins/logger'),
  "mschema": require('./lib/plugins/mschema'),
  "rateLimiter": require('./lib/plugins/rateLimiter'),
  "sourceGithubGist": require('./lib/plugins/sourceGithubGist'),
  "sourceGithubRepo": require('./lib/plugins/sourceGithubRepo'),
  "spawn": require('./lib/plugins/spawn')
};

// TODO: refactor viewPresenter into plugin
stack.viewPresenter = require('./lib/viewPresenter');

module.exports = stack;