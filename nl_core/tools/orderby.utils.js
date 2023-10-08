function sortBy(key, cb) {
    if (!cb) cb = () => 0;
    return (a, b) => (a[key] > b[key]) ? 1 :
        ((b[key] > a[key]) ? -1 : cb(a, b));
}

function sortByDesc(key, cb) {
    if (!cb) cb = () => 0;
    return (b, a) => (a[key] > b[key]) ? 1 :
        ((b[key] > a[key]) ? -1 : cb(b, a));
}

function orderBy(sort) {
    let keys = Object.keys(sort);
    let orders = Object.values(sort);
    let cb = () => 0;
    keys.reverse();
    orders.reverse();
    for (const [i, key] of keys.entries()) {
        const order = orders[i];
        if (order === 1)
            cb = sortBy(key, cb);
        else if (order === -1)
            cb = sortByDesc(key, cb);
        else
            throw new Error(`Unsupported order "${order}"`);
    }
    return cb;
}

module.exports = orderBy;
