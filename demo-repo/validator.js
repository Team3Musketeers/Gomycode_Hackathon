// validator.js - pure validation, no internal dependencies.
// Dependency profile: in-degree 1 (storage.js), out-degree 0.
// This is the demo's "safe, easy win": nothing else has to change to migrate it.
module.exports = {
    isValid: function(data) { return !!data; }
};
