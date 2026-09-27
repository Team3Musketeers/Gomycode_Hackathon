// Legacy: manual retry logic with callbacks
function fetchWithRetry(url, retriesLeft, callback) {
  request(url, function (err, response) {
    if (err) {
      if (retriesLeft > 0) {
        return fetchWithRetry(url, retriesLeft - 1, callback);
      }
      return callback(err);
    }
    callback(null, response);
  });
}

function request(url, cb) {
  // stand-in for a real request call
  cb(null, { url: url, status: 200 });
}
