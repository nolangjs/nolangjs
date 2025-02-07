const logger = global.logger;
const storages = {
    cookie: require('./storage.cookie.js'),
    csv: require('./storage.csv.js'),
    faker: require('./storage.faker.js'),
    inline: require('./storage.inline'),
    lowdb: require('./storage.lowdb.js'),
    mongodb: require('./storage.mongodb.js'),
    mysql: require('./storage.mysql.js'),
    nedb: require('./storage.nedb.js'),
    postgresql: require('./storage.postgresql.js'),
}

module.exports = async function storage_factory(storage) {
    let storageAdapter = storage.adapter;

    if (storageAdapter === 'memory' || storageAdapter === 'file')
        storageAdapter = 'nedb';//todo bad naming adapters in this layer

    if (storageAdapter === 'json')
        storageAdapter = 'lowdb';

    try{
        // let _adapter = require('./storage.' + storageAdapter);
        let _adapter = storages[storageAdapter];
        return await new _adapter(storage, this.conf);
    } catch (e) {
        logger.error(e.message);
        return null;
    }
}
