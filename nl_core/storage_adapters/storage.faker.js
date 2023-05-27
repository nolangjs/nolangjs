"use strict";
//logger
// var winston = require('winston');
// const jsf = require('json-schema-faker'); // json-schema faker
const mocker = require('mocker-data-generator').default;
const logger = global.logger;
const storage_main = require('./storage.main');

class storage_faker extends storage_main{
    constructor (storage, ssConf){
        super('faker');
        this.storage = storage;
        logger.log("new storage "+ storage);
    }

    async create(schema, packet){
        logger.log("create a "+ schema.$id)
    }

    async read(schema, filter, filterrulesMethod){
        logger.log("read from "+ schema.$id);
        //return jsf(schema);
        let schm = {};
        for(let k in schema.properties){
            if(schema.properties[k].faker){
                schm[k] = { faker: schema.properties[k].faker};
            }
        }

        return mocker()
            .schema('ress', schm, this.storage.count)
            .build(function(error, data) {
                if (error) {
                    throw error
                }
                //var util = require('util');
                //logger.log(util.inspect(data, { depth: 10 }))
                return (data.ress)
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
