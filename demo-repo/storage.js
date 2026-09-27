// storage.js - handles reading/writing todos to disk
var fs = require("fs");

function loadTodos(path, callback) {
  fs.readFile(path, "utf8", function (err, data) {
    if (err) return callback(err);
    try {
      callback(null, JSON.parse(data));
    } catch (e) {
      callback(e);
    }
  });
}

function saveTodos(path, todos, callback) {
  fs.writeFile(path, JSON.stringify(todos), function (err) {
    if (err) return callback(err);
    callback(null);
  });
}

module.exports = { loadTodos: loadTodos, saveTodos: saveTodos };
