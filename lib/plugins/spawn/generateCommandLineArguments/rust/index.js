function rustEscape (arg) {
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

module['exports'] = function generaterustArguments (service, env) {

  // parsing JSON in rust is not so great
  // instead, just iterate through all our properties,
  // and generate a bunch of unique keys
  var rustArgv;
  
  // iterate through all incoming env parameters and map them to a flat argv structure
  // these will be passed in over the command line and be avaialble in the compiled application as argv / argc scope
  // the service can then parse the incoming options however it wants
  var rustArgv = [];
  for (var p in env) {
    
    if (typeof env[p] === "object") {
      for (var s in env[p]) {
        var key = '-hook_' + p + '_' + s;
        var value = env[p][s];
        if (typeof value === "object") { // TODO: recursive flatten() function
          value = JSON.stringify(value);
        }
        rustArgv.push(key);
        rustArgv.push(value);
        //rustInject += 'Hook_' + p + '_' + s + '="' + rustEscape(env[p][s]) + '";\n'
      }
    } else {
      var key = '-hook_' + p;
      rustArgv.push(key);
      rustArgv.push(env[p]);
    }
  }
  return rustArgv;
  // return args;
}