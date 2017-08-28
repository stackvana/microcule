var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var path = require('path');
var ncp = require('ncp').ncp;
var shasum = require('shasum');
var path = require('path');

module.exports = function (req, res, cb) {
console.log('compileServiceCode.dotnet(). just executed'.yellow);
  var service = req.service;

  // TODO: override hash logic here to include the csproj contents.
  // by default handled in compile/index.js and only used the code file
  var hash = service.sha1;

  console.log('inside compileServiceCode.dotnet()'.yellow)
  console.dir(service);
  /*
  Supported Target: .NET Core 1.1
                    .NET Core 2.0 (untested)
  Uasge:
  - Standard .NET Core console app created via `dotnet new console -n <app name>`
  - To execute run `microcule ./<path to .NET Core app>/Program.cs`
  */

  //console.log('buildDir: ' + service.buildDir);
  //console.log('releaseDir: ' + service.releaseDir);
  

  // release is explicityly defaulted to the root of the microcule binary. Not sure why given there is a release folder.
  // This may will break if the releaseDir default is overriden in config
  //service.releaseDir = service.releaseDir + '/release';


  // first, we need to write the file to a temporary location on the disk
  // it could be possible to bypass writing to the disk entirely here, but it will be easier to debug user-scripts,
  // and also interact with various compilers without having to look up special use cases for stdin / argv code parsing


  //console.dir(service, { depth: null, colors: true });

  var tmpBuildDir = service.buildDir + '/dotnet/' + hash;
  var buildOutputDir = service.releaseDir + '/dotnet/' + hash;
  //service.sourceCodeFilePath = '/Users/janaka.abeywardhana/code-projects/microcule/examples/services/hello-world/dotnet-hello/Program.cs';
  //console.log('codefilepath = '.yellow, service.originalCodeFilePath);



  // Create the folders we need. Because put code in a folders based on the hash we need to create folders it code changes.
  // Logic for deciding if we needed re-build is in the shared complile logic.
  if (!fs.existsSync(buildOutputDir)) {
    fs.mkdirSync(buildOutputDir);
    if (!fs.existsSync(tmpBuildDir)) {
      fs.mkdirSync(tmpBuildDir);
    }
  }


    console.log('Copy from ', service.originalSourceCodeDir, ' to ', tmpBuildDir);
    

    ncp.limit = 5; // concurrent copies

    ncp(service.originalSourceCodeDir, tmpBuildDir, function (err) {

      if (err) {
        return cb(err);
      }
      console.log('Successfully copied code to temp build dir');
      console.log('starting dependency restore', 'dotnet restore');

      var restore = spawn('dotnet', ['restore'], {
        cwd: tmpBuildDir // ensure binary compiles to target directory
      });

      var stderr = '', stdout = '';

      restore.on('error', function (data) {
        console.log('error', data);
        cb(data);
      });


      restore.on('exit', function (data) {
        console.log('exit', data);

        console.log('starting compiler dotnet', 'dotnet build -c release -v minimal -o ', buildOutputDir);

        // command syntax:  dotnet build -f 1.1 -c release -o <output dir> -v minimal
        var compiler = spawn('dotnet', ['build', '-c', 'release', '-v','minimal', '-o', buildOutputDir], {
          cwd: tmpBuildDir // ensure binary compiles to target directory
        });

        var stderr = '', stdout = '';

        compiler.on('error', function (data) {
          console.log('error', data)
          cb(data);
        });

        /*
        vm.stdin.error
        vm.exit
        vm.stdout.end
        vm.stderr
        */

        compiler.on('data', function (data) {
          console.log('got data', data)
        });

        compiler.on('close', function (data) {
          console.log('close', data)
          //cb(null, 'close')
        });

        compiler.stdin.on('error', function (data) {
          console.log('stdin.error', data);
          // cb(null, 'close')
        });

        compiler.stdout.on('data', function (data) {
          console.log('stdout', data);
          stdout += data.toString();
          //cb(null, 'close')
        });

        compiler.stderr.on('data', function (data) {
          // console.log('stderr', data);
          stderr += data.toString();
          //cb(null, 'close')
        });

        compiler.on('exit', function (data) {
          console.log('exit', data);
          var result = {
            tmpSourceFile: tmpBuildDir,
            bin: buildOutputDir,
            buildDir: tmpBuildDir,
            originalCodeFilePath: service.originalCodeFilePath,
            dotnetCsproj: service.dotnetCsproj,
            stderr: stderr,
            stdout: stdout,
            exitCode: data
          };
          cb(null, result);
        });

      });
    });

  

};