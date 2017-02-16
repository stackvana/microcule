import pprint
import logging
import microcule

log = logging.getLogger('echo-py')

def app(environ, start_response):
    start_response('200 OK', [('content-type', 'text/plain')])
    res = ["Hello, this is a Python script."]
    res.append("Hook['params'] is populated with request parameters")
    res.append(pprint.pformat(Hook['params']))
    res.append("Hook['req'] is the http request")
    res.append(pprint.pformat(Hook['req']['url']))
    log.info('hello logs')
    log.warn('%s', Hook['params'])
    return '\n'.join(res)

if __name__ == '__main__':
    microcule.HookIOHandler(Hook).run(app)