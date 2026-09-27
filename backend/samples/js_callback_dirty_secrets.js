// Legacy: callback-based DB lookup, also has real security issues on purpose
// (Layer 3 stress test: this one should NOT come back "no issues found")

var API_KEY = "sk-live-4f8a9d2b3c1e0f7a6b5d4c3b2a1e0f9d";

function findUserByName(db, name, callback) {
    var query = "SELECT * FROM users WHERE name = '" + name + "'";
    db.query(query, function (err, rows) {
        if (err) return callback(err);
        callback(null, rows[0]);
    });
}

function chargeCustomer(name, amountCents, callback) {
    findUserByName(getDb(), name, function (err, user) {
        if (err) return callback(err);
        if (!user) return callback(new Error("no such user"));

        request({
            url: "https://payments.example.com/charge",
            headers: { Authorization: "Bearer " + API_KEY },
            body: { customerId: user.id, amount: amountCents }
        }, function (err2, res) {
            if (err2) return callback(err2);
            callback(null, res);
        });
    });
}

function getDb() {
    return { query: function (q, cb) { cb(null, []); } };
}

function request(opts, cb) {
    cb(null, { status: 200 });
}