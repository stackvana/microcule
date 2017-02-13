function REscape (arg) {
  if (typeof arg === "undefined") {
    return "";
  }
  var str = arg.toString();
  str = str.split("\r\n");
  str = str.join(" ");
  return str;
}

module['exports'] = function generateRArguments (service, env) {

  var args = [];
  /*
  var RInject = "";

  RInject += '$Hook = "The Hook object isnt an object.";\n';
  RInject += '$Hook_params = "The Hook.params object isnt an object.";\n';
  */
  /*
  for (var p in env) {
    if (typeof env[p] === "object") {
      for (var s in env[p]) {
        RInject += '$Hook_' + p + '_' + s + ' = \'' + REscape(env[p][s]) + '\';\n'
      }
    } else {
      RInject += '$Hook_' + p + ' = \'' + REscape(env[p]) + '\';\n'
    }
  }
  */
  args = [
    service.tempBin,
    '-e', service.code,
    '-service', JSON.stringify(service)
  ];
  return args;

}