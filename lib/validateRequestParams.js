var mschema = require("mschema");

module['exports'] = function validateParams (service, req, res, cb) {
  req.resource = req.resource || {};
  req.resource.params = req.resource.params || {};
  return mschema.validate(req.resource.params, service.schema || {}, { strict: false });
};