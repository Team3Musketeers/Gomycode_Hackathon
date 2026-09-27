// storage.js - the demo's high-risk bottleneck.
// Dependency profile: in-degree 2 (api.js, cli.js), out-degree 1 (validator.js).
// Touching this one file breaks two entry points, which is what the Blast
// Radius panel makes visible.
const fs = require('fs');
const validator = require('./validator');

module.exports = {
    saveData: function(data, callback) {
        if (!validator.isValid(data)) return callback(new Error("Invalid"));
        fs.writeFile('out.json', JSON.stringify(data), callback);
    }
};
