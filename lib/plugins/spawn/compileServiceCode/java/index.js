var tmp = require('tmp');
var path = require('path');
var fs = require("fs");
var spawnSync = require('child_process').spawnSync;

function getClassNameFromSource(code) {
  const regex = /class\s+(.*)/g;
  var match = regex.exec(code);
  return match[1];
}

function compileJavaSource(sourcePath) {
  var opts = {};
  var javac = spawnSync('javac', [sourcePath], opts);
}

module['exports'] = function compileJava (code, cb) {
  // Move code to a temporary location
  var tmpDir = tmp.dirSync().name;
  var className = getClassNameFromSource(code);
  var bytecodePath = path.join(tmpDir, className + ".class");
  var sourcePath = path.join(tmpDir, className + ".java");
  fs.writeFileSync(sourcePath, code);

  // Now compile the java file
  compileJavaSource(sourcePath);
  console.log(bytecodePath);
  // Return the bytecode path instead of source. We can point the JVM to this path and it will run.
  return bytecodePath;
}
