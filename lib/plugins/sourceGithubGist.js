// sourceGithubGist.js - pulls microservice source code from Github Gist
// requires the `octonode` package and uses Github V3 REST API for pulling content

var github = require('octonode');

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

module.exports = function sourceGithubGist (config) {
  config = config || {};

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

  return function sourceGithubGistHandler (req, res, next) {
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
     if (typeof main !== "undefined") {
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
     return next();
    });
  }

}