module['exports'] = function serviceExecutionTimeoutMessage (seconds) {
  // TODO: use a template instead of str concat
  var str = '';
  str += 'Timeout Limit Hit. Request Aborted! \n\Service source code took more than ';
  str += seconds;
  str += ' complete.\n\n';
  str += 'A delay of this long may indicate there is an error in the source code for the Service. \n\n';
  str += 'If there are no errors and the Service requires more than ';
  str += seconds;
  str += ' seconds to execute, you can increase SERVICE_MAX_TIMEOUT variable.';
  return str;  
}