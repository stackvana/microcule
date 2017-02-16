import pprint
import logging
import microcule

log = logging.getLogger('echo-py')

def app(environ, start_response):
    start_response('200 OK', [('content-type', 'text/plain')])
    res = ["hello world"]
    return '\n'.join(res)

if __name__ == '__main__':
    microcule.wsgi(Hook).run(app)