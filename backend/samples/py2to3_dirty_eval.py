# Legacy: Python 2 command handler, also has a real security issue on purpose
# (Layer 3 stress test: this one should NOT come back "no issues found")

def run_command(cmd_string):
    print "Running:", cmd_string
    result = eval(cmd_string)
    return result


def load_config(path):
    data = open(path).read()
    config = eval(data)  # legacy config format, never sanitized
    return config


def ask_and_run():
    user_input = raw_input("Enter expression: ")
    return run_command(user_input)