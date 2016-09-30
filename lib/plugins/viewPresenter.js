// TODO: finish, this module is not complete / working yet
// issues with patching response object for modified streaming responses in express
// see: http://stackoverflow.com/questions/9896628/connect-or-express-middleware-to-modify-the-response-body

var View = require('view').View;
var through = require('through2');
var streamBuffers = require('stream-buffers');
var Mustache = require("mustache");

module.exports = function viewPresenterMiddleware (config) {

  var _presenter;
  if (typeof config.presenter === "string" && config.presenter.length > 0) {
    var Module = module.constructor;
    _presenter = new Module();
    _presenter.paths = module.paths;
    var error = null;
    try {
      _presenter._compile(config.presenter, 'presenter-' + config.name);
    } catch (err) {
      error = err;
    }
    if (error !== null) {
      return next(new Error('Could not compile presenter into module: ' + error.message));
    }
    _presenter = _presenter.exports;
  }

  if (typeof config.presenter === "function") {
    _presenter = config.presenter;
  }

  return function viewPresenterHandler (req, res, next) {

    console.log('calling View-Presenter'.yellow, _presenter);

    var _view = new View({ template: config.view, presenter: _presenter });

    var hookOutput = new streamBuffers.WritableStreamBuffer({
        initialSize: (100 * 1024),        // start as 100 kilobytes.
        incrementAmount: (10 * 1024)    // grow by 10 kilobytes each time buffer overflows.
    });

    var write = res.write, 
        end = res.end;

    res.write = function (chunk) {
      console.log('custom write', chunk.toString())
      output.write(chunk);
      //write.apply(this, arguments);
    };

    res.end = function () {
      console.log('custom end')
      output.end();
    };

    // create a new buffer and output stream for capturing the hook.res.write and hook.res.end calls from inside the hook
    // this is used as an intermediary to pipe hook output to other streams ( such as another hook )
    var hookOutput = new streamBuffers.WritableStreamBuffer({
        initialSize: (100 * 1024),        // start as 100 kilobytes.
        incrementAmount: (10 * 1024)    // grow by 10 kilobytes each time buffer overflows.
    });

    var debugOutput = [];

    var _headers = {
      code: null,
      headers: {}
    };

    /*
    var _presenter = service.presenter || service.presenterSource || function (opts, cb) {
      // default presenter will load view into cheerio server-side dom
      // this is useful for escape / validation, it also makes the designer simplier
      var $ = this.$;
      cb(null, $.html());
    };
    */

    var output = through(function (chunk, enc, callback) {
      hookOutput.write(chunk);
      callback();
    }, function () {

      var content = hookOutput.getContents();
      // Apply basic mustache replacements
      // renamed themeSource -> viewSource
      var strTheme = config.view;
      console.log('ending stream', content.toString())
      strTheme = Mustache.render(strTheme, {
        /*
        config: {
          baseUrl: config.app.url // TODO: replace with config options
        },
        */
        hook: {
          output: content.toString(),
          debug: JSON.stringify(debugOutput, true, 2),
          params: req.resource.instance,
          headers: _headers,
          schema: config.schema
        }
      });

      var _view = new View({ template: strTheme, presenter: _presenter });

      if (typeof _view.present !== "function") {
        return res.end('Unable to load View-Presenter for hook service. We made a mistake. Please contact support.');
      }
      // give the presenter 3 seconds to render, or else it has failed
      var completedTimer = setTimeout(function(){
        if (!completed) {
          return next(new Error('Hook presenter took more than 3 seconds to load. Aborting request. \n\nA delay of this long usually indicates the presenter never fired it\'s callback. Check the presenter code for error. \n\nIf this is not the case and you require more than 3 seconds to present your view, please contact hookmaster@hook.io'));
        }
      }, 3000);
      var completed = false;
      // replay headers?
      // res.writeHead(_headers.code, _headers.headers);
      try { // this will catch user run-time errors in the presenter
        _view.present({
          request: req,
          response: res,
          service: service,
          req: req,
          res: res,
          output: content.toString(),
          debug: debugOutput,
          instance: req.resource.instance,
          params: req.resource.params,
          headers: _headers
        }, function(err, rendered){
          completed = true;
          completedTimer = clearTimeout(completed);
          try {
            console.log('ending view', rendered)
            res.end(rendered);
          } catch(err) {
            res.end('Failed to call res.end ' + err.message);
          }
        });
      } catch (err) {
        completed = true;
        completedTimer = clearTimeout(completed);
        // Remark: cb(err) doesn't seem to be working here?
        //         ending response directly seem to work
        //
        // return cb(new Error('Error in Presenter code: ' + err.message));
        res.end('Error in Presenter code: ' + err.message + '\n\n' + err.stack);
      }

    });

    output.on('end', function () {
      console.log('output ended');
      end();
    });

    output.on('error', function (err) {
      // Does this ever actually fire?
      console.log('OUTPUT ERROR', err.message);
      // TODO: add erroring boolean with timer?
      return res.end(err.message);
    });
    // TODO: implement all http.Response methods
    // TODO: do something with these writeHead events in the view
    output.writeHead = function (code, headers) {
      _headers.code = code;
      for(var h in headers) {
        _headers.headers[h] = headers[h];
      }
    };

    output._headers = _headers;
    next();
  };
  
}


