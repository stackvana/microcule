module['exports'] = function compileCoffee (code, cb) {

    var CoffeeScript = require('coffee-script'); // don't require unless we need it
  
    // service is coffee-script, so convert it to javascript
    // TODO: This may cause peformance issues, better to cache it
    code = CoffeeScript.compile(code);
    // brittle approach to remove coffee-script wrap,
    // we don't need / can't use the wrap as it was breaking our module['exports'] metaprogramming
    // TODO: better integration with generated JS
    code = code.split('\n');
    code.pop();
    code.pop();
    code.shift();
    // removes top and bottom generated lines
    code = code.join('\n');
    code = code.substr(0, code.length - 2);
  
    return code;
  
};