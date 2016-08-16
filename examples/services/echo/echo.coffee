module.exports = (hook) ->
  hook.res.write 'Hello, this is a Coffee-script function.\n'
  hook.res.write 'hook.params is populated with request parameters\n'
  hook.res.write JSON.stringify(hook.params, true, 2)
  hook.res.end ''
  return