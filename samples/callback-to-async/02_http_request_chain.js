// Legacy: nested http requests, error-first callbacks
var http = require("http");

function fetchUserThenPosts(userId, callback) {
  getUser(userId, function (err, user) {
    if (err) return callback(err);
    getPosts(user.id, function (err2, posts) {
      if (err2) return callback(err2);
      callback(null, { user: user, posts: posts });
    });
  });
}

function getUser(id, cb) {
  http.get("/api/users/" + id, function (res) {
    var body = "";
    res.on("data", function (chunk) { body += chunk; });
    res.on("end", function () { cb(null, JSON.parse(body)); });
  }).on("error", function (e) { cb(e); });
}

function getPosts(userId, cb) {
  http.get("/api/posts?user=" + userId, function (res) {
    var body = "";
    res.on("data", function (chunk) { body += chunk; });
    res.on("end", function () { cb(null, JSON.parse(body)); });
  }).on("error", function (e) { cb(e); });
}
