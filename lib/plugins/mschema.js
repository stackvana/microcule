var mschema = require("mschema");

module.exports = function validateParamsMiddleware (schema) {
  return function validateParamsHandler (input, output, next) {
    input.resource = input.resource || {};
    input.resource.schema = schema || input.resource.schema  || {};
    input.resource.params = input.resource.params || {};
    //console.log('mschema validate', input.resource.params,  input.resource.schema);
    var validate = mschema.validate(input.resource.params, input.resource.schema, { strict: false });
    //console.log(validate.instance)
    if (validate.valid) {
      input.resource.instance = validate.instance;
      next();
    } else {
      next(new Error(JSON.stringify(validate.errors, true, 2)));
    }
  }
}