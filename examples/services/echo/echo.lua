local json = require('json')
print ("Hello, this is a Lua script.")
print ("Hook['params'] is populated with request parameters")
print ("Hook['env'] is populated with env variables")
print(json.stringify(Hook['params']))
print(json.stringify(Hook['env']))

-- gets sent to logging handler
log('Hook params', Hook['params'])
