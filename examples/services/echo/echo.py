import pprint, sys, json
print "Hello, this is a Python script."
print "Hook['params'] is populated with request parameters"
pprint.pprint(Hook['params'])
print "Hook['env'] is populated with env variables"
pprint.pprint(Hook['env'])
log('hello logs')
log(Hook['params'])
