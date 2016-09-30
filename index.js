var stack = {};
stack.spawn = require('./lib/spawn');
stack.chainServices = require('./lib/chainServices');
stack.viewPresenter = require('./lib/viewPresenter');
stack.validateRequestParams = require('./lib/validateRequestParams');
stack.requireService = require('./lib/requireService');
stack.requireServiceSync = require('./lib/requireServiceSync');

stack.plugins = {
  "bodyParser": require('./lib/plugins/bodyParser'),
  "logger": require('./lib/plugins/logger'),
  "mschema": require('./lib/plugins/mschema')
};

module.exports = stack;