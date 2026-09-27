// index.js - entry point wiring it all together
var api = require("./api");

api.addTodo("./todos.json", { title: "Buy milk" }, function (err, todos) {
  if (err) {
    console.log("Failed to add todo:", err.message);
    return;
  }
  console.log("Todos updated:", todos);
});
