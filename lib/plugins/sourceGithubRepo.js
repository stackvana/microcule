// sourceGithubRepo.js - pulls microservice source code from Github Repository
// requires the `octonode` package and uses Github V3 REST API for pulling content


var github = require('octonode');

module.exports = function sourceGithubRepo (config) {

  config = config || {};

  // in the middleware configuration, assume we already have an access token
  // access token must be done through github oauth login
  var token = config.token;
  
  if (typeof token === "undefined") {
    throw new Error('token is a required option!');
  }

  var client = github.client(token);

  var repo = config.repo || "Stackvana/microservice-examples";
  var branch = config.branch || "master";
  var main = config.main || "index.js";

  var ghrepo = client.repo(repo, branch);

  return function sourceGithubRepoHandler (req, res, next) {
    // TODO: better support for pulling schema / view / presenter
    // TODO: better package.json support for main
    ghrepo.contents(main, function (err, file) {
      if (err) {
        if (err.message === "Bad credentials") {
          return next(new Error('Invalid Github oauth key: ' + token));
        }
        if (err.message === "Not Found") {
          return next(new Error('Could not load: ' + repo + "@" + branch + ":" + main));
        }
        return next(err);
      }
      req.code = base64Decode(file.content).toString();
      next();
    });
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

