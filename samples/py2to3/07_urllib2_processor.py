# Legacy: urllib2 + xrange + print statement + Python 2 except syntax, all in one file.
# This is the canonical python2to3 demo snippet: it forces several distinct
# mechanical changes, which is exactly what the "why this change" explanation
# needs to describe.
import urllib2


def process_data(items):
    print "Starting processing..."
    for i in xrange(len(items)):
        try:
            response = urllib2.urlopen(items[i])
            print "Fetched: ", response.getcode()
        except urllib2.URLError, e:
            print "Error fetching data: ", e
