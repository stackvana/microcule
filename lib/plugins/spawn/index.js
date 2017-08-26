var config = require('../../../config'); // defaults to included config, all config values can be overridden as options
var stderr = require('./stderr');
var psr = require('parse-service-request');
var crypto = require('crypto');
var path = require('path');
var spawn = require('cross-spawn');
var compile = require('../compile');
var compileService = require('../compile/compileServiceMappings');

// Remark: tree-kill is important as it's possible microservices may spawn child processes 
// ( which must be killed in order to prevent zombie process / orphaned process )
var kill = require('tree-kill');

// Mapping of JavaScript functions which transform incoming request data to CLI options to target language binary
// Remark: Some binaries like node and python do not require transformation of arguments, neat!
var generateArguments = {
  gcc: require('./generateCommandLineArguments/gcc'),
  go: require('./generateCommandLineArguments/golang'),
  bash: require('./generateCommandLineArguments/bash'),
  clisp: require('./generateCommandLineArguments/clisp'),
  dotnet: require('./generateCommandLineArguments/dotnet'),
  lua: require('./generateCommandLineArguments/lua'),
  ocaml: require('./generateCommandLineArguments/ocaml'),
  perl: require('./generateCommandLineArguments/perl'),
  r: require('./generateCommandLineArguments/r'),
  rust: require('./generateCommandLineArguments/rust'),
  scheme: require('./generateCommandLineArguments/scheme'),
  smalltalk: require('./generateCommandLineArguments/smalltalk'),
  tcl: require('./generateCommandLineArguments/tcl')
};

var transpileService = {
  "coffee": require('./transpileServiceCode/coffee-script'),
  "coffee-script": require('./transpileServiceCode/coffee-script'),
  "babel": require('./transpileServiceCode/babel')
};

// Remark: This is the local compile cache
// This is used for storing compiled / transpiled versions of services which require build / compile steps
// By default the transpileCache will exist in the process memory of `microcule` itself,
// but the caching source can be customized with a simple callback interface
var transpileCache = {};

