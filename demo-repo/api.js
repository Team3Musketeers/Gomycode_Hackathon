// api.js - adds a new todo: validate, load existing, append, save
var storage = require("./storage");
var validator = require("./validator");

function addTodo(path, newTodo, callback) {
  validator.validateTodo(newTodo, function (err) {
    if (err) return callback(err);

    storage.loadTodos(path, function (err2, todos) {
      if (err2) return callback(err2);

      todos.push(newTodo);

      storage.saveTodos(path, todos, function (err3) {
        if (err3) return callback(err3);
        callback(null, todos);
      });
    });
  });
}

module.exports = { addTodo: addTodo };
