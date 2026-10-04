"use strict";
const storage_main = require('./storage.main');
const jsonSql = require('json-sql')({
    separatedValues: false,
    dialect: 'sqlite',
    wrappedIdentifiers: false
});
require('make-promises-safe');
const { isAbsolute, join } = require("path");
const logger = global.logger;

// ============================================================
//  Runtime-agnostic SQLite driver adapter
// ============================================================
const isBun = typeof globalThis.Bun !== "undefined";

function loadSqliteDriver() {
    if (isBun) {
        // Bun runtime — built-in bun:sqlite
        const { Database } = require("bun:sqlite");
        return { Driver: Database, runtime: "bun" };
    }

    const nodeVersion = process.versions.node;
    const [major, minor] = nodeVersion.split(".").map(Number);

    if (major > 22 || (major === 22 && minor >= 5)) {
        // Node.js 22.5+ — built-in node:sqlite (DatabaseSync)
        const { DatabaseSync } = require("node:sqlite");
        return { Driver: DatabaseSync, runtime: "node" };
    }

    throw new Error(
        `Unsupported runtime: Node.js ${nodeVersion}. ` +
        `Please use Node.js >= 22.5.0 or Bun >= 1.0.0.`
    );
}

const { Driver: SqliteDriver, runtime: SQLITE_RUNTIME } = loadSqliteDriver();
logger.trace(`sqlite driver loaded for runtime: ${SQLITE_RUNTIME}`);
// ============================================================


/**
 * Normalize the differences between bun:sqlite and node:sqlite
 * so the rest of the class can use a single API.
 *
 * Differences handled:
 *   - bun:sqlite Database requires { create: true } to auto-create file
 *   - node:sqlite DatabaseSync requires { open: true } and creates file by default
 *   - node:sqlite has no .pragma() method → we implement it via .exec()
 *   - node:sqlite .run() returns { changes, lastInsertRowid }
 *     bun:sqlite .run() returns { changes, lastInsertRowid }  (same keys)
 */
function openDatabase(path, driver) {
    if (SQLITE_RUNTIME === "bun") {
        // bun:sqlite creates the file if it doesn't exist by default
        return new driver(path, { create: true });
    }
    // node:sqlite (DatabaseSync) — creates the file if it doesn't exist
    const db = new driver(path);

    // Emulate better-sqlite3 / bun:sqlite's .pragma() method
    if (typeof db.pragma !== "function") {
        db.pragma = function (pragmaString) {
            const stmt = this.prepare(`PRAGMA ${pragmaString}`);
            // PRAGMA statements that return a value use .get(), others use .run()
            try {
                const row = stmt.get();
                return row ? Object.values(row)[0] : undefined;
            } catch (e) {
                // Some pragmas (e.g. journal_mode = WAL) need to be executed
                this.exec(`PRAGMA ${pragmaString}`);
                return undefined;
            }
        };
    }

    return db;
}


class storage_sqlite extends storage_main {

    constructor(storage, ssConf) {
        super('sqlite');
        this.storage = storage;
        let config = {
            path: this.storage.path,
        };
        let path = this.path = isAbsolute(this.storage.path)
            ? storage.path
            : join(global.appPath, storage.path);
        if (!path) {
            throw new Exception("No path in storage ");
        }
        this.db = openDatabase(path, SqliteDriver);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.db.pragma('busy_timeout = 5000');

        logger.trace("inited sqlite");
    }

    query(sql) {
        logger.log(sql);
        let rows = this.db.prepare(sql).run();
        return rows;
    }

    async create(schema, packet) {
        await super.create(schema, packet);
        let table = this.storage.table || schema.$id;

        delete packet.$$record;
        delete packet.$$objid;

        let sql = jsonSql.build({
            type: 'insert',
            table: table,
            values: packet
        });

        try {
            let result = this.db.prepare(sql.query).run();

            return {
                message: "ADDED 1 row in " + table,
                newId: result?.lastInsertRowid,
            };
        } catch (e) {
            logger.error(e);
            return {
                error: e.message
            };
        }
    }

    async read(schema, filter, filterrulesMethod, packet) {
        super.read(schema, filter, filterrulesMethod);
        return await this.readX(schema, packet, filter, filterrulesMethod, false);
    }

    async count(schema, filter, filterrulesMethod, packet) {
        super.count(schema, filter, filterrulesMethod);
        return await this.readX(schema, packet, filter, filterrulesMethod, true);
    }

    async readX(schema, packet, filter, filterrulesMethod, count) {
        let table = this.storage.table || schema.$id;
        let fields = [];

        // join
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
                selField = field.$$rel.schema + '.' + field.$$rel.return + ' AS ' + (field.title || (field.$$rel.schema + '_' + field.$$rel.return));
            } else {
                selField = table + '.' + f;
            }
            fields.push(selField);
        }

        if (this.storage.fields?.length > 0)
            fields = this.storage.fields;

        if (packet.$$header.fields?.length > 0)
            fields = packet.$$header.fields;

        let table_id = this.storage.id;
        if (table_id) {
            if (fields.indexOf(table_id) === -1) {
                fields.push(table_id);
            }
        }

        if (count) {
            fields = ['count(*)'];
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

        logger.log(sql);

        let rows = this.db.prepare(sql).all();

        // add $$objid to all objects of return collection using _id
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
                        logger.error(e);
                        logger.error(item[f]);
                    }
                }
            });
        } else {
            logger.error(`ERROR: there is No id in storage "${table}"`);
        }

        if (filterrulesMethod)
            rows = rows.filter(filterrulesMethod);

        return rows;
    }

    async update(schema, packet, filter, filterrulesMethod) {
        super.update(schema, packet, filter, filterrulesMethod);
        let objs = await this.read(schema, filter, filterrulesMethod, packet);

        objs.map((obj) => {
            // obj = obj.merge(packet)
            obj = Object.assign(obj, packet);
        });

        let _objs = {
            value: () => { return objs; },
            action: "update",
            schema: schema,
            packet: packet,
            filter: filter,
            filterrulesMethod: filterrulesMethod
        };

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

        let result = this.db.prepare(sql).run();

        // NOTE: fixed "affectedRows" → "changes"
        // (better-sqlite3, bun:sqlite, and node:sqlite all use `.changes`)
        return result.changes + " object DELETED FROM " + table;
    }

    async commit(obj) {
        var collection = obj.schema.$id;
        // let MyCollection = this.db.collection(collection);
        if (obj.filter) {
            if (obj.filter.$$objid) {
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

        let result = this.db.prepare(sql).run();
        logger.trace("committed" + result);
    }

    gracefulShutdown() {
        console.log('Closing database connection...');
        this.db.close(); // This safely flushes pending writes and checkpoints the WAL
        console.log('Database closed.');
        process.exit(0);
    }

    // process.on('SIGINT', gracefulShutdown);
    // process.on('SIGTERM', gracefulShutdown);

}

module.exports = storage_sqlite;
