"use strict";
//logger
// var winston = require('winston');
// const jsf = require('json-schema-faker'); // json-schema faker
const mocker = require('mocker-data-generator').default;
const logger = global.logger;
const storage_main = require('./storage.main');
const orderBy = require('./orderby.utils');

class storage_faker extends storage_main{
    constructor (storage, ssConf){
        super('faker');
        this.storage = storage;
        logger.log("new storage "+ storage);
    }

    async create(schema, packet){
        logger.log("create a "+ schema.$id)
    }

    async read(schema, filter, filterrulesMethod, packet){
        logger.log("read from "+ schema.$id);
        //return jsf(schema);
        let schm = {};
        for(let k in schema.properties){
            if(schema.properties[k].faker){
                schm[k] = { faker: schema.properties[k].faker};
            }
        }

        let thes = this;

        return mocker()
            .schema('data', schm, packet.$$header.limit || this.storage.count || 10)
            .build(function(error, data1) {
                if (error) {
                    throw error
                }
                //var util = require('util');
                //logger.log(util.inspect(data, { depth: 10 }))
                let data = data1.data;

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

                if (thes.storage.count && packet.$$header.limit) {
                    data = data.slice(0, packet.$$header.limit);
                }

                if (packet.$$header.sort) {
                    data = data.sort(orderBy(packet.$$header.sort))
                }

                return data;
            })
    }

    find(schema, packet){
        logger.log("find from "+ schema.$id)
    }

    async update(schema, packet, filter, filterrulesMethod){
        logger.log("update "+ schema.$id)
    }

    async commit(changes){
        logger.log("commit ...")
    }

    async delete(schema, filter, filterrulesMethod){
        logger.log("delete "+ schema.$id)
    }


}

module.exports = storage_faker;
