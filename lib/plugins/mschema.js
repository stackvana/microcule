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
      // if schema did not validate, end the response immediately
      // send the error as JSON back to the client
      return output.json(validate.errors)
    }
  }
}