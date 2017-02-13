var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var path = require('path');
var tempDir = path.resolve(__dirname + '/../../../../../tmp');
console.log('using temp', tempDir)

module.exports = function (service, cb) {

  var hash = crypto.createHash('md5').update(service.code).digest('hex');

  var outputPath = tempDir + '/' + hash + '.r';
  console.log('writing to', outputPath)
  fs.writeFile(outputPath, service.code, function (err, result) {

    if (err) {
      return cb(err);
    }
    
    var result = {
      tmpSourceFile: outputPath,
      bin: process.cwd() + '/tmp/' + hash,
      stderr: "",
      stdout: "",
      exitCode: 0
    };
    cb(null, result);
  });

};