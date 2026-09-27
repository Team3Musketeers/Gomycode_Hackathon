# Legacy: xrange, dict.iteritems(), dict.has_key()
def build_index(data):
    index = {}
    for i in xrange(len(data)):
        index[i] = data[i]
    return index

def print_all(d):
    for key, value in d.iteritems():
        print key, "->", value

def check_key(d, k):
    if d.has_key(k):
        return d[k]
    return None
