// sourceGithubRepo.js - pulls microservice source code from Github Repository
// requires the `octonode` package and uses Github V3 REST API for pulling content

module.exports = function sourceGithubRepo (config) {

  var github = require('octonode');

  var Store = require('./Store');

  config = config || {};
  config.errorHandler = config.errorHandler || function (err, next) {
    if (err.message === "Bad credentials") {
      return next(new Error('Invalid Github oauth key: ' + config.token));
    }
    if (err.message === "Not Found") {
      return next(new Error('Could not load: ' + config.repo + "@" + config.branch + ":" + config.main));
    }
    return next(err);
  }

  // provider should be an instance of a node-redis client
  var provider = config.provider || new Store('memory', 'Source Github Repo');

  return function sourceGithubRepoHandler (req, res, next) {

    var key = config.repo + "@" + config.branch + ":" + config.main;

    // TODO: better support for pulling schema / view / presenter
    // TODO: better package.json support for main
    // check to see if there is a copy of the source code in the cache
    provider.get(key, function (err, repo) {
      if (err) {
        return next(err);
      }
      if (repo === 0) {
        // if a copy of the source code was not found, load it, use it, and set it
        fetchSourceCodeFromGithubRepo();
      } else {
        // if a copy of the source code exists in the cache, use it
        req.code = repo.code;
        next();
      }
    });

    function fetchSourceCodeFromGithubRepo () {

      // console.log('fetch source code from github')

      // in the middleware configuration, assume we already have an access token
      // access token must be done through github oauth login
      var token = config.token;

      if (typeof token === "undefined") {
        throw new Error('token is a required option!');
      }

      var client = github.client(token);

      var repo = config.repo || "Stackvana/microcule-examples";
      var branch = config.branch || "master";
      var main = config.main || "index.js";

      var ghrepo = client.repo(repo, branch);

      ghrepo.contents(main, function (err, file) {
        if (err) {
          return config.errorHandler(err, next);
        }
        req.code = base64Decode(file.content).toString();
        next();
        provider.set(key, req.code, function(err, _set){
        });
      });

    };

  }

}

function base64Decode (str) {
  var buf;
  if (typeof Buffer.from === "function") {
    // Node 5.10+
    buf = Buffer.from(str, 'base64'); // Ta-da
  } else {
    // older Node versions
    buf = new Buffer(str, 'base64'); // Ta-da
  }
  return buf;
}

