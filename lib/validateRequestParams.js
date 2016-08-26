var mschema = require("mschema");

module['exports'] = function validateParams (service, req, res, cb) {
  return  mschema.validate(req.resource.params, service.schema || {}, { strict: false });
};