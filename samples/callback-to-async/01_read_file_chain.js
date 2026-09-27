// Legacy: nested callback chain reading + parsing a file
var fs = require("fs");

function loadUserConfig(path, callback) {
  fs.readFile(path, "utf8", function (err, data) {
    if (err) return callback(err);
    parseConfig(data, function (err2, config) {
      if (err2) return callback(err2);
      validateConfig(config, function (err3, validConfig) {
        if (err3) return callback(err3);
        callback(null, validConfig);
      });
    });
  });
}

function parseConfig(data, cb) {
  try {
    cb(null, JSON.parse(data));
  } catch (e) {
    cb(e);
  }
}

function validateConfig(config, cb) {
  if (!config.name) return cb(new Error("missing name"));
  cb(null, config);
}
