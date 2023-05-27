"use strict";
//logger
const logger = global.logger;
const storage_main = require('./storage.main');

class storage_json extends storage_main {
    constructor (storage, ssConf){
        super('json');
        this.storage = storage;
    }

    async create(schema, packet){
        logger.trace("create a "+ schema.$id)
    }

    async read(schema, filter, filterrulesMethod){
        logger.log("read from "+ schema.$id);
        if(!filter)
            return this.storage.data;
        else
            return this.storage.data.filter(d=>{
                for(let k in filter) {
                   if(d[k] !== filter[k]) return false;
                }
                return true;
            })
    }

    async count(schema, filter, filterrulesMethod) {
        let result = await this.read(schema, filter, filterrulesMethod);
        return {count: result.length}
    }

    find(schema, packet){
        logger.trace("find from "+ schema.$id)
    }

    async update(schema, packet, filter, filterrulesMethod){
        logger.trace("update "+ schema.$id)
    }

    async commit(changes){
        logger.trace("commit ...")
    }

    async delete(schema, filter, filterrulesMethod){
        logger.trace("delete "+ schema.$id)
    }


}

module.exports = storage_json;
