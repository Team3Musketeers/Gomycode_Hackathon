// Legacy: nested callback chain that crosses a module boundary (db) and then
// a filesystem call (fs), returning a mutated object. Two error-first hops in
// one function, which is what makes async/await a clear win.
const fs = require('fs');
const db = require('./db');

function getUserProfile(userId, callback) {
    db.findUser(userId, function(err, user) {
        if (err) return callback(err);
        fs.readFile(user.configPath, 'utf8', function(err, config) {
            if (err) return callback(err);
            user.settings = JSON.parse(config);
            callback(null, user);
        });
    });
}
