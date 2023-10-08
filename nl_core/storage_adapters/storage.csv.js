"use strict";
//logger
const logger = global.logger;
const storage_main = require('./storage.main');
const csv = require("csvtojson");
const {join} = require('path');
const orderBy = require('../tools/orderby.utils');

class storage_csv extends storage_main {
    constructor (storage, ssConf){
        super('csv');
        this.storage = storage;
    }

    async create(schema, packet) {
        logger.trace("create a "+ schema.$id)
    }

    async read(schema, filter, filterrulesMethod, packet){
        logger.log("read from "+ schema.$id);
        let path = this.path = join(global.appPath,this.storage.path);
        let data = await csv().fromFile(path);

        if(filter) {
            data = data.filter(_dataObject => {
                for (let condition in filter) {
                    if (_dataObject[condition] !== filter[condition]) return false;
                }
                return true;
            });
        }

        if(filterrulesMethod)
            data = data.filter(filterrulesMethod);

        if (packet.$$header.skip) {
            data = data.splice(packet.$$header.skip);
        }

        if (packet.$$header.limit) {
            data = data.slice(0, packet.$$header.limit);
        }

        if (packet.$$header.sort) {
            data = data.sort(orderBy(packet.$$header.sort))
        }

        return data;
    }

    async count(schema, filter, filterrulesMethod, packet) {
        let result = await this.read(schema, filter, filterrulesMethod, packet);
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

module.exports = storage_csv;
