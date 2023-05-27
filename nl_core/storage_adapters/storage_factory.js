const logger = global.logger;

module.exports = async function storage_factory(storage) {
    let storageAdapter = storage.adapter;
    if (storageAdapter === 'memory' || storageAdapter === 'file') storageAdapter = 'lowdb';//todo bad naming adapters in this layer

    try{
        let _adapter = require('./storage.' + storageAdapter);
        let adapter = await new _adapter(storage, this.conf);
        return adapter;
    } catch (e) {
        logger.error(e.message);
        return null;
    }
}
