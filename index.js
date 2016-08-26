var stack = {};
stack.spawn = require('./lib/spawn');
stack.chainServices = require('./lib/chainServices');
stack.viewPresenter = require('./lib/viewPresenter');
stack.validateRequestParams = require('./lib/validateRequestParams');
module.exports = stack;