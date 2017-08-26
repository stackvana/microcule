var fs = require('fs');

module.exports = {
  http: {
    port: 3000,
    host: "0.0.0.0",
    https: true, // set to `true` to enable SSL server. cert, key, and ca will be required.
    key: fs.readFileSync(__dirname + "/ssl/server-key.pem").toString(),
    cert: fs.readFileSync(__dirname + "/ssl/server-crt.pem").toString(),
    ca: [fs.readFileSync(__dirname + '/ssl/ca-crt.pem').toString()],
    sslRequired: true, // redirects all http traffic to https, optional
    onlySSL: false // will only start https server with no unprotected http interface, optional
    
  },
  SERVICE_MAX_TIMEOUT: 10000,
  messages: {
    childProcessSpawnError: require('./messages/childProcessSpawnError'),
    serviceExecutionTimeout: require('./messages/serviceExecutionTimeout')
  },
  releaseDir: process.cwd() + '/release'
};