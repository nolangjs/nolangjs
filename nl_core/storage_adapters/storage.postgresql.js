"use strict";
const {Pool, types} = require('pg');
// ✅ Set this ONCE before creating your pool
// This converts all TIMESTAMP (no timezone) to UTC correctly
types.setTypeParser(1114, (stringValue) => {
    // PostgreSQL returns: '2026-07-15 10:58:18.829'
    // Mark as UTC by appending 'Z'
    return new Date(stringValue + 'Z');
});
const storage_main = require('./storage.main');
const jsonSql = require('json-sql')({
    separatedValues: false,
    dialect: 'postgresql',
    wrappedIdentifiers: true,

});
require('make-promises-safe');
const logger = global.logger;

class storage_postgresql extends storage_main {


    constructor (storage, ssConf){
        super('postgresql');
        this.storage = storage;
    }

    async initPostgresql(){
        if(this.connection) return;

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
        this.connection = new Pool(config);
        /*await this.connection.connect((err) => {
            if (err) {
                logger.error('connection error postgresql')
                logger.error(err.message)
                logger.error(err.stack)
            } else {
                logger.trace("inited postgresql");
            }
        })*/
    }

    async query(sql){
        if(this.storage.log)
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

        try {
            return await this.connection.query(sql);
        } catch(err){
            logger.error(err);
            return err;
        } finally {
            // this.connection.release();
        }
        // logger.log(result)
        // this.connection.end();
        // return result;
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
            let result = await this.query(sql.query.slice(0,-1) + ' RETURNING *');

            if(result.name==='error'){
                return {success: false, message: result.detail || result.message};
            }

            return {
                success: true,
                message: "ADDED " + result?.rowCount + " " + table,
                $$objid: result.rows[0][this.storage.id || 'id']
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

    async readX(schema, packet, filter, filterrulesMethod, count, nojoin) {
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
            if (!nojoin && field.$$rel && field.$$rel.join) {
                hasJoin = true;
                join[field.$$rel.schema] = {
                    on: {
                        [field.$$rel.schema+'.'+field.$$rel.key]: f
                    }
                };
                //selField = field.$$rel.schema + '.' + field.$$rel.return + ' AS ' + (field.title || (field.$$rel.schema + '_' + field.$$rel.return))
                selField =
                    [
                        {
                            table: table,
                            name: f
                        },
                        {
                            table: field.$$rel.schema,
                            name: field.$$rel.return,
                            alias: (field.$$rel.alias || (field.$$rel.schema + '_' + field.$$rel.return))
                        }
                    ]
            } else if(field.type === 'virtual') {
                selField = field.field;
            } else {
                //selField = table + '.' + f;
                selField = {table: table, name: f};
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
                fields.push({table: table, name: table_id});
            }
        }

        if(count){
            fields = [{
                func: {
                    name: 'count',
                    args: [{field: '*'}]
                }
            }]
        }

        let _filter = {};
        if(filter){
            _filter = {...filter};
            if(_filter.$$objid) {
                _filter[this.storage.id] = _filter.$$objid;
                delete _filter.$$objid;
            }
        }

        let jsql = jsonSql.build({
            type: 'select',
            table: table,
            fields: fields,
            condition: _filter,
            join: hasJoin ? join : undefined,
            limit: packet.$$header.limit,
            offset: packet.$$header.skip,
            sort: packet.$$header.sort,
            group: packet.$$header.group || this.storage.aggregate
        });



        let sql = jsql.query;//.replace(/"/g, '');
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
        let objs = await this.readX(schema, packet, filter, filterrulesMethod, false, true);

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

        let _filter = {};
        if(filter){
            _filter = {...filter};
            if(_filter.$$objid) {
                _filter[this.storage.id] = _filter.$$objid;
                delete _filter.$$objid;
            }
        }

        let sql = jsonSql.build({
            type: 'remove',
            table: table,
            condition: _filter
        });

        sql = sql.query;//.replace(/"/g, '');

        let result = await this.query(sql);

        if(result.name==='error'){
            return {success: false, message: result.detail || result.message};
        }

        return {success: true, deletedCount: result.rowCount};
    }

    async commit(obj) {
        // let collection = obj.schema.$id;
        // let MyCollection = this.db.collection(collection);

        let _filter = {};
        if(obj.filter){
            _filter = {...obj.filter};
            if(_filter.$$objid) {
                _filter[this.storage.id] = _filter.$$objid;
                delete _filter.$$objid;
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
            condition: _filter
        });

        sql = sql.query;//.replace(/"/g, '');

        let result = await this.query(sql);

        if(result.name==='error'){
            return {success: false, message: result.detail || result.message};
        }
        logger.trace("committed" + result);
        return {success: true, rows: result.rowCount};
    }
}

module.exports = storage_postgresql;

