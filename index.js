var stack = {};
stack.spawn = require('./lib/spawn');
stack.chainServices = require('./lib/chainServices');
stack.viewPresenter = require('./lib/viewPresenter');
stack.validateRequestParams = require('./lib/validateRequestParams');
stack.requireService = require('./lib/requireService');
stack.requireServiceSync = require('./lib/requireServiceSync');
module.exports = stack;