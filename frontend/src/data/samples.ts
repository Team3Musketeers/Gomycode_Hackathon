import type { RecipeId, RepoFileDraft } from '../types/migration';

// Pulled verbatim from the team's own samples/ and demo-repo/ files
// (backend/samples, samples/py2to3, demo-repo/) so "Load example" shows
// real content the team already validated, not invented placeholder text.

interface Sample {
  snippet: { filename: string; code: string };
  repo: Omit<RepoFileDraft, 'id'>[];
}

export const samples: Record<RecipeId, Sample> = {
  python2to3: {
    snippet: {
      filename: 'report.py',
      code: `import math


def celsius_to_fahrenheit(celsius):
    return celsius * 9.0 / 5.0 + 32


def area_of_circle(radius):
    return math.pi * radius ** 2


def main():
    print "Enter a temperature in Celsius:"
    value = raw_input()
    celsius = float(value)
    print "That's", celsius_to_fahrenheit(celsius), "Fahrenheit"

    print "Enter a radius:"
    r = raw_input()
    radius = float(r)
    print "Circle area is", area_of_circle(radius)


if __name__ == '__main__':
    main()`,
    },
    repo: [
      {
        filename: '01_print_statement.py',
        code: `# Legacy: Python 2 print statement, no parens
def greet(name):
    print "Hello,", name
    print "Welcome to the system"

def show_report(items):
    for item in items:
        print item
`,
      },
      {
        filename: '02_xrange_and_dict.py',
        code: `# Legacy: xrange, dict.iteritems(), dict.has_key()
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
`,
      },
      {
        filename: '03_exception_syntax.py',
        code: `# Legacy: old-style exception handling
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
`,
      },
    ],
  },
  js_callback_to_async: {
    snippet: {
      filename: 'greet.js',
      code: `function fetchUserName(userId, callback) {
    setTimeout(function () {
        const names = { 1: 'Alice', 2: 'Bob', 3: 'Carol' };
        const name = names[userId];
        if (!name) {
            return callback(new Error('User not found'), null);
        }
        callback(null, name);
    }, 100);
}

function greetUser(userId, callback) {
    fetchUserName(userId, function (err, name) {
        if (err) {
            return callback(err);
        }
        callback(null, 'Hello, ' + name + '!');
    });
}

greetUser(2, function (err, greeting) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(greeting);
    }
});`,
    },
    // The team's real demo-repo/ — this is the exact 4-file set Layer 6a's
    // dependency graph was hand-verified against (storage.js is the
    // highest-blast-radius file: in-degree 2, out-degree 1).
    repo: [
      {
        filename: 'validator.js',
        code: `// validator.js - pure validation, no internal dependencies.
// Dependency profile: in-degree 1 (storage.js), out-degree 0.
module.exports = {
    isValid: function(data) { return !!data; }
};
`,
      },
      {
        filename: 'storage.js',
        code: `// storage.js - the demo's high-risk bottleneck.
// Dependency profile: in-degree 2 (api.js, cli.js), out-degree 1 (validator.js).
const fs = require('fs');
const validator = require('./validator');

module.exports = {
    saveData: function(data, callback) {
        if (!validator.isValid(data)) return callback(new Error("Invalid"));
        fs.writeFile('out.json', JSON.stringify(data), callback);
    }
};
`,
      },
      {
        filename: 'api.js',
        code: `// api.js - HTTP-facing entry point.
// Dependency profile: in-degree 0, out-degree 1 (storage.js).
const storage = require('./storage');

module.exports = {
    handleRequest: function(req, callback) {
        storage.saveData(req.body, function(err) {
            if (err) return callback(err);
            callback(null, { status: "success" });
        });
    }
};
`,
      },
      {
        filename: 'cli.js',
        code: `// cli.js - command-line entry point, the second consumer of storage.js.
// Dependency profile: in-degree 0, out-degree 1 (storage.js).
const storage = require('./storage');

function run(input) {
    storage.saveData(input, function(err) {
        if (err) console.error(err);
        else console.log("Done");
    });
}
`,
      },
    ],
  },
};
