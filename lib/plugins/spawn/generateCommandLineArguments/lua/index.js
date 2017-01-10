function luaEscape (arg) {
  if (typeof arg === "undefined") {
    return "";
  }
  if (typeof arg === "object") {
    arg = JSON.stringify(arg);
  }
  var str = arg.toString();
  str = str.split("\r\n");
  str = str.join(" ");
  return str;
}

module['exports'] = function generateLuaArguments (service, env) {
  var args = [];
  var luaInject = "Hook = {}\n";
  luaInject += "local json = require('json')\n"
  // TODO: fix issue with escaped values
  luaInject += "Hook = json.parse('" + JSON.stringify(env) + "')\n";
  // Note: The following block of code is legacy and not needed for new services
  //       We will maintain this code path for a few moves until all legacy services have migrated to the new API
  for (var p in env) {
    if (typeof env[p] === "object") {
      for (var s in env[p]) {
        luaInject += 'Hook_' + p + '_' + s + ' = \'' + luaEscape(env[p][s]) + '\'\n'
      }
    } else {
      luaInject += 'Hook_' + p + ' = \'' + luaEscape(env[p]) + '\'\n'
    }
  }
  args = [
    '-code', service.code,
    '-service', JSON.stringify(service),
    '-payload', luaInject
  ];
  return args;

}