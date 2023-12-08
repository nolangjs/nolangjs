"use strict";
const fs = require('fs');
const Mongo = require('mongodb');
const MongoClient = Mongo.MongoClient;
// const assert = require('assert');
const storage_main = require('./storage.main');
const logger = global.logger;

let mongod;

class storage_mongodb extends storage_main {

    constructor(storage, ssConf) {
        super('mongodb');
        this.storage = storage;
    }

    async initMongo() {
        if (!mongod) {
            console.time("initMongo1");
            this.client = await MongoClient.connect(this.storage.url, {maxPoolSize: 100, useNewUrlParser: true});
            console.timeEnd("initMongo1");

            console.time("initMongo2");
            this.db = this.client.db(this.storage.database);
            mongod = this.db;
            console.timeEnd("initMongo2");
        } else {
            this.db = mongod;
        }
    }

    async create(schema, packet) {
        super.create(schema, packet);
        const collection = schema.$id;

        await this.initMongo();

        //insert new obj to collection
        let db = this.db;

        //delete $$record
        delete packet.$$record;
        delete packet.$$objid;

        // var newId;

        let ins = await this.db.collection(collection).insertOne(packet
            /*, function(err, result){
            if (err)
                throw err;
            newId = result.insertedId.toString();
            packet.$$objid = newId;
            console.log("1 document inserted" + packet._id);
            //db.close();
        }*/);
        let newId = ins.insertedId.toString();
        packet.$$objid = newId;
        /*console.log("1 document inserted" + newId);
        return {
            message : "ADDED "+collection+" "+newId,
            newId: newId,
            success: true
        };*/
        return packet;
    }

    async read(schema, filter, filterrulesMethod, packet) {
        await super.read(schema, filter, filterrulesMethod);
        // const collection = schema.$id;

        await this.initMongo();

        console.time('mongoCollection')
        // let MyCollection = this.db.collection(collection);
        console.timeEnd('mongoCollection')

        if (filter) {
            if (filter.$$objid) {
                filter._id = Mongo.ObjectID(filter.$$objid);
                delete filter.$$objid;
            }
        }

        let options = {};

        if (packet.$$header.sort) {
            options.sort = packet.$$header.sort
        }

        console.time("mongoFind");
        let result;
        if (this.storage.aggregate) {
            result = await this.db.collection(this.storage.collection || schema.$id).aggregate(this.storage.aggregate.pipeline).toArray();
        } else {
            result = await this.db.collection(schema.$id).find(filter, options).skip(parseInt(packet.$$header.skip||0)).limit(parseInt(packet.$$header.limit||0)).toArray();
            result.map((item, index) => {
                item.$$objid = item._id.toHexString();
                delete item._id;
            });
        }
        console.timeEnd("mongoFind");

        //add $$objid to all objects of return collection using _id
        console.time("mongoMap");

        console.timeEnd("mongoMap");

        if(filterrulesMethod)
            result = result.filter(filterrulesMethod);

        return result;
    }

    async count(schema, filter, filterrulesMethod) {
        await super.count(schema, filter, filterrulesMethod);
        // const collection = schema.$id;

        await this.initMongo();

        if (filter) {
            if (filter.$$objid) {
                filter._id = Mongo.ObjectID(filter.$$objid);
                delete filter.$$objid;
            }
        }

        console.time("mongoCount");
        let result = await this.db.collection(schema.$id).countDocuments(filter);
        console.timeEnd("mongoCount");

        return {count: result};
    }

    async update(schema, packet, filter, filterrulesMethod) {
        await super.update(schema, packet, filter, filterrulesMethod);
        let objs = await this.read(schema, filter, filterrulesMethod);

        objs.map(function (obj) {
            // obj = obj.merge(packet)
            obj = Object.assign(obj, packet);
        });

        let _objs = {
            value: () => {
                return objs
            },
            action: "update",
            schema: schema,
            packet: packet,
            filter: filter,
            filterrulesMethod: filterrulesMethod
        }


        return _objs;
    }

    async delete(schema, filter, filterrulesMethod) {
        super.delete(schema, filter, filterrulesMethod);
        const collection = schema.$id;

        await this.initMongo();

        let MyCollection = this.db.collection(collection);

        if (filter) {
            if (filter.$$objid) {
                filter._id = Mongo.ObjectID(filter.$$objid);
                delete filter.$$objid;
            }
        }

        const result = await MyCollection.deleteMany(filter);
        return {
            message: result.deletedCount + " object DELETED FROM " + collection
        };
    }

    async commit(obj) {
        const collection = obj.schema.$id;
        await this.initMongo();
        let MyCollection = this.db.collection(collection);
        if (obj.filter) {
            if (obj.filter.$$objid) {
                obj.filter._id = Mongo.ObjectID(obj.filter.$$objid);
                delete obj.filter.$$objid;
            }
        }

        delete obj.packet.$$record;
        logger.trace("UPDATING mongo", {packet:obj.packet, filter: obj.filter})
        if (obj.filter === {}) {
            logger.error('preventing to update without any filter')
            return
        }
        let result = await MyCollection.updateMany(obj.filter, {$set: obj.packet});
        logger.log("committed" + result);
    }
}

module.exports = storage_mongodb;

