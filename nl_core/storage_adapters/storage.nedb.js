"use strict";
//logger
const storage_main = require('./storage.main');
const Datastore = require('nedb');
const {join} = require('path');
const logger = global.logger;

class storage_nedb extends storage_main {
    constructor (storage) {
        if(storage.adapter === "memory") {
            super('memory');
            this.db = new Datastore();
        } else {
            super('file');
            let path = this.path = join(global.appPath,storage.path);
            if(!path) {
                throw new Exception("No path in storage ");
            }
            this.db = new Datastore({ filename: path, autoload: true });
        }

        this.storage = storage;
    }

    async create(schema, packet){
        logger.log("create a "+ schema.$id, packet);
        delete packet.$$record;
        packet._id = packet.$$objid;
        delete packet.$$objid;
        return await new Promise((resolve, reject) => {
            this.db.insert(packet, (err, newDoc) => {
                if(err) {
                    reject(err);
                    return {success: false}
                }
                newDoc.$$objid = newDoc._id;
                delete newDoc._id;
                resolve(newDoc);
            })
        })
    }

    async read(schema, filter, filterrulesMethod, packet) {
        logger.trace("read from " + schema.$id, packet);

        let cursor = this.db.find(filter);

        if (packet.$$header.skip) {
            cursor.skip(packet.$$header.skip)
        }

        if (packet.$$header.limit) {
            cursor.limit(packet.$$header.limit)
        }

        if (packet.$$header.sort) {
            cursor.sort(packet.$$header.sort)
        }


        let res = await new Promise((resolve, reject) => cursor.exec((err, docs) => {
            if (err) reject(err);
            resolve(docs)
        }));

        //replace id name
        if(this.storage.id) {
            if(filter && filter.$$objid){
                filter[this.storage.id] = filter.$$objid;
                delete filter.$$objid;
            }
        }
        if(filterrulesMethod)
            res = res.filter(filterrulesMethod);

        for(let row of res){
            delete row.$$record;
        }

        return res;
    }

    async count(schema, filter, filterrulesMethod, packet){
        logger.trace("count of "+ schema.$id, packet)
        let result = await this.read(schema, filter, filterrulesMethod, packet);
        return {count: result.length}
    }

    async update(schema, packet, filter, filterrulesMethod){
        logger.log("update "+ schema.$id, {packet, filter, filterrulesMethod})
        let objs = await this.read(schema, filter, filterrulesMethod, packet)

        return {
            value: () => {
                return objs
            },
            action: "update",
            schema: schema,
            packet: packet,
            filter: filter,
            filterrulesMethod: filterrulesMethod
        }

        /*delete packet.$$record;
        delete packet.$$schema;
        delete packet.$$header;
        delete packet._id;
        delete packet.$$objid;
        return await new Promise((resolve, reject)=>this.db.update(filter||{}, {$set: packet}, {multi: true}, (err, numReplaced)=>{
            if(err) reject(err);
            resolve({updated: numReplaced})
        }));*/
    }

    async commit(objs){
        logger.log("commit ...")
        Object.keys(objs.packet).forEach(function (key) {
            if (key.startsWith('$$')) {
                delete objs.packet[key];
            }
        });
        return await new Promise((resolve, reject)=>this.db.update(objs.filter||{}, {$set: objs.packet}, {multi: true}, (err, numReplaced)=>{
            if(err) reject(err);
            resolve({updated: numReplaced})
        }));
    }

    async delete(schema, filter, filterrulesMethod){
        logger.log("delete "+ schema.$id, filter, filterrulesMethod)
        let deleted = await new Promise((resolve, reject) => this.db.remove(filter||{}, {multi: true}, (err, numRemoved) => {
            if(err) reject(err);
            resolve(numRemoved);
        }));
        return {deleted: deleted}
    }


}

module.exports = storage_nedb;
