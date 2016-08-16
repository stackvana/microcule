// TODO: Make this use standard babel config files and toolchain?
//       Right now, we've essentially hard-coded a Babel config

module['exports'] = function compileBabel (code, cb) {
  var babel = require('babel-core');

  // service is es6+, so convert it to normal javascript
  // TODO: This may cause peformance issues, could be better to cache transpile of code or use updated node binary with flag
  // npm install --save babel-core
  // npm install --save babel-polyfill
  // npm install --save babel-plugin-syntax-async-functions
  // npm install --save babel-plugin-transform-regenerator
  // npm install --save babel-preset-es2015
  // npm install --save babel-preset-stage-3
  var opts = {
    "presets": [
     "es2015",
     "stage-3"
    ],
    "plugins": ["syntax-async-functions","transform-regenerator"]
  };
  require("babel-polyfill");
  
  code = babel.transform(code, opts).code;
  // brittle approach to wrap es7 in module.exports
  // TODO: better integration with generated JS
  code = code.split('\n');
  code.shift();
  code.shift();
  code = code.join('\n');
  code = 'var exports = module["exports"];\n\n' + code;
  return code;
}
