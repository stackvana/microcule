function clispEscape (arg) {
  if (typeof arg === "undefined") {
    return "";
  }
  var str = arg.toString();
  str = str.replace(/"/g, '\\"')
  return str;
}

module['exports'] = function generateClispArguments (service, env) {
  var args = [];
  var clispInject = "";

  clispInject += '; declare the hash tables for Hook.params and Hook.env \n';

  clispInject += '(defparameter *Hook* (make-hash-table))\n';
  clispInject += '(defparameter *params* (make-hash-table))\n';
  clispInject += '(defparameter *env* (make-hash-table))\n';

  clispInject += '; assign the params and env hashes to the Hook \n';
  clispInject += '(setf (gethash \'params *Hook*) *params*)\n';
  clispInject += '(setf (gethash \'env *Hook*) *env*)\n';

  clispInject += '; assign http parameters \n';
  clispInject += '(setf (gethash \'a *params*) "1")\n';

  clispInject += '; assign env parameters \n';
  clispInject += '(setf (gethash \'d *env*) "4")\n';

  for (var p in env) {

    if (typeof env[p] === "object") {
      clispInject += '(defparameter *' + p + '* (make-hash-table))\n';
      clispInject += '(setf (gethash \'' + p + ' *Hook*) *' + p + '*)\n';
      for (var s in env[p]) {
        var val = env[p][s];
        if (typeof val === "object") {
          // TODO: serialize value
          val = "unavailable";
        }
        if (s !== 'code') {
          clispInject += '(setf (gethash \'' + s + ' *' + p + '*) "' + clispEscape(val) + '")\n';
        }
      }
    } else {
      clispInject += '(setf (gethash \'' + p + ' *Hook*) "' + clispEscape(env[p]) +  '")\n';
    }
  }

  clispInject = clispInject.substr(0, clispInject.length - 1);

  args = [
    '-c', service.code,
    '-s', JSON.stringify(service),
    '-p', clispInject
  ];

  return args;
}