var path = require('path');
var shasum = require('shasum');
var compileService = require('./compileServiceMappings');
var fs = require('fs');
require('colors');
module.exports = function compile (config) {
  // TODO: update API to use config...
  var Store = require('../Store');

  config = config || {};

  config.buildDir = path.resolve(__dirname + '/../../../tmp');

  // if no releaseDir is specified, will default to ./microcule/release directory
  config.releaseDir = config.releaseDir || path.resolve(__dirname + '/../../../release');


  config.errorHandler = config.errorHandler || function (err, next) {
    if (err.message === "Bad credentials") {
      return next(new Error('Invalid Github oauth key: ' + config.token));
    }
    if (err.message === "Not Found") {
      return next(new Error('Could not load: ' + config.gistID));
    }
    return next(err);
  }

  // provider should be an instance of a node-redis client
  var provider = config.provider || new Store('memory', 'Compiled Language Plugin');

  var _service = {};

  _service.code = config.service.code;
  // _service.schema = service.schema;
  _service.language = config.service.lang || config.service.language;

  _service.buildDir = config.buildDir;
  _service.releaseDir = config.releaseDir;

  // TODO: add provider pattern for state cache ( look into babel / coffee )

  if (typeof _service.code === "undefined" || typeof _service.language === "undefined") {
    throw new Error('invalid service object');
  }

  var targetCompiler = compileService[_service.language];
  if (typeof targetCompiler === "undefined") {
    throw new Error('invalid language choice: ' + _service.language);
  }

  
  var sha = '';
  if (_service.language === 'dotnet') {
    // we want to checksum the code file and the project file to detect changes.
    _service.originalCodeFilePath = config.service.originalCodeFilePath;
    _service.originalSourceCodeDir = path.dirname(_service.originalCodeFilePath);
    
    fs.readdirSync(_service.originalSourceCodeDir).forEach(function(fileName){
      //console.log(fileName);
      var ext = path.extname(fileName);
      //console.log(ext);
      if (ext === '.csproj'){
        _service.dotnetCsproj = fileName;
      }
    });
    if (!_service.dotnetCsproj) {
      // TODO: throw an error here
      console.log('error: *.csproj file not found in dir ', _service.originalSourceCodeDir);
    }

    var csprojFilePath = _service.originalSourceCodeDir + "/" + _service.dotnetCsproj;
    //console.log(csprojFilePath);
    var csprojCode = fs.readFileSync(path.resolve(csprojFilePath).toString());
    sha = shasum(_service.code + csprojCode);
  } 
  else {
    // Default: create shasum1 of service source code contents
    shasum(_service.code);
  }
  
  _service.sha1 = sha;
  console.log('sha1: ', sha);
  //console.log('##### shaum() #####');
  //console.dir(config);
  

  return function compileMiddleware (req, res, next) {
    req.service = _service;
  
    var binLocation = _service.releaseDir + '/' + sha;
    var tmpBuidDir = _service.buildDir + '/' + sha;

    // ### Langugae specific compile meta data overrides ###

    // java requires a fixed class name, so we must create a unique directory instead
    if (_service.language === 'java') {
      binLocation = _service.buildDir + '/' + sha + '/' + 'hook.class';
    }

    
    if (_service.language === 'dotnet') {
      binLocation = _service.releaseDir + '/dotnet/' + sha;
      tmpBuildDir =  _service.buildDir + '/dotnet/' + sha;
    }

    // ### check if binary of same sha1 already exists ( has been previously compiled ) ###
    // if compiled service already exists, simply continue with spawn and defined binary path


    // TODO: check that sha matches as well as language? potential issue here with same content files, but diffirent target languages
    // we will assume that if the binary file exists, it has completed it's build step and is ready to be run
    fs.stat(binLocation, function (err, _stat) {
      console.log('back from stat! Result: ', err, _stat);
      if (err) {
        // could not find the file, attempt to compile it
        console.log('could not find file, so lets compile it'.red);

        // Remark: Implementes a mutually exclusive lock for compilation step ( do not attempt to compile twice )
        // If service is compiling, simply return a 202 Accepted status until it's ready
        // mutually exclusive lock state is stored in Provider ( could be in-memory or in Redis )

        // check to see if provider indicates that service is building
        provider.get('/builds/' + sha, function(err, result){
          console.log('back from provider get'.green, err, result)
          if (err) {
            return res.end(err.message);
          }

          if (result === 0) {
            // TODO: null result means no build status, create a new build status
            provider.set('/builds/' + sha, { status: 'building' }, function (err, result){
              console.log('back from provider set', err, result)
              if (err) {
                return res.end(err.message);
              }
              // introduce delay for dev of mutex
              // setTimeout(function(){
                targetCompiler(req, res, function(err, result) {
                  if (err) {
                    res.end(err.message);
                  }
                  next(null, result);
                });
              // }, 10000);
            });
          } else {
            // if we couldn't find the compiled binary, and any entry exists for it in the DB, its probably building
            // this way, we can easily just delete the binary on the file-system to trigger a safe rebuild
            res.writeHead(202);
            res.end('currently building. please try again shortly');
          }
        });
      } else {
        // we find the file, attempt to execute it
        // if the stat returned ( a file ) then use that path instead of compiling a new one
        console.log('using compiled version of code in ', binLocation);
  

        var result = {
          bin: binLocation,
          buildDir: tmpBuildDir,
          tmpSourceFile: tmpBuildDir,
          sha1: sha,
          compiledFresh: false,
          foundCompiledCache: true,
          stderr: '',
          stdout: ''
        };
        next(null, result);
      }

    });
 };
};