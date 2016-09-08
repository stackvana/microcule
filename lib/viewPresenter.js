var View = require('view').View;
var through = require('through2');
var streamBuffers = require('stream-buffers');
var Mustache = require("mustache");

module.exports = function viewPresenter (service, req, res, cb) {

  // console.log('calling View-Presenter'.yellow, service)

  // create a new buffer and output stream for capturing the hook.res.write and hook.res.end calls from inside the hook
  // this is used as an intermediary to pipe hook output to other streams ( such as another hook )
  var hookOutput = new streamBuffers.WritableStreamBuffer({
      initialSize: (100 * 1024),        // start as 100 kilobytes.
      incrementAmount: (10 * 1024)    // grow by 10 kilobytes each time buffer overflows.
  });

  req.resource = req.resource || {
    instance: {},
    params: {}
  };

  var debugOutput = [];

  var _headers = {
    code: null,
    headers: {}
  };

  var _presenter = service.presenter || service.presenterSource || function (opts, cb) {
    // default presenter will load view into cheerio server-side dom
    // this is useful for escape / validation, it also makes the designer simplier
    var $ = this.$;
    cb(null, $.html());
  };

  var output = through(function (chunk, enc, callback) {
    hookOutput.write(chunk);
    callback();
  }, function () {

    var content = hookOutput.getContents();
    // Apply basic mustache replacements
    // renamed themeSource -> viewSource
    var strTheme = service.view || service.themeSource;

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
        schema: service.schema
      }
    });

    var _view = new View({ template: strTheme, presenter: _presenter });

    if (typeof _view.present !== "function") {
      return res.end('Unable to load View-Presenter for hook service. We made a mistake. Please contact support.');
    }
    // give the presenter 3 seconds to render, or else it has failed
    var completedTimer = setTimeout(function(){
      if (!completed) {
        return cb(new Error('Hook presenter took more than 3 seconds to load. Aborting request. \n\nA delay of this long usually indicates the presenter never fired it\'s callback. Check the presenter code for error. \n\nIf this is not the case and you require more than 3 seconds to present your view, please contact hookmaster@hook.io'));
      }
    }, 3000);
    var completed = false;
    // replay headers?
    // res.writeHead(_headers.code, _headers.headers);
    try { // this will catch user run-time errors in the presenter
      _view.present({
        request: req,
        response: res,
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
          // console.log('ending view', rendered)
          res.end(rendered);
        } catch(err) {
          res.end('Failed to call res.end ' + err.message);
        }
      });
    } catch (err) {
      return res.end(err.message)
    }

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
  cb(null, req, output);
}