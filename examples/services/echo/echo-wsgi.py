# -*- coding: utf-8 -*-
import sys
import pprint
import logging
import microcule
from six import u

log = logging.getLogger('echo-py')

def app(environ, start_response):
    start_response('200 OK', [('content-type', 'text/plain')])
    res = ["Hello, this is a Python script."]
    res.append("Hook['params'] is populated with request parameters")
    res.append(pprint.pformat(Hook['params']))
    res.append("Hook['req'] is the http request")
    res.append(pprint.pformat(Hook['req']['url']))
    res.append(u"проверка кодировки")
    res.append(u"סיסטעם פּרובירן")
    res.append(u"編碼測試")
    res.append(u"エンコードテスト")
    res.append(u"एन्कोडिंग परीक्षण")
    #print(repr(res))
    res = u'\n'.join(res)
    #print(repr(res))
    res = res.encode('utf-8')
    #print(repr(res))
    log.info('hello logs')
    log.warn('%s', Hook['params'])
    return [res]

if __name__ == '__main__':
    microcule.wsgi(Hook).run(app)
