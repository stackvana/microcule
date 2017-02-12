var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var path = require('path');
var tempDir = path.resolve(__dirname + '/../../../../../tmp');
console.log('using temp', tempDir)

module.exports = function (service, cb) {

  var hash = crypto.createHash('md5').update(service.code).digest('hex');

  // first, we need to write the file to a temporary location on the disk
  // it could be possible to bypass writing to the disk entirely here, but it will be easier to debug user-scripts,
  // and also interact with various compilers without having to look up special use cases for stdin / argv code parsing
  var outputPath = tempDir + '/' + hash + '.c';
  console.log('writing to', outputPath)
  fs.writeFile(outputPath, service.code, function (err, result) {

    if (err) {
      return cb(err);
    }
    console.log('wrote file with sucess!');
    console.log('starting compiler gcc', 'gcc', ['-o', hash, outputPath]);

    var compiler = spawn('gcc', ['-o', hash, outputPath]);

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
        bin: process.cwd() + '/' + hash,
        stderr: stderr,
        stdout: stdout,
        exitCode: data
      };
      cb(null, result);
    });

  });

};