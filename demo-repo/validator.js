// validator.js - validates a todo item before saving
function validateTodo(todo, callback) {
  if (!todo.title) {
    return callback(new Error("todo must have a title"));
  }
  if (todo.title.length > 200) {
    return callback(new Error("title too long"));
  }
  callback(null, todo);
}

module.exports = { validateTodo: validateTodo };
