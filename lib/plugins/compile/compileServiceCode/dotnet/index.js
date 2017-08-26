var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var path = require('path');
var mkdirp = require('mkdirp');
var npc = require('ncp').ncp;

module.exports = function (req, res, cb) {

  var service = req.service;

  var hash = service.sha1;





/*
Target: .NET Core 1.1

Uasge:
- Standard .NET Core console app created via `dotnet new console -n <app name>`
- To execute microcule ./<path to .NET Core app>/Program.cs

TODO:
- copy all files to tmp (sha as folder name)
- Copy the folder contents to a folder using the a hash of the service ?
- dotnet restore in the folder
- dotnet build -f 1.1 -c release -o <output dir> -v minimal
- dotnet run , and probably pass arguments in

*/
  // first, we need to write the file to a temporary location on the disk
  // it could be possible to bypass writing to the disk entirely here, but it will be easier to debug user-scripts,
  // and also interact with various compilers without having to look up special use cases for stdin / argv code parsing
  var outputPath = service.buildDir + '/' + hash;
  console.log('Copy code to', outputPath)
  fs.writeFile(outputPath, service.code, function (err, result) {

    if (err) {
      return cb(err);
    }
    console.log('wrote file with sucess!');
    console.log('starting compiler dotnet', 'dotnet', [outputPath]);

    var compiler = spawn('dotnet build', [outputPath], {
      cwd: service.releaseDir // ensure binary compiles to target directory
    });

    var stderr = '', stdout = '';

    compiler.on('error', function(data){
      console.log('error', data)
      cb(data);
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
        bin: service.releaseDir + '/' + hash,
        stderr: stderr,
        stdout: stdout,
        exitCode: data
      };
      cb(null, result);
    });

  });

};