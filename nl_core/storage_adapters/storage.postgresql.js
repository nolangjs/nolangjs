"use strict";
const {Client} = require('pg');
const storage_main = require('./storage.main');
const jsonSql = require('json-sql')({
    separatedValues: false,
    dialect: 'postgresql',
    wrappedIdentifiers: false
});
require('make-promises-safe');
const logger = global.logger;

class storage_postgresql extends storage_main {


    constructor (storage, ssConf){
        super('postgresql');
        this.storage = storage;
    }

    initPostgresql(){
        logger.trace("init postgresql");
        let config = {
            host     : this.storage.host,
            user     : this.storage.user,
            port     : this.storage.port,
            password : this.storage.password,
            database : this.storage.database,
            max: this.storage.max || 20,
            // idleTimeoutMillis: this.storage.idleTimeoutMillis || 30000,
            // connectionTimeoutMillis: this.storage.connectionTimeoutMillis || 2000,
        };
        this.connection = new Client(config);
        this.connection.connect((err) => {
            if (err) {
                logger.error('connection error postgresql')
                logger.error(err.message)
                logger.error(err.stack)
            } else {
                logger.trace("inited postgresql");
            }
        })
    }

    async query(sql){
        logger.log(sql);
        await this.initPostgresql();
        // let res;
        /*this.connection.query(sql, function (error, results, fields) {
         if (error) throw error;
         res = results;
         // logger.log('The solution is: ', results[0].solution);
         logger.log('The solution is: ', results.length);
         logger.log(res)
         });*/

        let result = await this.connection.query(sql);
        // logger.log(result)
        this.connection.end();
        return result;
    }


    async create(schema, packet){
        super.create(schema, packet);
        let table = this.storage.table || schema.$id;


        delete packet.$$record;
        delete packet.$$objid;

        let sql = jsonSql.build({
            type: 'insert',
            table: table,
            values: packet
        });

        try {
            let result = await this.query(sql.query);

            return {
                message: "ADDED " + result?.rowCount + " " + table,
                newId: result?.rowCount,
            };
        } catch (e) {
            logger.error(e)
            return {
                error: e.message
            }
        }
    }

    async read(schema, filter, filterrulesMethod, packet) {
        // super.read(schema, filter, filterrulesMethod);
        return await this.readX(schema, packet, filter, filterrulesMethod,false);
    }

    async count(schema, filter, filterrulesMethod, packet) {
        // super.count(schema, filter, filterrulesMethod);
        return await this.readX(schema, packet, filter, filterrulesMethod,true);
    }

    async readX(schema, packet, filter, filterrulesMethod, count) {
        let table = this.storage.table || schema.$id;
        let fields = [];
        /*if(schema.properties) {
            fields = Object.keys(schema.properties);
        }*/


        //add table. to each field
        /*for(let f=0; f<fields.length; f++) {
            fields[f] = table+'.'+fields[f];
        }*/

        //join
        let join = {};
        let hasJoin = false;
        for (let f in schema.properties) {
            let field = schema.properties[f];
            let selField = null;
            if (field.$$rel && field.$$rel.join) {
                hasJoin = true;
                join[field.$$rel.schema] = {
                    on: {
                        [field.$$rel.key]: f
                    }
                };
                selField = field.$$rel.schema + '.' + field.$$rel.return + ' AS ' + (field.title || (field.$$rel.schema + '_' + field.$$rel.return))
            } else {
                selField = table + '.' + f;
            }
            fields.push(selField);
        }

        if (this.storage.fields && this.storage.fields.length > 0)
            fields = this.storage.fields;

        if (packet.$$header.fields && packet.$$header.fields.length > 0)
            fields = packet.$$header.fields;

        let table_id = this.storage.id;
        if (table_id) {
            if (fields.indexOf(table_id) === -1) {
                fields.push(table_id);
            }
        }

        if(count){
            fields = ['count(*)']
        }

        let jsql = jsonSql.build({
            type: 'select',
            table: table,
            fields: fields,
            condition: filter,
            join: hasJoin ? join : undefined,
            limit: packet.$$header.limit,
            offset: packet.$$header.skip,
            sort: packet.$$header.sort
        });

        let sql = jsql.query.replace(/"/g, '');
        let values = jsql.values;
        for (let p in values) {
            sql = sql.replace('$' + p, "'" + values[p] + "'");
        }

        let rows = await this.query(sql);
        rows = rows.rows;
        //add $$objid to all objects of return collection using _id
        if (table_id) {
            rows.map((item, index) => {
                item.$$objid = item[table_id];
                // delete item[table_id];

                for (let f in item) {
                    try {
                        if (typeof f == 'string' && schema.properties[f]?.type === 'object') {
                            item[f] = JSON.parse(item[f]);
                        }
                    } catch (e) {
                        logger.error(e)
                        logger.error(item[f])
                    }
                }


            });
        } else {
            logger.error(`ERROR: there is No id in storage "${table}"`);
        }

        if(filterrulesMethod)
            rows = rows.filter(filterrulesMethod);

        return rows;
    }

    async update(schema, packet, filter, filterrulesMethod) {
        // await super.update(schema, packet, filter, filterrulesMethod);
        let objs = await this.read(schema, filter, filterrulesMethod, packet);

        delete packet.$$schema;
        delete packet.$$header;
        delete packet.$$record;

        objs.map(function (obj) {
            // obj = obj.merge(packet)
            obj = Object.assign(obj, packet);
        });

        let _objs = {
            value : ()=> {return objs},
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
        let table = this.storage.table || schema.$id;

        let sql = jsonSql.build({
            type: 'remove',
            table: table,
            condition: filter
        });

        sql = sql.query.replace(/"/g, '');

        let result = await this.query(sql);


        return result.deletedCount + " object DELETED FROM "+collection;
    }

    async commit(obj) {
        // let collection = obj.schema.$id;
        // let MyCollection = this.db.collection(collection);
        if(obj.filter){
            if(obj.filter.$$objid) {
                obj.filter[this.storage.id] = obj.filter.$$objid;
                delete obj.filter.$$objid;
            }
        }

        delete obj.packet.$$record;
        delete obj.packet.$$schema;
        delete obj.packet.$$header;

        let table = this.storage.table || obj.schema.$id;
        let fields = this.storage.fields || '*';

        let sql = jsonSql.build({
            type: 'update',
            table: table,
            modifier: obj.packet,
            condition: obj.filter
        });

        sql = sql.query.replace(/"/g, '');

        let result = await this.query(sql);
        logger.trace("committed" + result);
    }
}

module.exports = storage_postgresql;

