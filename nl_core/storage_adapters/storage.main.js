"use strict";
//logger
const logger = global.logger;

class storage_main {
    constructor (storage){
        logger.trace("new storage "+ storage);
    }

    async create(schema, packet){
        logger.log("create a "+ schema.$id, packet)
    }

    async read(schema, filter, filterrulesMethod, packet){
        logger.trace("read from "+ schema.$id, packet)
    }

    async count(schema, filter, filterrulesMethod, packet){
        logger.trace("count of "+ schema.$id, packet)
    }

    find(schema, packet){
        logger.trace("find from "+ schema.$id, packet)
    }

    async update(schema, packet, filter, filterrulesMethod){
        logger.log("update "+ schema.$id, {packet, filter, filterrulesMethod})
    }

    async commit(changes){
        logger.log("commit ...")
    }

    async delete(schema, filter, filterrulesMethod){
        logger.log("delete "+ schema.$id, filter, filterrulesMethod)
    }


}

module.exports = storage_main;
