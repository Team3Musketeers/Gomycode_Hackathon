# Legacy: old-style exception handling
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError, e:
        print "Error:", e
        return None

def parse_int(s):
    try:
        return int(s)
    except ValueError, err:
        print "Bad value:", err
        return 0
