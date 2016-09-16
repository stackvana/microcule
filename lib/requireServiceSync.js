var fs = require('fs'),
    path = require('path');

function extToLang (ext) {
  var lang;
  
  return lang;
}

// same as requireService, only with sync interface ( useful for requiring services as packages )
module['exports'] = function requireServiceSync (opts) {

   var service = {};
   // console.log(opts.path)

   if(typeof opts.language === "undefined") {
     var ext = path.extname(opts.path);
     var extentions = {
       ".js": "javascript",
       ".coffee": "coffee-script",
       ".lua": "lua",
       ".php": "php",
       ".pl": "perl",
       ".py": "python", // Remark: You can also use the "--language python" option
       ".py3": "python3", // Remark: You can also use the "--language python3" option
       ".sh": "bash",
       ".rb": "ruby",
       ".tcl": "tcl",
       ".ss": "scheme",
       ".st": "smalltalk"
     };
     opts.language = extentions[ext];
   }

   opts.path = opts.path;

   if (typeof opts.path === "undefined") {
     cb(new Error('`path` is a required argument.'));
   }

   if (typeof opts.language === "undefined") {
     // cb(new Error('`language` is a required argument.'));
   }

   // take stat of path to determine if its file / folder / missing
   var stat;

   try {
     stat = fs.statSync(opts.path);
   } catch (err) {
     throw err;
   }

   if (stat.isDirectory()) {
     return loadService(opts.path, 'dir');
   } else {
     return loadService(opts.path, 'file');
   }

};

function loadService (p, type) {

  var service = {
    name: p,
    owner: "examples"
  };

  var _service = {
    service: "index.js",
    view: "view.html",
    presenter: "presenter.js",
    schema: "schema.js"
  };

  var pkg;

  if (type === "file") {
  } else {
    try {
      pkg = JSON.parse(fs.readFileSync(path.resolve(p) + "/package.json").toString());
      service.pkg = pkg;
    } catch (err) {
      // pkg not available, dont use
      throw err;
    }
  }

  if (typeof pkg === "object") {
    if (pkg.name) {
      service.name = pkg.name;
    }
    if (pkg.author) {
      service.owner = pkg.author;
    }
    if (pkg.main) {
      _service.service = pkg.main;
    }
    if (pkg.view) {
      _service.view = pkg.view;
    }
    if (pkg.presenter) {
      _service.presenter = pkg.presenter;
    }
  }

  var extentions = {
    ".js": "javascript",
    ".coffee": "coffee-script",
    ".lua": "lua",
    ".php": "php",
    ".pl": "perl",
    ".py": "python", // Remark: You can also use the "--language python" option
    ".py3": "python3", // Remark: You can also use the "--language python3" option
    ".sh": "bash",
    ".rb": "ruby",
    ".tcl": "tcl",
    ".ss": "scheme",
    ".st": "smalltalk"
  };
  var ext;

  // source is legacy parameter, now replaced with code
  if (type === "file") {
    ext = path.extname(path.resolve(p));
    service.language = extentions[ext];
    service.source = fs.readFileSync(path.resolve(p)).toString();
    service.code = fs.readFileSync(path.resolve(p)).toString();
  } else {
    ext = path.extname(_service.service);
    service.language = extentions[ext];
    service.source = fs.readFileSync(path.resolve(p) + "/" + _service.service).toString();
    service.code = fs.readFileSync(path.resolve(p) + "/" + _service.service).toString();
  }

  try {
    service.presenter = fs.readFileSync(path.resolve(p) + "/" + _service.presenter).toString();
    //service.presenter = require(path.resolve(p) + "/" + _service.presenter);
  } catch (err) {
    // console.log(err);
  }

  try {
    service.view = fs.readFileSync(path.resolve(p) + "/" + _service.view).toString();
  } catch (err) {
    // console.log(err);
  }

  try {
    // service.schema = fs.readFileSync(path.resolve(p) + "/" + _service.schema).toString();
    service.schema = require(path.resolve(p) + "/" + _service.schema);
  } catch (err) {
    // console.log(err);
  }

  return service;
 }