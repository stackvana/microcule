var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports = function (req, res, cb) {

  var service = req.service;

  var hash = service.sha1;

  // first, we need to write the file to a temporary location on the disk
  // it could be possible to bypass writing to the disk entirely here, but it will be easier to debug user-scripts,
  // and also interact with various compilers without having to look up special use cases for stdin / argv code parsing
  var outputPath = service.buildDir + '/' + hash + '/' + 'hook' + '.java';
  // service.releaseDir = service.releaseDir + '/' + hash;
  console.log('writing to', outputPath)

  // Java requires that the .class file be the same name as the exported code class
  // This means, we have to create a unique directory for the binary ( unlike other compiled langs which use only uninque file names )
  var outputDir =  service.buildDir + '/' + hash;
  mkdirp(outputDir, function(err){
    if (err) {
      return res.end(err.message);
    }
    fs.writeFile(outputPath, service.code, function (err, result) {

      if (err) {
        return cb(err);
      }
      console.log('wrote file with sucess!');
      console.log('starting compiler javac', 'javac', [outputPath]);

      var compiler = spawn('javac', [outputPath], {
        cwd: service.releaseDir // ensure binary compiles to target directory
      });

      var stderr = '', stdout = '';

      compiler.on('error', function(data){
        console.log('error', data)
        cb(data)
      });

      /*
      vm.stdin.error
      vm.exit
      vm.stdout.end
      vm.stderr
      */

      compiler.on('data', function(data){
        console.log('got data', data)
      });

      compiler.on('close', function(data){
        console.log('close', data)
        //cb(null, 'close')
      });

      compiler.stdin.on('error', function(data){
        console.log('stdin.error', data);
        // cb(null, 'close')
      });

      compiler.stdout.on('data', function(data){
        console.log('stdout', data);
        stdout += data.toString();
        //cb(null, 'close')
      });

      compiler.stderr.on('data', function(data){
        // console.log('stderr', data);
        stderr += data.toString();
        //cb(null, 'close')
      });

      compiler.on('exit', function(data){
        console.log('exit', data)
        var result = {
          tmpSourceFile: outputPath,
          buildDir: service.buildDir + '/' + hash,
          sha1: hash,
          bin: service.buildDir + '/' + hash + '/' + 'hook', // java is strange
          stderr: stderr,
          stdout: stdout,
          exitCode: data
        };
        cb(null, result);
      });

    });
  });

};