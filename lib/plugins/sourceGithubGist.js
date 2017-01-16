// sourceGithubGist.js - pulls microservice source code from Github Gist
// requires the `octonode` package and uses Github V3 REST API for pulling content

module.exports = function sourceGithubGist (config) {

  var github = require('octonode');

  var Store = require('./Store');

  config = config || {};
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
  var provider = config.provider || new Store('memory', 'Source Github Repo');

  return function sourceGithubGistHandler (req, res, next) {

    var key = config.gistID;

    // TODO: better support for pulling schema / view / presenter
    // TODO: better package.json support for main
    // check to see if there is a copy of the source code in the cache
    provider.get(key, function (err, repo) {
      if (err) {
        return next(err);
      }
      if (repo === 0) {
        // if a copy of the source code was not found, load it, use it, and set it
        fetchSourceCodeFromGithubGist();
      } else {
        // if a copy of the source code exists in the cache, use it
        req.code = repo.code;
        next();
      }
    });

    function fetchSourceCodeFromGithubGist () {
      // console.log('fetchSourceCodeFromGithubGist');
      // in the middleware configuration, assume we already have an access token
      // access token must be done through github oauth login
      var token = config.token;

      if (typeof token === "undefined") {
        throw new Error('token is a required option!');
      }

      var client = github.client(token);

      var main = config.main;
      var gistID = config.gistID || null;
      var ghgist = client.gist();

      ghgist.get(gistID,  function(err, g){
       if (err) {
         if (err.message === "Bad credentials") {
           return next(new Error('Invalid Github oauth key: ' + token));
         }
         if (err.message === "Not Found") {
           return next(new Error('Could not find gist: ' + gistID));
         }
         return next(err);
       }
       // TODO: Better package.json / main support
       // for gists, main will either be the first file found, or the main specified
       if (typeof main === "string" && main.length > 0) {
         if (typeof g.files[main] === "undefined") {
           return next(new Error('Could not find main entry point: ' + main));
         }
         req.code = g.files[main].content;
         // res.end(g.files[main].content);
       } else {
         var keys = Object.keys(g.files)
         req.code = g.files[keys[0]].content;
         // res.end(g.files[0].content);
       }
       provider.set(key, req.code, function (err, _set) {
         if (err) {
           console.log(err)
         }
       });
       return next();
      });
    }
  }

}