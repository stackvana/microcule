var config = require('../../../config'); // defaults to included config, all config values can be overridden as options
var fd3 = require('./fd3');
var crypto = require('crypto');
var path = require('path');
var spawn = require('cross-spawn');
var compile = require('../compile');
var compileService = require('../compile/compileServiceMappings');
var bodyParser = require('../bodyParser');

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

  // accept incoming home up to local project root
  _service.home = service.home || path.resolve(__dirname + "/../../.."); //  /* service.home || */

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
      vmError: false,
      stderrOutput: [],
      exitCode: null
    };

    // Catch any errors on output stream
    // Remark: This shouldn't happen, but if it does we need to catch it or else process will crash
    output.on('error', function (err) {
      console.log('output error:', err)
    });

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

    var hasBodyParserInChildProcess = ['javascript', 'babel', 'es7'];

    // if input.processedInputs has been set, it means the body has already been parsed
    if (input.processedInputs === true) {
      return _afterParseCheck();
    }

    if (hasBodyParserInChildProcess.indexOf(service.language) !== -1) {
      return _afterParseCheck();
    } else {
      return bodyParser()(input, output, _afterParseCheck);
    }

    function _afterParseCheck () {

      // if targetLanguage is a compiled / static langauge, we must first compile the source code
      // console.log(_service, compileService)
      if (typeof compileService[_service.language] === "function") {
        // console.log('found compiled service!', _service);
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
          // console.log('attempting to spawn', service);
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
          _spawnService(input, output);
        });
      } else {
        _spawnService(input, output);
      }

      function _spawnService (input, output) {

        // console.log('running spawn service'.blue, input.url)
        // use passed in config if its defined, if not will default to ./config folder
        if (typeof service.config === "object") {
          config = service.config;
        }

        // the logging handler can be customized to any function
        // the default logging handler is console.log,
        // but for production usage you will want to pass in a config.log that persists somewhere ( like redis )
        var log = service.log || config.log || console.log;

        // additional guard around log function to prevent potential crashes based on malformed options
        // not required, but helpful for libraries which call microcule.spawn()
        if (typeof log !== 'function') {
          log = console.log;
        }
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
            var compiled;
            try {
              compiled = transpileService[targetLanguage](_service.code);
            } catch (err) {
              // some transpilers like cofee-script may throw on syntax error
              return output.end(err.message);
            }
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

             vm opens -> service calls res.end -> vm.exit -> endResponse
             vm opens -> service exits -> vm.exit -> endResponse
             vm opens -> service throws error -> vm.exit -> endResponse
             vm opens -> service throws timeout error -> vm closes -> endResponse
             vm opens -> vm error -> vm.exit -> endResponse

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
          "bash": "micro-bash",
          "clisp": "micro-clisp",
          "coffee-script": "micro-node",
          "coffee": "micro-node",
          "babel": "micro-node",
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
          targetBinary = _service.home + "/bin/binaries/" + targetBinary;
        }
        targetBinary = path.normalize(targetBinary);
        preprocessCommandLineArguments();

        // jail option is used to add a pre-process command to the target binary
        // in most expected cases this will be `chroot` or `nsjail` with arguments
        if (service.jail) {
          binaryArgs.unshift(targetBinary);
          var rArgs = [];
          service.jailArgs.forEach(function(a){
            rArgs.unshift(a);
          });
          rArgs.forEach(function(a){
            binaryArgs.unshift(a);
          });
          targetBinary = service.jail;
        }

        // console.log('spawning', targetBinary, 'in', _service.cwd, 'with', binaryArgs)
        try {
          vm = spawn(targetBinary, binaryArgs, { stdio: ['pipe', 'pipe', 'pipe', 'pipe'], cwd: _service.cwd });
        } catch (err) {
          console.log('vm spawn error', err)
          return output.end(err.message);
        }
        binaryArgs = [];
        // used for additional communication outside of STDIN / STDOUT / STDERR
        // pipe3 is additional HTTP req / res methods
        var pipe3 = vm.stdio[3];
        pipe3.on('error', function(err){
          if (err.code === "EPIPE") {
            // do nothing :-\
            // see: https://github.com/mhart/epipebomb/blob/master/epipebomb.js
            // see: https://github.com/nodejs/node/issues/947
            // see: https://github.com/nodejs/node/pull/9470
          }
          // if not specific EPIPE issue, log the error
          console.log('pipe3 error', err.message);
        });

        // useful for pipe3, but not really being used
        pipe3.on('end', function(){
          // console.log('pipe3 ended')
          status.pipe3ended = true;
        });

        pipe3.on('close', function(){
          // console.log('pipe3 close')
          status.pipe3ended = true;
        });

        pipe3.on('data', function (data) {
          fd3.onData(data, status, log, output, input);
        });

        pipe3.on('exit', function(){
          // console.log('pipe3 exit')
          status.pipe3ended = true;
        });

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

              // Remark: this can throw an error if the header has already been written
              // This shouldn't happen, but it is possible from testing. Perhaps add an additional guard here
              try  {
                // Remark: Returning 500 code for timeouts can cause issues with third-party services attempting retries
                // output.status(500);
              } catch (err) {
                console.log('error in output.status ' + input.url, err)
              }
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
            // console.log('endResponse()', status)
            serviceCompletedTimer = clearTimeout(serviceCompletedTimer);
            serviceCompleted = true;

            // dump stderr and perform logging events
            status.stderrOutput.forEach(function(e){
              // if the response is erroring, then send errors to stdout ( should still be open )
              if (status.erroring === true && service.redirectStderrToStdout) {
                // send the stderr data to the fd3 handler as an error
                // this will tell microcule to send the error message back to the client
                var message = { "type": "error", "payload": { "error": e.toString() }};
                fd3.handleMessage(message, status, log, output, input);
              } else {
                output.status(500);
              }
            })

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
              if (status.vmError === true) {
                // in the case of VM error, end the request here ( do not attempt to continue with middlewares )
                // most likely we are in an error state due to missing binaries
                output.end();
              } else {
                next();
              }
            }

          };

          if (vm.stdout) {
            vm.stdout.on('data', function (data) {
              // console.log('vm.stdout.data', data.toString());
              if (!status.ended && output.finished !== true) {
                output.write(data);
              }
            });
          }

          if (vm.stdout) {
            vm.stdout.on('end', function (data) {
              // console.log('vm.stdout.end', status);
              status.stdoutEnded = true;
            });
          }

          if (vm.stdin) {

            /*
            input.on('end', function(){
              if (!status.pipe3ended) {
                pipe3.write(Buffer('input.end'));
                pipe3.write(Buffer('\n'));
              }
            });

            input.on('close', function(){
              if (!status.pipe3ended) {
                pipe3.write(Buffer('input.close'));
                pipe3.write(Buffer('\n'));
              }
            });

            vm.stdin.on('end', function (data) {
              input.emit('end')
            });

            vm.stdin.on('close', function (data) {
              input.emit('close')
            });
            */

            vm.stdin.on('error', function (data) {
              status.stdinError = true;
              // console.log('vm.stdin.error', status, data);
              // do nothing with this error?
              // without this error handler, `run-remote-service` will experience an uncaught stream error,
              // this is bad, because we lose the error stack with the uncaught stream error
            });
          }
          // map endResponse fn for possible use in fd3.onData handler
          output.endResponse = endResponse;
          if (vm.stderr) {
            vm.stderr.on('data', function (data) {
              // console.log('vm.stderr.data', status, data.toString());

              // vm.stderr data can get sent to two locations:
              // first, send the stderr data to log handler ( stderr goes to logs by default )
              // this will happen before the response has completed
              log(data.toString())
              // second, Buffer stderr data into memory so it can be later sent when process exits,
              // errors are buffered because we don't know if stderr needs to be sent to client or both client and logs.
              // The convention is to show stderr to the client only if the process exits unsucessfully ( above 0 code )
              // TODO: Make this buffer array so that is has a maximum size ( in-case of huge amount of stderr data )
              status.stderrOutput.push(data);
            });
          }

          vm.on('error', function (err) {
            // console.log('vm.error' + err.message, status);
            status.vmError = true;
            // status.pipe3ended = true;
            if (!status.ended) {
              status.ended = true;
              output.write(err.message);
              log(err.message);
              //console.log('vm error called endResponse()');
              // Remark: The vm has errored, so we need to end the response ( do not continue with middlewares )
              endResponse();
            }
          });

          vm.on('exit', function (code, signal) {
            // console.log('vm.exit', code, signal, status);
            status.vmClosed = true;
            status.exitCode = code;
            // status.pipe3ended = true;
            // Note: Removed. exit does not indicate stdoutEnded
            // status.stdoutEnded = true;
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
            // if stdout has ended, we should be able to end the response if the vm exits
            status.ended = true;
            // Remark: The vm has exited ( and it's still not ended )
            // The service has ended but the VM end event may not have fired, we should attempt to end response
            endResponse();
          });

          if (vm.stdin) {
            input.pipe(vm.stdin);
          }

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
