// remoteSourceCode.js - fetches source code for microservices from remote locations
// can optionally cache source code in-memory or with a redis provider
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
    // for gists, main will either be the first file found, or the main specified
    ghgist.get(gistID,  function(err, g){
     if (err) {
       // return next(new Error('Could not load: ' + repo + "@" + branch + ":" + main));
       return next(err);
     }
     //res.writeHead(200, {'Content-Type': 'text/plain'});
     if (typeof main !== "undefined") {
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