module['exports'] = function spawnService (service) {

  // create a new service object to work with locally so we don't mutate the service argument
  // we also serialize the service object and send it into the microservice as "resource",
  // so we want to make sure it only has properties that will seralize well / should be available to microservice scope
  var _service = {};

  // if a binary path has been passed in, assume we are spawning an already compiled application
  // since the application is already compiled, we don't need to know it's language or source code

  if (service.bin) {
    _service.bin = service.bin;
  }

  if (service.argv) {
    _service.argv = service.argv;
  }

  _service.code = service.code || "";
  // _service.schema = service.schema;
  _service.language = service.lang || service.language || "javascript";

  // legacy API
  if (typeof service.source === 'string') {
    _service.code = service.source;
  }

  /*
  if (typeof _service.code === "undefined") {
    throw new Error('service.code is required!')
  }
  */

  if (typeof _service.code === "function") {
    _service.code = "module.exports = " + _service.code.toString();
  }

  // only configure compiled middleware plugin *once* ( same as how all other plugins are configured )
  // probably not a good idea to attempt to confifigure compile plugin inside of spawnServiceMiddleware() handler
  var _compile;
  if (typeof compileService[_service.language] === "function") {
    _compile = compile({
      service: _service,
      releaseDir: config.releaseDir
    });
  }

  return function spawnServiceMiddleware (input, output, next) {

    var status = {
      ended: false,
      erroring: false,
      checkingRegistry: false,
      // pipe3ended: false,
      stdoutEnded: false,
      serviceEnded: false,
      vmClosed: false,
      vmError: false
    };

    input.resource = input.resource || {
      params: {}
    };

    _service.code = input.code || _service.code;

    // next callback is optional
    next = next || function (err, result) {
      console.log('warning: using default middleware next handler'.red);
      console.log(err, result)
    };

    // output.setHeader('x-powered-by', 'Stackvana');

    // legacy API properties "themeSource" and "presenterSource"
    _service.view = service.view || service.themeSource;
    service.presenter = service.presenterSource || service.presenter;

    // if targetLanguage is a compiled / static langauge, we must first compile the source code
    //console.log( compileService)
    if (typeof compileService[_service.language] === "function") {
       console.log('found compiled service!', _service.language);
      _compile(input, output, function (err, _build) {
        // [x] service.bin
        // service.argv
        // console.log('got back build', arguments)
        if (err) {
          return output.end(err.message);
        }
        if (typeof _build === 'undefined') {
          return output.end('invalid build. contact support');
        }
        // if it attempted to build and was not successful
        // if foundCompiledCache is true, it means we didn't need to compile for this request ( already found compiled binary )
        if (_build.exitCode !== 0 && _build.foundCompiledCache !== true) {
          // this indicates an error in the build
          // instead of attempting to spawn the service, we need to pipe the error back to the client
          return output.json(_build);
        }
         console.log('attempting to spawn');
         console.dir(_build);
        _service.bin = _build.bin;
        // Remark: Java is an edge case now, as its both compiled than interpreted
        if (_service.language === 'java') {
          _service.bin = 'java';
          _service.argv = ['hook'];
          // TODO: use config value
          _service.cwd = _build.buildDir;
        }
        // Remark: R is an edge case now, as its really wants a source file to run RScript ( could not easily get bash redirects or -e argument working well )
        if (_service.language === 'r') {
          _service.bin = '/usr/local/bin/RScript';
          _service.argv = [_build.tmpSourceFile];
          //_service.cwd = '/Users/a/dev/stackvana/microcule/tmp/';
        }

        if (_service.language === 'dotnet'){
          _service.bin = 'dotnet';
          _service.buildDir = _build.buildDir + '/dotnet-hello.csproj'; //needed in commandlineArgs generator
          //_service.argv = ['run', '-p', _build.buildDir + '/dotnet-hello.csproj']; //TODO implemented dynamically getting the csproj file name
          _service.cwd = _build.bin;
        }
        _spawnService(input, output);
      });
    } else {
      _spawnService(input, output);
    }

    function _spawnService (input, output) {

       console.log('running spawn service'.blue, input.url)
      // use passed in config if its defined, if not will default to ./config folder
      if (typeof service.config === "object") {
        config = service.config;
      }

      // the logging handler can be customized to any function
      // the default logging handler is console.log,
      // but for production usage you will want to pass in a config.log that persists somewhere ( like redis )
      var log = service.log || config.log || console.log;

      input.resource = input.resource || {
        instance: {},
        params: {}
      };

      input.env = input.env || config.env || {};

      // default target spawning binary to `./binaries/javascript`,
      // this is the default node.js / javascript binary
      var targetBinary = "node";

      var targetLanguage = service.language;

      // Put some guards up for legacy "language" values still being used in production
      if (typeof targetLanguage === "undefined" || targetLanguage === "javascript" || targetLanguage === "") {
        targetLanguage = "javascript";
      }
      if (targetLanguage === "coffee") {
        targetLanguage = "coffee-script";
      }
      if (targetLanguage === "es6" || targetLanguage === "es7") {
        targetLanguage = "babel";
      }

      // before spawning service, check to see if it has a compile step,
      // if so, we must compile / check the caching options for the compiled service code
      if (typeof transpileService[targetLanguage] === "function") {
        // service.code = service.code || "";
        var md5 = checksum(_service.code);

        if (typeof transpileCache[md5] === "undefined") {
          // no cached version found, compile and add
          console.log('detected new microservice. compiling: ' + md5 + "...");
          var compiled = transpileService[targetLanguage](_service.code);
          transpileCache[md5] = compiled;
          _service.code = compiled;
          //service.code = compiled;
        } else {
          _service.code = transpileCache[md5];
          //service.code = transpileCache[md5];
          //console.log('found compiled version', md5);
        }
      }

      /*
         Possible results of spawnService

           Remark: These are to be used as a reference and are possibly not complete / correct. 
                   These cases will most likely develop these into unit tests

           vm opens -> service calls res.end -> vm closes -> response
           vm opens -> service throws error -> vm closes -> response
           vm opens -> service throws module missing -> vm closes -> npm installs -> response
           vm opens -> service throws timeout error -> vm closes -> response
           vm opens -> vm error -> vm closes -> response

        Child process spawn lifecycle

          Important: Mapping the lifecycle of spawning the child process is essential in
                     understanding which events fire in what order on various spawn conditions.
                     In many cases if we do not correctly track all STDIO and HTTP stream events,
                     we will lose the error stack from the spawned binary ( or return 500 ).
                     Error stacks from spawned services should *always* be returned to the client.
                     The client should *never* see 500 errors or stream disconnect errors.

          Child process Spawn Error lifecycle ( such as missing binary or bad options to chroot )

            vm.stdin.error
            vm.exit
            vm.stdout.end
            vm.stderr

      */

      // Remark: `status` object keep track of the various statuses that can result from spawning a service
      // It's important to understand what the vm is currently doing in order to respond correctly to the client request


      var isStreaming = false;

      if (input._readableState && input._readableState.buffer && (input._readableState.buffer.length || !input._readableState.ended)) {
        isStreaming = true;
      }

      // Remark: If we don't have this information, it probably means the microcule service is being spawned,
      // from the CLI / localhost ( with no HTTP server or HTTP middlewares )
      // This will add some default properties and values so microcule doesn't crash
      // We may want to add more data / improve this API contract later and in a separate module
      input.connection = input.connection || { remoteAddress: process.pid };
      input.headers = input.headers || {};

      var remoteAddress = input.connection.remoteAddress;
      // Note: Since we are proxying inside the hook.io network,
      // we should try to apply the forwarded remote IP address to the service env.
      // This will give users the ability to see the actual remote IP addresses accessing their services from inside the service
      if (typeof input.headers['x-forwarded-for'] !== "undefined") {
        remoteAddress = input.headers['x-forwarded-for'];
      }

      var __env = {
        params: input.resource.instance || input.resource.params, // instance is used in case of validation
        isStreaming: isStreaming,
        customTimeout: service.customTimeout || config.SERVICE_MAX_TIMEOUT, // replace with _service scope?
        env: input.env,
        resource: _service,
        input: {
          method: input.method,
          headers: input.headers,
          host: input.hostname,
          path: input.path,
          params: input.params,
          url: input.url,
          connection: {
            remoteAddress: remoteAddress
          }
        }
      };

      // TODO: input param mappings for middlewares
      // __env.input.xxxx = input['xxxx'];

      if (service.isHookio === true) {
        __env.isHookio = true;
      }

      // TODO: can we remove this line?
      if (service.language === "lua") {
        __env.resource = {};
      }

      // map users special admin access key to hook.env
      // TODO: move to config option
      // opts.env - custom environment variables / methods to inject into service handler ( defaults to {} )

      __env.hookAccessKey = input.env.hookAccessKey;

      var vm;

      var binaries = {
        "babel": "micro-node",
        "bash": "micro-bash",
        "clisp": "micro-clisp",
        "coffee-script": "micro-node",
        "coffee": "micro-node",
        "es7": "micro-node", // legacy name, renamed to "babel"
        "lua": "micro-lua",
        "javascript": "micro-node",
        "ocaml": "micro-ocaml",
        "perl": "micro-perl",
        "php": "micro-php",
        "python": "micro-python",
        "python3": "micro-python3",
        "ruby": "micro-ruby",
        "scheme": "micro-scheme",
        "smalltalk": "micro-gst",
        "tcl": "micro-tcl"
      };

      if (_service.bin) {
        // TODO: check to see if binary actually exists before attempting to spawn
        targetBinary = _service.bin;
      } else {
        targetBinary = binaries[targetLanguage];
      }

      var binaryArgs = [];

      function preprocessCommandLineArguments (cb) {
        /*
            Generate specific command line arguments per target binary
            Warning: Will contruct a very long command line arguments string !!!
                     Average system limit appears to be about 2mb ( microservices should fall well within that limit... )

            Important: To detect system limit for command line arguments in bytes run: `getconf ARG_MAX`

            TODO: return error if size exceeds system's argv size

        */
        if (_service.argv) {
          binaryArgs = _service.argv;
        } else {
          if (typeof generateArguments[targetLanguage] === "function") {
            binaryArgs = generateArguments[targetLanguage](_service, __env);
          } else {
            binaryArgs = [
              '-c', _service.code.toString(),
              '-e', JSON.stringify(__env),
              '-s', JSON.stringify(_service)
            ];
          }
        }
      }

      if (_service.bin) {
        // TODO: Should we attempt to normalize the incoming bin path here? Probably no.
      } else {
        targetBinary = __dirname + "/../../../bin/binaries/" + targetBinary;
      }
      targetBinary = path.normalize(targetBinary);
      preprocessCommandLineArguments();

      //  process.cwd(),
      console.log('spawning'.red, targetBinary, 'in', _service.cwd, 'with', binaryArgs);
      //console.log(targetBinary, binaryArgs);
      vm = spawn(targetBinary, binaryArgs, { stdio: ['pipe', 'pipe', 'pipe', 'pipe'], cwd: _service.cwd });

      /*
      // used for additional communication outside of STDIN / STDOUT / STDERR
      // pipe3 is additional HTTP req / res methods
      var pipe3 = vm.stdio[3];
      pipe3.on('error', function(err){
        if (err.code === "EPIPE") {
          // do nothing :-\
          // see: https://github.com/mhart/epipebomb/blob/master/epipebomb.js
          // see: https://github.com/nodejs/node/issues/947
          // see: https://github.com/nodejs/node/pull/9470

          /Users/janaka.abeywardhana/code-projects/microcule/tmp/dotnet/a07f72f1aadf192732b74e3814ee40d4b05fd693/dotnet-hello.csproj
          /Users/janaka.abeywardhana/code-projects/microcule/tmp/dotnet/a07f72f1aadf192732b74e3814ee40d4b05fd693/dotnet-hello.csprj
        }
        // if not specific EPIPE issue, log the error
        console.log(err.message);
      });

      // useful for pipe3, but not really being used
      pipe3.on('end', function(){
        status.pipe3ended = true;
      });

      pipe3.on('close', function(){
        status.pipe3ended = true;
      });

      pipe3.on('exit', function(){
        status.pipe3ended = true;
      });
      */

      finish();

      function finish () {

        var hookTimeout = config.SERVICE_MAX_TIMEOUT;

        if (typeof service.customTimeout === "number") {
          hookTimeout = service.customTimeout;
        }

        var inSeconds = hookTimeout / 1000;

        var serviceCompleted = false;
        var serviceCompletedTimer = setTimeout(function(){
          if (!serviceCompleted && !status.ended && !status.checkingRegistry) {
            status.ended = true;
            output.write(config.messages.serviceExecutionTimeout(inSeconds));
            //
            // Note: At this stage, we don't know if the child process is going to exit,
            // it might exit at some point but it's execeeded SERVICE_MAX_TIMEOUT at this point,
            // and we need to gracefully kill the child process
            //
            // Remark: Uses tree-kill.kill() method,
            // this is a multi-level kill command which is suppose to kill,
            // all child processes and any subprocesses spawned by their subprocess chain
            // this should ensure we don't get zombie processes
            kill(vm.pid, 'SIGKILL', function(err) {
              if (err) {
                // Remark: When exactly can an error happen here?
                console.log("SIGKILL ERROR", err.message);
              }
              // Note: kill() is also a sync command
              // do we need to do anything with this event?
            });
            // Remark: The timeout for the service has been reached,
            // end the response ( do not continue with middlewares )
            endResponse();
          }
        }, hookTimeout);

        function endResponse () {
          serviceCompletedTimer = clearTimeout(serviceCompletedTimer);
          serviceCompleted = true;

          // console.log('endResponse', status, next)

          // Note: Only certain languages are currently capable of acting as middlewares
          // For additional language support, we need an explcit event / API in each language for closing event over STDERR ( same as JS works )
          var middlewareEnabledLanguages = ['javascript', 'babel', 'coffee-script'];
          if (status.serviceEnded) {
            // If the service has ended ( meaning res.end() was called, or sent via STDERR message ),
            // then we will end the response now ( no more middlewares will process)
            output.end();
          } else {
            // Note: If we haven't explicitly been sent res.end() message,
            // assume next was called and we have more middlewares to process
            // Important: For non middleware enabled languages, we need to assume the last middleware calls res.end()
            // If not, the next middleware ( outside of spawn chain ) is responsible for ending the request
            next();
          }

        };

        if (vm.stdout) {
          vm.stdout.on('data', function (data) {
            if (!status.ended && output.finished !== true) {
              output.write(data);
            }
          });
        }

        if (vm.stdout) {
          vm.stdout.on('end', function (data) {
            status.stdoutEnded = true;
            status.pipe3ended = true;
            console.log(data);
             //console.log('vm.stdout.end', status);
            if (!status.checkingRegistry && !status.ended && !status.erroring) {
              //status.ended = true;
              // Remark: The vm's STDOUT has ended ( spawned service has completed ),
              // Note: Removed Now using exit event only
              // endResponse();
            }
            if (status.vmClosed && !status.ended) {
              // Remark: The vm's STDOUT has ended ( spawned service has completed ),
              // we may need to end the response here
              status.ended = true;
              endResponse();
            }
          });
        }

        if (vm.stdin) {

          
          // input.on('end', function(){
          //   if (!status.pipe3ended) {
          //     pipe3.write(Buffer('input.end'));
          //     pipe3.write(Buffer('\n'));
          //   }
          // });

          // input.on('close', function(){
          //   if (!status.pipe3ended) {
          //     pipe3.write(Buffer('input.close'));
          //     pipe3.write(Buffer('\n'));
          //   }
          // });

          vm.stdin.on('end', function (data) {
            input.emit('end')
          });

          vm.stdin.on('close', function (data) {
            input.emit('close')
          });
          

          vm.stdin.on('error', function (data) {
            status.stdinError = true;
            console.log('vm.stdin.error', status, data);
            // do nothing with this error?
            // without this error handler, `run-remote-service` will experience an uncaught stream error,
            // this is bad, because we lose the error stack with the uncaught stream error
          });
        }
        // map endResponse fn for possible use in stderr.onData handler
        output.endResponse = endResponse;
        if (vm.stderr) {
          // stderr is overloaded here to be used as a one-way messaging device from child process to request
          // this is used for doing such events as logging / setting http headers
          vm.stderr.on('data', function (data) {
            // console.log('vm.stderr.data', data.toString())
            stderr.onData(data, status, log, output, input);
          });
        }

        vm.on('error', function (err) {
          // console.log('vm.error' + err.message);
          status.vmError = true;
          // status.pipe3ended = true;
          if (!status.ended) {
            status.ended = true;
            output.write(err.message);
            //console.log('vm error called endResponse()');
            // Remark: The vm has errored, so we need to end the response ( do not continue with middlewares )
            endResponse();
          }
        });

        vm.on('exit', function (code, signal) {
          // console.log('vm.exit', code, signal, status);
          status.vmClosed = true;
          // status.pipe3ended = true;
          // Note: Removed. exit does not indicate stdoutEnded
          // status.stdoutEnded = true;
          if (!status.checkingRegistry && !status.ended && !status.stdoutEnded ) {
            //status.ended = true;
            if (code === 1) {
              status.erroring = true;
              status.vmError = true;
              //output.write(config.messages.childProcessSpawnError(binaryArgs));
            }
            if (code > 1) {
              status.erroring = true;
              status.vmError = true;
              //output.write('Unknown spawn error code: ' + code.toString() + " please contact support.");
            }
            if (signal !== null && typeof signal !== "undefined") {
              status.erroring = true;
              status.vmError = true;
            }
            // Remark: we could call `endResponse()` here, but the child process spawn lifecycle dictates,
            // we must wait for vm.stdout.end and vm.stderr to finish ( as to not lose data )
          }
          // if stdout has ended, we should be able to end the response if the vm exits
          if (status.stdoutEnded && !status.ended) {
            status.ended = true;
            // Remark: The vm has exited ( and it's still not ended )
            // The service has ended but the VM end event may not have fired, we should attempt to end response
            endResponse();
          }
        });

        if (vm.stdin) {
          input.pipe(vm.stdin);
        }

      }
    }

  };

};


function checksum (str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex')
}