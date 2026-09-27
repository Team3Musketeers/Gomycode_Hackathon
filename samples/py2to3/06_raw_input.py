# Legacy: raw_input, cmp() builtin
def ask_name():
    name = raw_input("What is your name? ")
    return name

def compare_scores(a, b):
    return cmp(a, b)
