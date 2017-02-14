var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var path = require('path');

module.exports = function (req, res, cb) {

  var service = req.service;
  var params = req.resource.params;

  var hash = service.sha1;

  var outputPath = service.buildDir + '/' + hash + '.r';
  // console.log('writing to', outputPath)
  var RInject = "hook <- list()\n";

  for (var p in params) {
    if (typeof params[p] === "object") {
      for (var s in params[p]) {
        RInject += 'hook[[ "' + p + '" ]] <-  "' + params[p][s] + '"\n';
      }
    } else {
      RInject += 'hook[[ "' + p + '" ]] <-  "' + params[p] + '"\n';
    }
  }

  // inject hook service code into "compiled" R script
  service.code = RInject + '\n\n' + service.code;
  fs.writeFile(outputPath, service.code, function (err, result) {
    if (err) {
      return cb(err);
    }
    var result = {
      tmpSourceFile: outputPath,
      bin: service.releaseDir + '/' + hash,
      stderr: "",
      stdout: "",
      exitCode: 0
    };
    cb(null, result);
  });

};