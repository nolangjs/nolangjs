"use strict";
const fs = require('fs');
const {join} = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Memory = require('lowdb/adapters/Memory');
const storage_main = require('./storage.main');
const logger = global.logger;

class storage_lowdb extends storage_main {

    constructor (storage, ssConf){

        if(storage.adapter === "memory") {
            super('memory');
            this._mode = 'memory';
            this.db = low(new Memory());
            this.db.defaultValue = {};
        } else {
            super('file');
            this._mode = 'file';

            //TODO not require ssConf hear
            // var ssServerConf = require('../ssconf/ss.server.conf.json');
            // var ssConf = require('../ssapps/app1/conf/ss.app.conf.json');

            //path of db file
            let path = this.path = join(global.appPath,storage.path);
            if(!path){
                throw new Exception("No path in storage ");
            }
            /*if(path.startsWith("@appdata/")){//TODO change all words starts with @ with equivalent in ssConf or ssServerConf
                path = ssServerConf.appsdir.substr(1) + ssConf.appdir + ssConf.datadir + path.replace("@appdata/", "/");
                // path = "./ssapps/app1/data/data.json";
            }*/
            /*try {
                usefile = require( dir + "/" + use);
            }catch (e){
                logger.error('could not find ' + use)
            }*/
            this.db = low(new FileSync(path));
        }

        this.storage = storage;

        /*var collection = schema.$id;
        var s = "{ "+collection+": [] }";
        this.db.defaults(JSON.parse(s))
            .write()*/
    }

    async create(schema, packet){
        await super.create(schema, packet);
        const collection = schema.$id;

        const s = '{ "' + collection + '": [] }';
        this.db.defaults(JSON.parse(s)).write();

        //write new obj to collection
        this.db.get(collection).push(packet).write();
        /*return {
            message : "ADDED "+collection+" "+packet.$$objid,
            newId: packet.$$objid,
            success: true
        };*/
        // return this.db.get(collection).find({"$$objid":id}).value()
        return packet;
    }

    async read(schema, filter, filterrulesMethod) {
        await super.read(schema, filter, filterrulesMethod);
        const collection = schema.$id;

        //TODO need logs
        let all = await this.db.get(collection);
        let res = all;
        //replace id name
        if(this.storage.id) {
            if(filter && filter.$$objid){
                filter[this.storage.id] = filter.$$objid;
                delete filter.$$objid;
            }
        }
        if(filter)
            res = all.filter(filter);
        if(filterrulesMethod)
            res = res.filter(filterrulesMethod);

        for(let row of res){
            delete row.$$record;
        }

        return res.value();
    }

    async count(schema, filter, filterrulesMethod) {
        let result = await this.read(schema, filter, filterrulesMethod);
        return {count: result.length}
    }

    async update(schema, packet, filter, filterrulesMethod) {
        await super.update(schema, packet, filter, filterrulesMethod);
        const collection = schema.$id;


        let objs = this.db.get(collection).filter(filter);
        if(filterrulesMethod)
            objs = objs.filter(filterrulesMethod);

        //TODO change delete place
        // delete packet.$$filter;
        // delete packet.$$objid; //deleted before in ss.compiler

        objs.value().map(function (obj) {
            // obj = obj.merge(packet)
            obj = Object.assign(obj, packet);
        });


        return objs;
    }

    async delete(schema, filter, filterrulesMethod) {
        await super.delete(schema, filter, filterrulesMethod);
        const collection = schema.$id;

        //TODO need logs
        //this.db.get(collection).remove(filter).write();
        let res = this.db.get(collection);
        res = res.remove(filter);
        if(filterrulesMethod)
            res = res.remove(filterrulesMethod);
        res.write();
        return { message:"DELETED FROM "+collection, success: true};
    }

    commit(obj) {
        obj.write();
        logger.log("committed");
    }
}

module.exports = storage_lowdb;
