module.exports = function (req, res, next) {

  var auth = require('basic-auth')

  var credentials = auth(req)

  if (!credentials || credentials.name !== 'admin' || credentials.pass !== 'password') {
    //res.statusCode(401);
    res.setHeader('WWW-Authenticate', 'Basic realm="examples"')
    res.writeHead(401);
    res.end('Access denied');
  } else {
    // req.user = 'john';
    next();
  }

}