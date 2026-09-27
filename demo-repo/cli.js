// cli.js - command-line entry point, the second consumer of storage.js.
// Dependency profile: in-degree 0, out-degree 1 (storage.js).
// Its existence is what gives storage.js in-degree 2 and makes it the
// highest-blast-radius file in the demo repo.
const storage = require('./storage');

function run(input) {
    storage.saveData(input, function(err) {
        if (err) console.error(err);
        else console.log("Done");
    });
}
