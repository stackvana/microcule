module.exports = {
  http: {
    port: 3000,
    host: "0.0.0.0"
  },
  SERVICE_MAX_TIMEOUT: 10000,
  messages: {
    childProcessSpawnError: require('./messages/childProcessSpawnError'),
    serviceExecutionTimeout: require('./messages/serviceExecutionTimeout')
  }
};