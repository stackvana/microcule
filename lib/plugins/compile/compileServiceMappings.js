module.exports = {
  "java": require('./compileServiceCode/java'),
  "gcc": require('./compileServiceCode/gcc'),
  "go": require('./compileServiceCode/golang')
};