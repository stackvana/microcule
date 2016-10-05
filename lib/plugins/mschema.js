var mschema = require("mschema");

module.exports = function validateParamsMiddleware (schema) {

  return function validateParamsHandler (input, output, next) {
    console.log('mschema validate');
    // function validateParams (service, input, res, cb) {
    input.resource = input.resource || {};
    input.resource.schema = schema || input.resource.schema  || {};
    input.resource.params = input.resource.params || {};
    var validate = mschema.validate(input.resource.params, input.resource.schema, { strict: false });
    if (validate.valid) {
      input.resource.instance = validate.instance;
      next();
    } else {
      next(new Error(JSON.stringify(validate.errors, true, 2)));
    }
  }

}