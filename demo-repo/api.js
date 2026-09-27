// api.js - HTTP-facing entry point.
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
