# Legacy: urllib2, unicode literals
import urllib2

def fetch(url):
    response = urllib2.urlopen(url)
    return response.read()

def make_label(name):
    return u"User: " + name

def is_string(x):
    return isinstance(x, basestring)
