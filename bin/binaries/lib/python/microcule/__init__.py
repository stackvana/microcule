import sys
import json
import logging
import traceback
import pkg_resources
import wsgiref.handlers
import os

# open incoming connection from fd3
if sys.version_info[0] < 3:
  fd3 = os.fdopen(3, 'w+')
else:
  fd3 = os.fdopen(3, 'wb+', buffering=0)

class FullMicroculeJSONFormatter(logging.Formatter):
    def format(self, record):
        record.message = record.getMessage()
        if record.exc_info and not record.exc_text:
            record.exc_text = self.formatException(record.exc_info)
        record = record.__dict__.copy()
        record['exc_info'] = None
        try:
            json.dumps(record['args'])
        except Exception:
            del record['args']
            record['msg'] = record['message']
        res = {'type': 'log', 'payload': {'entry': record}}
        return json.dumps(res)


class SimpleMicroculeJSONFormatter(logging.Formatter):
    def format(self, record):
        msg = logging.Formatter.format(self, record)
        res = {'type': 'log', 'payload': {'entry': msg}}
        return json.dumps(res)


class MicroculeExceptHook:
    def __init__(self, display=1, verbose=1):
        self.display = display
        self.verbose = verbose

    def __call__(self, etype, evalue, etb):
        self.handle((etype, evalue, etb))

    def handle(self, info=None):
        self.send_exception(info)
        sys.exit(1)

    def send_exception(self, info=None):
        info = info or sys.exc_info()
        code = info[0].__name__
        if getattr(info[0], '__module__ ', None):
            code = info[0].__module__ + '.' + code
        payload = {'code': code}
        if hasattr(info[1], 'args'):
            payload['args'] = repr(info[1].args)
        if self.verbose:
            payload['error'] = ''.join(traceback.format_exception(*info))
        else:
            payload['error'] = str(info[1])
        res = {'type': 'error', 'payload': payload}
        if isinstance(info[1], ImportError) and info[1].message.startswith('No module named '):
            payload['code'] = 'MODULE_NOT_FOUND'
            payload['module'] = info[1].message.replace('No module named ', '')
        if isinstance(info[1], (pkg_resources.VersionConflict, pkg_resources.DistributionNotFound)):
            req = None
            try:
                if hasattr(info[1], 'req'):
                    req = info[1].req
                # This is check for compatibility with old version of setuptools
                if req is None:
                    for arg in info[1].args:
                        if isinstance(arg, pkg_resources.Requirement):
                            req = arg
            except BaseException:
                # unable to parse exception to requirement - it's ok
                pass
            if req is not None:
                payload['code'] = 'MODULE_NOT_FOUND'
                payload['module'] = str(req)
                error = '%s(%s): %s' % (payload['code'], code, str(info[1]))
                if self.verbose:
                    payload['error'] += error
                else:
                    payload['error'] = error
                    
                    
        fd3.write(json.dumps(res)+'\n')
        fd3.flush()
        fd3.write(json.dumps({'type': 'statusCode', 'payload': {'value': 500}})+'\n')
        fd3.flush()

        if self.display:
            sys.stdout.write(payload['error'].rstrip('\n')+'\n')
            sys.stdout.flush()
        fd3.write(json.dumps({'type': 'end'})+'\n')
        fd3.flush()


class wsgi(wsgiref.handlers.CGIHandler):
    def __init__(self, Hook=None):
        self.Hook = Hook or getattr(sys.modules.get('__main__',sys), 'Hook', None)
        wsgiref.handlers.BaseCGIHandler.__init__(
            self, sys.stdin, sys.stdout, sys.stderr, {},
            multithread=False, multiprocess=True
        )

    def send_headers(self):
        self.cleanup_headers()
        self.headers_sent = True
        # remark: the status code needs to be sent to the parent process as an 3 digit integer value, not a string value with label
        # todo: make parse int code for status more robust.
        head = {'type': 'writeHead', 'payload': {'code': int(self.status[:3]), 'headers': dict(self.headers)}}
        fd3.write(json.dumps(head)+'\n')
        fd3.flush()

    def add_cgi_vars(self):
        #assert not Hook['isStreaming'], 'Streaming hooks not yet supported by WSGI gateway'
        self.environ.update(self.Hook['env'])
        if 'hookAccessKey' in self.Hook:
            self.environ['hook_private_key'] = self.Hook['hookAccessKey']
        self.environ['SERVER_NAME'] = self.Hook['req']['host']
        self.environ['GATEWAY_INTERFACE'] = 'CGI/1.1'
        self.environ['SERVER_PORT'] = '443'
        self.environ['REMOTE_ADDR'] = self.environ['REMOTE_HOST'] = self.Hook['req']['connection']['remoteAddress']
        self.environ['CONTENT_LENGTH'] = ''
        self.environ['SCRIPT_NAME'] = ''
        self.environ['SERVER_PROTOCOL'] = 'HTTP/1.0'
        self.environ['REQUEST_METHOD'] = self.Hook['req']['method']
        self.environ['PATH_INFO'] = self.Hook['req']['path']
        self.environ['QUERY_STRING'] = self.Hook['req']['url'][len(self.Hook['req']['path'])+1:]
        self.environ['CONTENT_TYPE'] = self.Hook['req']['headers'].get('content-type', '')
        if 'content-length' in self.Hook['req']['headers']:
            self.environ['CONTENT_LENGTH'] = self.Hook['req']['headers']['content-length']
        for k,v in self.Hook['req']['headers'].items():
            k = k.replace('-', '_').upper()
            v = v.strip()
            if k in self.environ:
                continue
            self.environ['HTTP_'+k] = v
        if self.Hook.get('isHookio', False):
            hookname = '/%(owner)s/%(hook)s/' % self.Hook['req']['params']
            assert (self.Hook['req']['path']+'/').startswith(hookname)
            wsgiref.util.shift_path_info(self.environ)  # user
            wsgiref.util.shift_path_info(self.environ)  # hook


def hookioLoggingConfig(level=None, format=None, datefmt=None):
    logging._acquireLock()
    try:
        if level is not None:
            logging.root.setLevel(level)
        if len(logging.root.handlers) > 0:
            return
        hdlr = logging.StreamHandler(sys.stderr)
        if format is None:
            fmt = FullMicroculeJSONFormatter()
        else:
            fmt = SimpleMicroculeJSONFormatter(format, datefmt)
        hdlr.setFormatter(fmt)
        logging.root.addHandler(hdlr)
    finally:
        logging._releaseLock()


def parse_argv(argv=None):
    argv = argv or sys.argv

    # print(argv[0]) # binary
    # print(argv[1]) # -c
    # print(argv[2]) # the code
    code = argv[2]

    # print(argv[3]) # -e
    # print(argv[4]) # the env
    envJSON = argv[4]

    Hook = json.loads(envJSON)
    #print(Hook.keys())
    #print(Hook['resource'].keys())
    Hook['req'] = Hook['input']
    # TODO: full mapping of http including streaming / multipart streaming

    # print(argv[5]) # -s
    # print(argv[6]) # the service
    # TODO: do something with service variable
    service = argv[6]

    debug_output = 'gateway' in Hook['resource'].get('name', 'gateway')
    prod_mode = Hook['resource'].get('mode', 'Debug') == 'Production'
    #if debug_output:
    #    sys.stderr = sys.stdout

    level = [logging.DEBUG, logging.INFO][prod_mode]
    hookioLoggingConfig(level)
    sys.excepthook = MicroculeExceptHook(debug_output, not prod_mode)

    return code, service, Hook
