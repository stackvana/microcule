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
     // is directory
     return loadService(opts.path);
   } else {
     // TODO: add ability to load files again
     //console.log('load file as string');
     //return loadFile(opts.path);
     // TODO: detect language
   }

   function loadFile (p) {
     return loadService(p);
   }

   function loadDir (cb) {
     // TODO: add support for package.json?
     return fs.readFileSync(opts.path + "/package.json").toString();
   }

};

function loadService (p) {

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

  try {
    pkg = JSON.parse(fs.readFileSync(path.resolve(p) + "/package.json").toString());
  } catch (err) {
    // pkg not available, dont use
    throw err;
  }
  //console.log(pkg)

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

  var ext = path.extname(_service.service);
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
  service.language = extentions[ext];

  // source is legacy parameter, now replaced with code
  service.source = fs.readFileSync(path.resolve(p) + "/" + _service.service).toString();
  service.code = fs.readFileSync(path.resolve(p) + "/" + _service.service).toString();

  try {
    // service.presenter = fs.readFileSync(path.resolve(p) + "/" + _service.presenter).toString();
    service.presenter = require(path.resolve(p) + "/" + _service.presenter);
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
    console.log(err);
  }
  console.log(service)
  return service;
 }