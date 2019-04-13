var microcule = {};

microcule.config = require('./config');

microcule.requireService = require('./lib/requireService');
microcule.requireServiceSync = require('./lib/requireServiceSync');

microcule.plugins = {
  "bodyParser": require('./lib/plugins/bodyParser'),
  "compile": require('./lib/plugins/compile'),
  "logger": require('./lib/plugins/logger'),
  "mschema": require('./lib/plugins/mschema'),
  "RateLimiter": require('./lib/plugins/rateLimiter'),
  "sourceGithubGist": require('./lib/plugins/sourceGithubGist'),
  "sourceGithubRepo": require('./lib/plugins/sourceGithubRepo'),
  "spawn": require('./lib/plugins/spawn')
};

// TODO: refactor viewPresenter into plugin
microcule.viewPresenter = require('./lib/viewPresenter');

module.exports = microcule;