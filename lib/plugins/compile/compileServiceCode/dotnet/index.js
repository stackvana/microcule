var fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var path = require('path');
var ncp = require('ncp').ncp;
var shasum = require('shasum');
var path = require('path');

module.exports = function (req, res, cb) {

  var service = req.service;

  // TODO: override hash logic here to include the csproj contents.
  // by default handled in compile/index.js and only used the code file
  var hash = service.sha1;

  //var sha = shasum(_service.code);
  //_service.sha1 = sha;
  //console.log('what is sha1', sha);


  /*
  Target: .NET Core 1.1
  
  Uasge:
  - Standard .NET Core console app created via `dotnet new console -n <app name>`
  - To execute microcule ./<path to .NET Core app>/Program.cs
  
  TODO:
  - copy all files to the temp build location under folder that's the hash of the Program.cs + *.csproj content.
  -- check if a folder by the has exists to decide if a rebuild is required.
  - dotnet restore in the build folder
  - dotnet build -f 1.1 -c release -o <output dir> -v minimal
  
  - dotnet run , and probably pass arguments in
  -- Not sure where this goes.
  -- might need to create a spawn/generateCommandLineArguments module 
  
  
  */
  //console.log('buildDir: ' + service.buildDir);
  //console.log('releaseDir: ' + service.releaseDir);
  //console.log('code: ' + service.releaseDir);



  // release is explicityly defaulted to the root of the microcule binary. Not sure why given there is a release folder.
  // This may will break if the releaseDir default is overriden in config
  //service.releaseDir = service.releaseDir + '/release';


  // first, we need to write the file to a temporary location on the disk
  // it could be possible to bypass writing to the disk entirely here, but it will be easier to debug user-scripts,
  // and also interact with various compilers without having to look up special use cases for stdin / argv code parsing


  console.dir(service, { depth: null, colors: true });

  var tmpBuildDir = service.buildDir + '/dotnet/' + hash;
  var buildOutputDir = service.releaseDir + '/dotnet/' + hash;
  service.sourceCodeFilePath = '/Users/janaka.abeywardhana/code-projects/microcule/examples/services/hello-world/dotnet-hello/Program.cs';
  console.log('codefilepath = ', service.sourceCodeFilePath);

  var sourceCodeDir = path.dirname(service.sourceCodeFilePath);


  //console.log('');


  //If a dir with the hash exists then it's not new code, let's (re)build.
  if (!fs.existsSync(buildOutputDir)) {
    fs.mkdirSync(buildOutputDir);
    if (!fs.existsSync(tmpBuildDir)) {
      fs.mkdirSync(tmpBuildDir);
    }

    console.log('Copy from ', sourceCodeDir)
    console.log('Copying code to', tmpBuildDir);

    ncp.limit = 5; // concurrent copies

    ncp(sourceCodeDir, tmpBuildDir, function (err) {

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
        console.log('error', data)
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
          console.log('exit', data)
          var result = {
            tmpSourceFile: tmpBuildDir,
            bin: buildOutputDir,
            stderr: stderr,
            stdout: stdout,
            exitCode: data
          };
          cb(null, result);
        });

      });
    });

  }

};