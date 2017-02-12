function golangEscape (arg) {
  if (typeof arg === "undefined") {
    return "";
  }
  var str;
  str = arg.toString();
  /*
  if (typeof arg === "object") {
    str = JSON.stringify(arg);
  } else {
  }
  */
  str = arg.toString().replace(/"/g, '\'');
  str = str.split("\r\n");
  str = str.join(" ");
  return str;
}

module['exports'] = function generategolangArguments (service, env) {

  // parsing JSON in golang is not so great
  // instead, just iterate through all our properties,
  // and generate a bunch of unique keys
  var golangArgv;
  
  // iterate through all incoming env parameters and map them to a flat argv structure
  // these will be passed in over the command line and be avaialble in the compiled application as argv / argc scope
  // the service can then parse the incoming options however it wants
  var golangArgv = [];
  for (var p in env) {
    
    if (typeof env[p] === "object") {
      for (var s in env[p]) {
        var key = '-hook_' + p + '_' + s;
        var value = env[p][s];
        if (typeof value === "object") { // TODO: recursive flatten() function
          value = JSON.stringify(value);
        }
        golangArgv.push(key);
        golangArgv.push(value);
        //golangInject += 'Hook_' + p + '_' + s + '="' + golangEscape(env[p][s]) + '";\n'
      }
    } else {
      var key = '-hook_' + p;
      golangArgv.push(key);
      golangArgv.push(env[p]);
    }
  }
  return golangArgv;
  // return args;
}