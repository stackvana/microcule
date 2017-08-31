import pprint
import logging

log = logging.getLogger('echo-py')

def app(environ, start_response):
    start_response('200 OK', [('content-type', 'text/plain')])
    res = ["hello world"]
    return '\n'.join(res)