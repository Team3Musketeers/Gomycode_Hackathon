# Legacy: Python 2 integer division behavior relied on implicitly
def average(total, count):
    return total / count  # int / int truncates in Py2, floats in Py3

def percentage(part, whole):
    return part / whole * 100
