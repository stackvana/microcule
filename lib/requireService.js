var fs = require('fs');

module['exports'] = function requireService (opts, cb) {

   var service = {};

   opts.language = opts.language || "javascript";
   opts.path = opts.path;

   if (typeof opts.path === "undefined") {
     cb(new Error('`path` is a required argument.'));
   }

   if (opts.language === "javascript") {
     var err;
      try {
        var _script = require.resolve(opts.path);
        delete require.cache[_script];
        service = require(_script);
        service.code = service.toString();
      } catch (e) {
        err = e;
      }
      if (typeof err === "undefined") {
        if (typeof service !== "function") {
          // its possible the node.js require worked, but no function was exported
          // no function means no service can run...
          return cb(new Error('No function exported in ' + opts.path + '\nYou must export one function in the defined microservice.'));
        } else {
          return cb(null, service);
        }
      } else {
        return cb(err);
      }
   } else {
      return fs.readFile(opts.path, function (_err, _source) {
         if (_err) {
           return cb(_err);
         }
         //service.code = _source.toString();
         return cb(null, _source.toString());
       });
   }

};