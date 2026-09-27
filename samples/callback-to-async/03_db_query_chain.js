// Legacy: sequential db-style callback chain
function createOrder(db, orderData, callback) {
  db.checkStock(orderData.itemId, function (err, inStock) {
    if (err) return callback(err);
    if (!inStock) return callback(new Error("out of stock"));

    db.chargeCard(orderData.card, orderData.amount, function (err2, charge) {
      if (err2) return callback(err2);

      db.saveOrder(orderData, function (err3, order) {
        if (err3) return callback(err3);
        callback(null, order);
      });
    });
  });
}
