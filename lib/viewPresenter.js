// TODO: remove this file and replace with /lib/plugins/viewPresenter.js
// Legacy v2.x.x
// The reason this file still exists, is that there seems to be an issue using the monkey patch express res / write middleware hack outside of express
// This was causing problem upstream in hook.io, because hook.io uses microcules middlewares directly ( not through .use() )
// Ideally, we should be able to fix /lib/plugins/viewPresenter.js to accomdate for both usages and remove this file

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

  var debugOutput = [];

  var _headers = {
    code: null,
    headers: {}
  };

  var output = through(function (chunk, enc, callback) {
    //console.log('getting output', chunk.toString())
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
      output: content.toString(),
      hook: {
        output: content.toString(),
        debug: JSON.stringify(debugOutput, true, 2),
        params: req.resource.instance,
        request: {
          headers: req.headers
        },
        response: {
          statusCode: res.statusCode,
          body: content.toString()
        },
        request: {
          headers: { 'fo': 'bar'}
        },
        schema: service.schema
      }
    });
    console.log(strTheme)
    res.end(strTheme);
    return;


    /*

    viewPresenter code has been removed ( for now ). not many people were using it and it's implementation seems brittle
    we should refactor this kind of post request template processing logic into plugins or post-middlewares

    var View = require('view').View;

    var _view = new View({ template: strTheme, presenter: _presenter });

    var _presenter = service.presenter || service.presenterSource || function (opts, cb) {
      // default presenter will load view into cheerio server-side dom
      // this is useful for escape / validation, it also makes the designer simplier
      var $ = this.$;
      cb(null, $.html());
    };

    // if presenter is a string, assume it's a Node.js module and attempt to compile it
    // this will somewhat safetly turn the string version of the function back into a regular function
    if (typeof _presenter === "string" && _presenter.length > 0) {
      console.log('ppp', _presenter)
      var Module = module.constructor;
      var __presenter = new Module();
      __presenter.paths = module.paths;
      var error = null;
      try {
        __presenter._compile(_presenter, 'presenter-' + service.name);
      } catch (err) {
        error = err;
      }
      // console.log("ERRR", _presenter, __presenter.exports, error)
      if (error !== null) {
        return cb(new Error('Could not compile presenter into module: ' + error.message));
      }
      _presenter = __presenter.exports;
    }

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

    var c = content.toString();
    try {
      c = JSON.parse(c);
    } catch (err) {

    }

    console.log('pre doing the view', c)
    try { // this will catch user run-time errors in the presenter
      _view.present({
        request: req,
        response: res,
        service: service,
        req: req,
        res: res,
        output: c,
        debug: debugOutput,
        instance: req.resource.instance,
        params: req.resource.params,
        headers: _headers
      }, function(err, rendered){
        completed = true;
        console.log('made it to completed', err)
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
    */
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