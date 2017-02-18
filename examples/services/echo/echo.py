# -*- coding: utf-8 -*-
import pprint, sys, codecs, json, logging
log = logging.getLogger('').debug
print("Hello, this is a Python script.")
print("Hook['params'] is populated with request parameters")
pprint.pprint(Hook['params'])
#print("Hook['env'] is populated with env variables")
#pprint.pprint(Hook['env'])
print("Hook['req'] is the http request")
print(Hook['req']['url'])
print(u"проверка кодировки")
print(u"סיסטעם פּרובירן")
print(u"編碼測試")
print(u"エンコードテスト")
print(u"एन्कोडिंग परीक्षण")
log('hello logs')
log(repr(Hook['params']))
