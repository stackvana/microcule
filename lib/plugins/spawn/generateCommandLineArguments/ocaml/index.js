module['exports'] = function generateOcamlArguments (service, env) {
  var args = [];

  var ocamlInject = "let hook_params = Hashtbl.create 123456;;\n";
  ocamlInject += "let hook_env = Hashtbl.create 123456;;\n";
  
  for (var p in env.params) {
    ocamlInject += 'Hashtbl.add hook_params "' + p + '" "' + env.params[p] + '";;'
  }

  for (var p in env.env) {
    ocamlInject += 'Hashtbl.add hook_env "' + p + '" "' + env.env[p] + '";;'
  }
  
  service.code = ocamlInject + '\n' + service.code;
  
  args = [
    '-code', service.code,
    '-service', JSON.stringify(service)
  ];

  return args;

}