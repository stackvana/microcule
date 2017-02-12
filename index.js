var microcule = {};

microcule.requireService = require('./lib/requireService');
microcule.requireServiceSync = require('./lib/requireServiceSync');

microcule.plugins = {
  "bodyParser": require('./lib/plugins/bodyParser'),
  "compile": require('./lib/plugins/compile'),
  "cronScheduler": require('./lib/plugins/cronScheduler'),
  "logger": require('./lib/plugins/logger'),
  "mschema": require('./lib/plugins/mschema'),
  "rateLimiter": require('./lib/plugins/rateLimiter'),
  "sourceGithubGist": require('./lib/plugins/sourceGithubGist'),
  "sourceGithubRepo": require('./lib/plugins/sourceGithubRepo'),
  "spawn": require('./lib/plugins/spawn')
};

// TODO: refactor viewPresenter into plugin
microcule.viewPresenter = require('./lib/viewPresenter');

module.exports = microcule;