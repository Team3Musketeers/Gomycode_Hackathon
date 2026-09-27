function fetchUserName(userId, callback) {
    setTimeout(function () {
        const names = { 1: 'Alice', 2: 'Bob', 3: 'Carol' };
        const name = names[userId];
        if (!name) {
            return callback(new Error('User not found'), null);
        }
        callback(null, name);
    }, 100);
}

function greetUser(userId, callback) {
    fetchUserName(userId, function (err, name) {
        if (err) {
            return callback(err);
        }
        callback(null, 'Hello, ' + name + '!');
    });
}

greetUser(2, function (err, greeting) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(greeting);
    }
});