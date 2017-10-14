function bashEscape (arg) {
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
  str = str.replace(/`/g, '');
  str = str.replace(/"/g, '\'');
  str = str.split("\r\n");
  str = str.join(" ");
  return str;
}

module['exports'] = function generateBashArguments (service, env) {

  // parsing JSON in bash is not so great
  // instead, just iterate through all our properties,
  // and generate a bunch of unique keys
  var args = [];
  var bashInject = "";
  bashInject += 'Hook="The Hook object isnt a bash object.";\n'
  bashInject += 'declare -A Hook_params;\n';
  for (var p in env) {
    if (typeof env[p] === "object") {
      for (var s in env[p]) {
        if (s !== 'code') {
          // slight hack to not send bash code to service as parameters
          // causing some hard to catch escape issues
          bashInject += 'Hook_' + p + '_' + s + '="' + bashEscape(env[p][s]) + '";\n'
        }
        if (p === 'params') {
          bashInject += 'Hook_params[' + s +']=' + bashEscape(env[p][s])  + ';\n';
        }
      }
    } else {
      // bashInject += 'Hook_params[' + p +']=' + bashEscape(env[p])  + ';\n';
      bashInject += 'Hook_' + p + '="' + bashEscape(env[p]) + '";\n'
    }
  }
  args = [
    '-code', service.code,
    '-service', JSON.stringify(service),
    '-payload', bashInject
  ];
  return args;
}