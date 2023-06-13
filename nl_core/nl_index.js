#! /usr/bin/env node

//index file for running a nolang app

//enable json5 require
require('json5/lib/register');

require('make-promises-safe');

//Ajv
const Ajv = require('ajv');
const addFormats = require("ajv-formats");
const localize = require('ajv-i18n');

//JsonLogic
const jsonLogic = require("json-logic-js");

//uuid
const uuid = require('uuid-random');

//cron
const cron = require('node-cron');

//logger
const nl_logger = require('./nl_logger');
const logger = new nl_logger();
global.logger = logger;

//starting Nolang compile
logger.debug("$$ running Nolang compiler $$");


/*//cache
const nl_cache = require('./nl_cache');
const _nl_cache = new nl_cache(() => {
    logger.log('Redis client connected');
    _nlCompiler.nlCompile();
}, () => {
    logger.log('Something went wrong in caching');
})*/


//uuid
// const uuid = require('uuid-random');
//lodash
// var _ = require('lodash');

//glob, path
/*const glob = require('glob')
    , path = require('path');*/
const path = require('path');

const fs = require('fs');


//seashell operators
// jsonLogic.add_operation("size", );

//logger
// const winston = require('winston');

const ST = require('stjs');

// //global settings and files
// const ssServerConf = require('../ssconf/ss.server.conf.json');
const entitySchema = require('../basic_schemas/nolang.entity.schema.json');
const appSchema = require('../basic_schemas/nolang.app.schema.json');
// const ss_modules = ssServerConf.ss_modules;

// let sook;
// let sookid;
// let sockio;

function getAppName() {
    //name of package file
    const appName = process.argv[3] || 'app.nolang.json5';

    if (process.argv[2]) {
        global.appPath = path.resolve(process.argv[2]);
    } else {
        global.appPath = process.cwd();
    }
    return appName;
}

function getAppConf(appName) {
    // logger.info("$$ finding app root ", global.appPath);

    //appConf load configuration
    const appConf = require(path.join(global.appPath, appName));
    return appConf;
}

class nlCompiler {

    loadedSchemas = [];
    compiledSchemas = [];
    conf = {};
    listeners = {};
    inited = false;
    adapters = {};



    constructor () {
        this.nlCompile();
    }

    /*constructor (/!*theapp_, server*!/) {
        ///this.iii = 0;
        // let theapp = JSON.parse(JSON.stringify(theapp_));//todo delete

        this.loadedSchemas = [];
        this.compiledSchemas = [];
        this.conf = {};

        /!** todo define listeners
         * listeners
         * {
         *     "schema id":[
         *         {
         *             "header": {},
         *             "listener": listener Function
         *         }
         *     ]
         * }
         * @type {{}}
         *!/
        this.listeners = {};


        // this.appvars = {};
        //
        // this.routing = {};//todo move to apis
        //ssConf routing
        // let appdir = theapp.appdir;
        // if (appdir.startsWith('@apps/')) {
        //     appdir = ssServerConf.appsdir + appdir.replace('@apps/', '');
        // }
        // this.approot = appdir;
        // try {
        //     let _ssConf = require(this.approot + '/conf/ss.app.conf.json');
        //     this.ssConf = {... _ssConf};
        //     //override configuration:
        //     if(theapp.overrideconf){
        //         for(let k in theapp.overrideconf) {//todo change with Object.assign
        //             _.set(this.ssConf, k, theapp.overrideconf[k]);
        //         }
        //     }
        // } catch (e) {
        //     console.error('start of application ' + theapp.name + ' failed.\n' + e);
        //     return;
        // }
        //
        // //setting appvars
        // if (this.ssConf.appvars)
        //     Object.assign(this.appvars, this.ssConf.appvars);
        //todo move to apis
        // if(this.appvars && this.appvars.usesocket)
        //     this.setSocketio(theapp, server);
        //
        // //setting routing
        // if (this.ssConf.routing)
        //     Object.assign(this.routing, this.ssConf.routing);

        // //check i18n todo
        // if (this.ssConf.i18n) {
        //     this.appvars.i18n = this.ssConf.i18n;
        // }

        /!*!//logger routing todo move to log
        this.logdir = this.approot + this.ssConf.logdir;

        console = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            transports: [
                //
                // - Write to all logs with level `info` and below to `combined.log`
                // - Write all logs error (and below) to `error.log`.
                //
                new winston.transports.File({filename: this.logdir + 'error.log', level: 'error'}),
                new winston.transports.File({filename: this.logdir + 'combined.log'})
            ]
        });

        // If we're not in production then log to the `console` with the format:
        // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
        //
        if (process.env.NODE_ENV !== 'production') {
            console.add(new winston.transports.Console({
                format: winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                })
            }));
        }*!/


        //todo test
        // this.schemas = this.approot + this.ssConf.schemas;
        // this.testdir = this.approot + this.ssConf.testdir;


        // let thes = this;todo remove
        //
        // //index file content
        // let filePath = path.join(__dirname + "/"+ this.approot+"/views/index.html");
        //
        // fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
        //     if (!err) {
        //         //console.log('received data: ' + data);
        //         thes.index_html = data;
        //         /!*response.writeHead(200, {'Content-Type': 'text/html'});
        //          response.write(data);
        //          response.end();*!/
        //     } else {
        //         console.log(err);
        //     }
        // });

        //call ssCompile
        // this.nlCompile(); instead run at Redis connect


        //todo move to test
        // if (process.env.NODE_ENV !== 'production') {
        //     if (thes.ssConf.asserttest) {
        //         setTimeout(function () {
        //             //call assertion
        //             console.log('Start asserting:');
        //             thes.ssAssert();
        //         }, 2000);
        //     }
        //
        // }


        this.nlCompile();
    }*/

    nlCompile() {
        // redisClient.flushall();

        this.loadedSchemas = [];
        logger.info("run ssCompile");

        //init ajv
        this.initAjv();

        let compileReturn = {
            messages: [],
            errors: []
        };

        let thes = this;

        // //todo bad substr
        // let schemafiles = this.schemas.substr(3) + '/**/*.{json,json5}';
        // glob.sync(schemafiles).forEach(function (file) {
        //     thes.validateCompileSchema(file, compileReturn);
        // });
        //
        //
        // //watch to changes to compile automatically
        // if(thes.ssConf.changewatch) {
        //     // Initialize watcher.
        //     let watcher = chokidar.watch(schemafiles, {
        //         ignored: /(^|[\/\\])\../,
        //         persistent: true
        //     });
        //     let log = console.log.bind(console);
        //     // Add event listeners.
        //     watcher
        //         // .on('add', path => log(`File ${path} has been added`))
        //         .on('change', path => {
        //             log(`File ${path} has been changed`);
        //             thes.validateCompileSchema(path, compileReturn, true/*force*/);
        //         })
        //         .on('unlink', path => log(`File ${path} has been removed`));
        // }

        //new :
        //app root is
        // const appPath = process.argv[2] || process.cwd();
        // console.log(process.argv,process.cwd(), __dirname);

        const appName = getAppName();

        // global.appPath = path.join(__dirname, appPath);

        const appConf = getAppConf(appName);

        logger.debug('app nolang file loaded', appConf);

        //validating appConf
        let _ajv = new Ajv({
            jtd: true,
            schemaId:"$id"
        });
        addFormats(_ajv);
        _ajv.addSchema(entitySchema);
        let confIsValid = _ajv.validate(appSchema, appConf);
        if(!confIsValid){
            logger.error('ERROR',appName,'is not valid',_ajv.errors);
            return ;
        }
        logger.log(appName, 'is valid');

        this.conf = appConf;


        //cache
        if(appConf.redis) {
            const nl_cache = require('./nl_cache');
            this._nl_cache = new nl_cache(appConf.redis, () => {
                logger.log('Redis client connected');
                // _nlCompiler.nlCompile();
            }, () => {
                logger.log('Something went wrong in caching');
            })
        } else {
            logger.warn('No Redis set')
        }


        //log options
        if(appConf.logger) {
            logger.setOptions(appConf.logger);
        }

        logger.debug('loading schemas');

        //create schemas loader factory to create proper schema loader and load schemas
        const schema_loader_factory = require('./schema_loader/schema_loader_factory');

        //load builtin schemas
        /*this.schema_loader = */new schema_loader_factory( {
            adapter: 'file',
            path: path.join( __dirname,'../nl_modules/**/*.{json,json5}')
        }, (schema, filename, force)=>{
            thes.validateCompileSchema(schema, filename, compileReturn, force);
        });

        //load schemas of app
        /*this.schema_loader = */new schema_loader_factory( appConf.schemas, (schema, filename, force)=>{
            // console.log(filename, schema, force);
            thes.validateCompileSchema(schema, filename, compileReturn, force);
        });

        //create endpoints to connect nolang to outside , nl_endpoint_method
        const nl_endpoint_factory = require('./endpoints/nl_endpoint_factory');
        this.nlef = new nl_endpoint_factory( appConf.endpoints, this.runPacket.bind(this), appConf.schemas?.watch);

        ///new.

        //microservices
        if(appConf.microservices) {
            const nl_microservice_factory = require('./microservice_clients/nl_microservice_factory');
            const nlms = new nl_microservice_factory( appConf.microservices);
            this.runMicroservice = nlms.runMicroservice.bind(nlms);
        }


        logger.info( "End of nlCompile");
        return compileReturn;
    }

    /*setSocketio(app,server){
        console.log('setSocketio:'+app.name);
        let onlineusers = 0;
        sockio = require('socket.io')(server);

// var io = iox.of('/socket');//rooming

        let thes = this;
        sockio.on('connection', function(socket){
            sook = socket;
            sookid = socket.id;
            console.log("socket connected "+sookid);
            onlineusers++;
            /!*!/socket.broadcast.emit('onlineusers', onlineusers);
            /!*socket.broadcast.emit('chat message','hi');
            socket.on('chat message', function(msg){
                console.log('message: ' + msg);
                io.emit('chat message', msg);
                // socket.broadcast.emit(msg);
            });*!/
            console.log('a user connected');

            socket.on('joinme', function(roomname){
                console.log('socket '+socket.id + ' joined to room '+ 'room-'+roomname);
                socket.join('room-'+roomname);
            });

            socket.on('whoami', async function (data) {
                console.log('whoami : '+socket.id);
                console.log(data);

                if(data.token){
                    let u = thes.readToken(data.token);
                    console.log("Token:");
                    console.log(u);
                    if(u.id){
                        socket.join(u.id);
                    }
                    //TODO need roles with sum other conditions, because role is global
                    if(u.roles) {
                        for (let role of u.roles) {
                            socket.join(role.roleId);
                        }
                    }
                }
                else if(data.SMSKEY){//means sms received before and saved in redis wait to user be online again
                    console.log('SMSKEY='+data.SMSKEY);
                    let logindata = await redisClient.get('room-'+data.SMSKEY);
                    if(logindata){
                        console.log('previously in redis');

                        socket.emit('login', JSON.parse(logindata));
                    } else {//means user is online and is waiting for receiving sms
                        socket.join('room-' + data.SMSKEY);
                        console.log('join to room '+ 'room-' + data.SMSKEY);
                    }
                }
            });




            socket.on('disconnect', function(){
                console.log('user disconnected');
                onlineusers--;
            });

            socket.emit('whoareyou');
        });
    }*/

    initAjv() {
        this.ajv = new Ajv(
            {
                jtd: true, ///very very important
                schemaId: '$id',
                $data: true,
                removeAdditional: false,
                strictSchema: false,
                // v5: true,
                allowUnionTypes: true,
                allErrors: false,
                // errorDataPath: 'property',
                verbose: false,
                // missingRefs: "fail",
                // unknownFormats: 'ignore',
                multipleOfPrecision: 12,
                // extendRefs: true,
                // passContext: true,
                strictTypes: false,
                i18n: false
            }
        ); // options can be passed, e.g. {allErrors: true}
        // ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
        addFormats(this.ajv);

        //first compile master schema
        this.validator = this.ajv.compile(entitySchema);

        //add custom keywords

        const thes = this;

        this.ajv.addKeyword('$$rules', {
            // type: 'object',
            compile: function (rules, parentSchema) {
                /*console.log(rules);
                 console.log(parentSchema);
                 console.log(jsonLogic.apply( rules[0] , parentSchema));
                 */

                return function (data) {
                    /*console.log("data");
                     console.log(data);
                     console.log(rules[0].ruleDef);*/
                    let allpassed = true;
                    for (let r = 0; r < rules.length; r++) {
                        let rule = rules[r];
                        //checking rules:
                        if(!rule.ruleType || ["check"].indexOf(rule.ruleType)>-1) {

                            // console.info('$$ rule '+rule.ruleId + ' in id ' + parentSchema.$id + ' checking:');
                            let passed = jsonLogic.apply(rule.ruleDef, data);
                            if (!passed) {
                                //todo add error to ajv errors

                                logger.error('$$ rule ' + rule.ruleId + ' in id ' + parentSchema.$id + ' not passed', {rule, data});

                                /*if (this.errors === null)
                                 this.errors = [];
                                 this.errors.push({
                                 keyword: "$$rules",
                                 message: "maxPoints attribute should be " + 0 + ", but is " + 0,
                                 params: {
                                 keyword: "$$rules"
                                 }
                                 });*/
                                allpassed = false;
                            }
                        } else if(["set"].indexOf(rule.ruleType)>-1) {
                            logger.log(data);
                            // data[rule.ruleDef.key] = jsonLogic.apply(rule.ruleDef.value, data)
                            for(let key in rule.ruleDef){
                                data[key] = jsonLogic.apply(rule.ruleDef[key], data);
                                // data[key] = thes.handlePacket(rule.ruleDef[key], data)
                            }
                            logger.log('=================================');
                            logger.log(data);
                        }
                    }
                    return allpassed;
                }
            }
        });

        /*this.ajv.addKeyword('$$roles', {
            // type: 'object',
            /!*sscompile: function (header, parentSchema) {
             // console.log('header');
             // console.log(header);
             //  console.log(parentSchema.$id);
             /!*console.log(jsonLogic.apply( rules[0] , parentSchema));
             *!/

             return function (data) {
             // console.log("data");
             if(data.$$header) {
             console.log(data.$$header);
             console.log(parentSchema.$$roles);
             var user = data.$$header.user;
             var userroles = user.roles;
             var needroles = parentSchema.$$roles;

             }
             return true;
             }
             },*!/
            validate: function (roles, data) {
                /!*if (!data.$$header){
                    thes.logger.warn("no user in header")
                    return true;
                }*!/

                return thes.checkRolesPermission(roles, data);
            },
            errors: true
        });*/

        this.ajv.addKeyword('$$rel', {
            // type: 'object',
            /*sscompile: function (header, parentSchema) {
             // console.log('header');
             // console.log(header);
             //  console.log(parentSchema.$id);
             /!*console.log(jsonLogic.apply( rules[0] , parentSchema));
             *!/

             return function (data) {
             // console.log("data");
             if(data.$$header) {
             console.log(data.$$header);
             console.log(parentSchema.$$roles);
             var user = data.$$header.user;
             var userroles = user.roles;
             var needroles = parentSchema.$$roles;

             }
             return true;
             }
             },*/
            validate: async function (rel, data, parentSchema) {
                let key = rel.return || "SSobjid";
                let returns = await thes.dataPacket({
                    "$$header": {
                        "action": "R",
                        "filter": {
                            [key] : data
                        }
                    },
                    "$$schema": rel.schema
                });

                let exists = returns?.length === 1;
                if(! exists) {
                    logger.error("key not found in parent " + rel.id);
                }
                return exists;
            },
            errors: true
        });

        //add additional keywords

        require('ajv-keywords')(this.ajv/*, ['typeof', 'instanceof']*/);
    }

    ssAssert() {
        //validating tests
        const thes = this;
        glob.sync(this.testdir.substr(3) + '/*.json').forEach(function (file) {
            const testFile = require(path.resolve(file));

            /*var validator = thes.validator(testFile);
            if (!validator) {
                logger.error("$$ invalid schema " + file);
                logger.error(thes.validate.errors);
                if (process.env.NODE_ENV !== 'production') {
                    console.error(thes.validate.errors);
                }
            } else {*/
            thes.assertJson(testFile, file);
            // }
        });

    }

    async callMethod(req_packet) {
        let thes = this;
        try {
            /*if (req_packet.$$import) {
                req_packet = this.ajv.getSchema(req_packet.$$import).schema;
            }*/

            let header = req_packet.$$header;
            let itsSchema = this.ajv.getSchema(req_packet.$$schema).schema;
            // let view = null;
            // let engineaddapter;
            if (header.action === 'M') {
                if(header.method) {
                    let method = itsSchema.$$methods.find(m=>m.name === header.method);
                    if(!method) {
                        return {
                            success: false, message: 'no method '+header.method
                        }
                    } else {
                        //check params
                        if(method.params) {
                            if(!header.params) {
                                return {success: false, message: 'method '+method.name+' needs params!'};
                            }

                            let _ajv = new Ajv(/*{
                                jtd: true,
                                schemaId:"$id"
                            }*/);
                            addFormats(_ajv);

                            let _schema = {
                                type: 'object',
                                properties: method.params,
                                additionalProperties: false
                            };
                            _ajv.addSchema(_schema);
                            let paramsIsValid = _ajv.validate(_schema, header.params);
                            if(!paramsIsValid){
                                return {success: false, message: 'method '+method.name+' params are not matches!', error: _ajv.errors};
                            }
                        }

                        //check handler
                        if(method.jsHandler) {
                            try {
                                //todo need to cache
                                let _jsHandlerPath = method.jsHandler;
                                if(!path.isAbsolute(method.jsHandler)) {
                                    if(itsSchema.filepath) {
                                        _jsHandlerPath = path.join(path.dirname(itsSchema.filepath), method.jsHandler);
                                    } else {
                                        _jsHandlerPath = path.join(global.appPath, method.jsHandler);
                                    }
                                }
                                if(!fs.existsSync(_jsHandlerPath)){
                                    return {success: false, message: 'method '+method.name+', path not exists! '+_jsHandlerPath};
                                }
                                let methodJs = require(_jsHandlerPath);
                                if(!methodJs.hasOwnProperty(method.name)){
                                    return {success: false, message: 'there is not a function with name '+method.name+' in the object returned in file '+_jsHandlerPath};
                                }
                                //didn't return function directly to could place several function in one file
                                methodJs = methodJs[method.name];
                                let thisObj = {
                                    schema: itsSchema,
                                    packet: req_packet,
                                    params: header.params,
                                    endpoint: thes.runPacket
                                };
                                return await methodJs.call(thisObj)
                            } catch (e){
                                return {success: false, message: e.message};
                            }
                        } else if(method.handler){
                            let lastReturn = null;
                            method.handler.map(async function (iPacket) {
                                let deepcopy = {...iPacket};

                                //assigning value parameters
                                if(header.params) {
                                    deepcopy = await thes.handlePacket(deepcopy, header.params);
                                }

                                lastReturn = thes.runPacket(deepcopy);
                            });

                            return lastReturn;
                        } else {
                            return {
                                success: false, message: 'There is no handler in the method '+method.name
                            }
                        }
                    }
                } else {
                    return {
                        success: false, message: 'please specify method name'
                    }
                }
            }

        }catch (e){
        }
    }

    deepEach(obj, callback) {
        for (let key in obj) {
            if( typeof obj[key] === "object" ) {
                this.deepEach(obj[key], callback)
            }

            callback(key, obj);

        }
    }

    async deepEachAsync(obj, callback) {
        for (let key in obj) {
            if( typeof obj[key] === "object" ) {
                await this.deepEachAsync(obj[key], callback)
            }

            await callback(key, obj);
        }
    }

    async renderView(req_packet1, data, env) {
        const _ssCompiler = this;

        let req_packet = {... req_packet1};

        function imagecacher(obj, schema, fieldname, i, parent) {
            for (let field in obj) {
                if (schema.properties[field] && schema.properties[field].type === 'image') {
                    if (obj[field].startsWith('data:image')) {
                        //catch data in server
                        let cacheimg = (parent ? parent.$$objid + '-' : '') +(schema.$$schema || schema.$id || fieldname) + '-' + (obj.$$objid || i) + '-' + field;
                        this._nl_cache.redisClient.setex(cacheimg, 36000, obj[field]);
                        //change url
                        obj[field] = (this.ssConf.domain ? '' : ((this.appvars.appbase || this.ssConf.urlbase) + '/')) + '__catch/' + cacheimg
                    }
                } else if (schema.properties[field] && schema.properties[field].type === 'array') {
                    let i = 0;
                    for(let row of obj[field]) {
                        imagecacher.call(this, row, schema.properties[field].items, field, i, obj);
                        i++;
                    }
                }
            }
        }

        try {
            await this.preparePacket(req_packet, _ssCompiler, data);

            if(req_packet.$$import) {
                req_packet = this.ajv.getSchema(req_packet.$$import).schema;
            }

            let header = req_packet.$$header;
            let Schema = this.ajv.getSchema(req_packet.$$schema);
            if(!Schema){
                logger.error("no schema " + req_packet.$$schema);
                return null;
            }

            let itsSchema = Schema.schema;

            // itsSchema = ST.select({data: data || req_packet, schema: itsSchema}).transformWith(itsSchema).root();
            // await this.calculates(itsSchema, _ssCompiler, data);

            let _view = header?.view;
            let view = null;
            //let engineaddapter;
            // if (header.action == 'W') {
            /*if(! itsSchema.$$views || itsSchema.$$views.length === 0) {
                //throw new Exception("no view exists in " + itsSchema.$id);
                view = {};
            } else {
                if (header && header.channel){
                    view = itsSchema.$$views.find(v => v.channel === header.channel || (v.channel && v.channel.indexOf(header.channel) > -1));
                    if(view == null) {
                        logger.error("no view exists by channel "+ header.channel +" in " + itsSchema.$id);
                        view = itsSchema.$$views[0];
                    }
                } else {
                    view = itsSchema.$$views.find(v => v.default === true);
                    if(view == null){
                        view = itsSchema.$$views[0];
                    }
                }
            }*/
            if(typeof _view === 'object') {
                view = _view;
            } else {
                if(itsSchema.$$views?.length > 0) {
                    if(_view) {
                        view = itsSchema.$$views.find(v => v.viewId === _view);
                    }
                    if(view == null) {
                        view = itsSchema.$$views.find(v => v.default === true) || itsSchema.$$views[0];
                    }
                }
            }

            // let schema = {...itsSchema};
            let schema = JSON.parse(JSON.stringify(itsSchema));
            delete schema.$$storage;
            delete schema.$$rules;
            delete schema.$$roles;

            async function z(schema) {
                await _ssCompiler.deepEachAsync(schema, async function (k, obj) {
                    if(obj[k] && obj[k].$ref) {
                        obj[k] = (_ssCompiler.ajv.getSchema(obj[k].$ref)||{}).schema;
                        await z();
                    }

                    //TODO compile serverside
                    /*if(obj[k].$$rel) {

                    }*/

                    /*if(obj[k].$$import) {
                        obj[k] = _ssCompiler.ajv.getSchema(obj[k].$$import).schema;
                    }

                    if(obj[k].$$header) {
                        obj[k] = await _ssCompiler.dataPacket(obj[k]);
                    }*/
                });
            }

            await z(req_packet);

            let data2 = null;
            if(data && is_Array(data)) {
                data2 = [...data];
                //visible fields
                if ((view && (view.visibleFields || view.hiddenFields)) ||
                    Object.values(itsSchema.properties).find(ff=>ff.$$rel) ) {
                    for (let obj of data2) {
                        for (let field in obj) {
                            if(field === '$$objid') continue;
                            //visible fields
                            if (view.visibleFields && view.visibleFields.indexOf(field) < 0) {
                                delete obj[field];
                            }
                            //hidden fields
                            if (view.hiddenFields && view.hiddenFields.indexOf(field) > -1) {
                                delete obj[field];
                            }
                            //$$rel
                            //fixme if no view exists in script then $$rel will not be handled
                            if(obj[field]) {
                                let rel = schema.properties[field]?.$$rel;
                                if (rel && !rel.join) {
                                    if (rel.cache && this._nl_cache) {
                                        let cacheKey = 'lookups_' + rel.schema + '_' + rel.key;
                                        let isCached = await this._nl_cache.redisClient.get(cacheKey);
                                        if (!isCached) {
                                            this._nl_cache.redisClient.set(cacheKey, 'true', {EX: rel.cache.time || 60});
                                            let vals = await this.dataPacket({
                                                $$schema: rel.schema,
                                                $$header: {
                                                    action: 'R',
                                                    filter: rel.cache.filter,
                                                    fields: [rel.key, rel.return]
                                                }
                                            });
                                            for (let val of vals) {
                                                this._nl_cache.redisClient.set(cacheKey + '_' + val[rel.key], val[rel.return], {EX: rel.cache.time || 60});
                                            }
                                        }
                                        if (isCached) {
                                            obj[field] = await this._nl_cache.redisClient.get(cacheKey + '_' + obj[field]);
                                        }
                                    } else {
                                        let val = await this.dataPacket({
                                            $$schema: rel.schema,
                                            $$header: {
                                                action: 'R',
                                                filter: {
                                                    [rel.key]: obj[field],
                                                    fields: [rel.key, rel.return]
                                                }
                                            }
                                        });
                                        obj[field] = val[0][rel.return]
                                    }
                                }
                            }
                        }
                    }

                }

                if (view && (view.fastLoadImage)) {
                    for (let obj of data2) {
                        imagecacher.call(this, obj, schema);
                    }
                }
            }

            if(view?.engine === 'html') {
                let render_html = require('./view_render/render_html');
                return await render_html(schema, view, data2 || data || req_packet, _ssCompiler, env)
            }

            if(view?.meta)
                return {
                    data: data2 || data || req_packet, //packet of request with data of selected schema
                    schema: schema, //related schema
                    view: view //suitable view
                };
            else
                return data2 || data || req_packet;
        } catch (e) {
            logger.error('$$renderView: '+e);
            logger.error(e.stack || e);
        }
    }

    /*async calculates(req_packet, _ssCompiler, data) {
        /!*if(data){
            req_packet = ST.select(data).transformWith(req_packet).root();
        }*!/
        await this.deepEachAsync(req_packet, async function (k, obj) {
            // console.log('deepeach '+ k)
            if (obj[k] && obj[k].$$calc) {
                let _in = {...obj[k].$$calc.in};
                for (let _i in _in) {
                    if (_in[_i].$$header) {
                        _in[_i] = await _ssCompiler.runPacket(_in[_i]);
                    }
                }
                obj[k].$$calc.in = _in;
                logger.debug(JSON.stringify(obj[k].$$calc));
                obj[k] = jsonLogic.apply(obj[k].$$calc.do, obj[k].$$calc);
                logger.debug('$calc debug', obj[k])
            }
        });
    }*/

    validateCompileSchema(thisSchema, filename, compileReturn, force) {
        logger.log("validate "+ filename);
        // //delete cache of require
        // delete require.cache[path.resolve(file)];
        //
        // const thisSchema = require(path.resolve(file));

        if(thisSchema.$id?.indexOf('.') > 0){
            if(!this.conf.allowdotinschemaid) {
                logger.error(`could not compile schema with id "${thisSchema.$id}", please don't use '.' for $id`);
                return;
            } else {
                logger.warn(`Bad schema id "${thisSchema.$id}", please don't use '.' for $id`);
            }
        }
        const validator = this.validator(thisSchema);
        if (!validator) {
            this.validator.errors.push({"$$message": "$$ invalid schema " + filename});
            logger.error("$$ invalid schema " + filename);
            logger.error(this.validator.errors);
            if (process.env.NODE_ENV !== 'production') {
                logger.error(this.validator.errors);
            }

            /*try {
                localize.fa(this.validator.errors);
            } catch (e) {
                logger.error(e);
            }*/
            compileReturn.errors.push(this.validator.errors);
        } else {
            this.compileSchema(thisSchema, force);
        }

    }


    /**
     * main method which gets command and run it and returns response of Nolang
     * @param req_packet command
     * @param listener if command is a listener this function will be fired if needed
     * @param env some extra variables passed to compile command packet
     * @returns {Promise<*|{error: string}|{}|null|{success: boolean, message: string}|null|undefined>}
     */
    async runPacket(req_packet, listener, env) {
        if(typeof req_packet === 'string'){
            try {
                req_packet = JSON.parse(req_packet)
            } catch (e) {
                return e;
            }
        }
        if(!req_packet) {
            return {error:'No Entry'}
        }
        if(req_packet.$$disable)
            return {};
        else
            delete req_packet.$$disable;

        if(is_Array(req_packet)) {
            let thes = this;
            let lastReturn = null;
            //_.forEach(req_packet, async function (_apacket) {
            //    lastReturn = await thes.runPacket({ ... _apacket});
            //});
            for(let _apacket of req_packet){
                lastReturn = await thes.runPacket({ ... _apacket});
            }

            return lastReturn;
        }

        const _ssCompiler = this;

        /*if (req_packet.$$import) {
            let schema = _ssCompiler.ajv.getSchema(req_packet.$$import);
            if(schema)
                req_packet = schema.schema;
            else {
                return {message:"No Schema "+req_packet.$$import, success: false};
            }
        }*/

        const header = req_packet.$$header;

        if(!header) {
            return {success: false, message: "$$header not exists!", error: 'MISSING_$$HEADER'}
        }

        /** check cache
         * if there is cache in header means cache the reply by cache.key for cache.time seconds in Redis
         */
        if(header?.cache && this._nl_cache) {
            let ckey = header.cache.key || env?.request?.url;
            let cached = await this._nl_cache.redisClient.get(ckey);
            if(cached) {
                logger.trace('using cached value in ' + ckey)
                return JSON.parse(cached);
            }
        }

        /** microservices<br>
         * if there is microservice property in header means this packet must be requested from the microservice endpoint
         */
        if(header?.microservice) {
            let ms = header.microservice;
            delete header.microservice;
            return this.runMicroservice(ms, req_packet);
        }


        //depricated
        // req_packet = this.handlePacket(req_packet, req_packet);

        let Schema = this.ajv.getSchema(req_packet.$$schema);
        if(!Schema){
            logger.error("dataPacket: no Schema "+req_packet.$$schema);
            return {success:false, errorcode: 'SCHEMA_NOT_EXISTS', message: "No Schema with id "+req_packet.$$schema};
        }
        let schema = {...Schema.schema};

        // schema = this.handlePacket(schema, schema);
        let _env = {...env};
        schema = this.preparePacket(schema, {_env, schema: schema});

        //prepare packet
        req_packet = this.preparePacket(req_packet, {_env, data: req_packet, schema: schema});


        let action = header?.action;
        /*if(!action){
            let renderedView = await _ssCompiler.renderViewTemp(req_packet, data_message);
            /!*if (data_message) {
             renderedView.data = data_message;
             }*!/
            return renderedView;
        }*/

        /*if(!action) {
            return {success: false, message: "$$header.action not exists!", error: 'MISSING_$$HEADER.ACTION'}
        }*/

        let data_message;

        if ('M'.indexOf(action) >= 0) {
            data_message = await _ssCompiler.callMethod(req_packet);
            // header = req_packet.data.$$header;
            // action = header.action;
        }

        if ('W'.indexOf(action) >= 0) {
            data_message = req_packet;
        }

        /*//Length of data array
        let returnLength = false;
        if('L'.indexOf(action) >= 0) {
            returnLength = true;
            header.action = 'R';
            action = 'R';
        }*/


        if ('CRUDL'.indexOf(action) >= 0) {
            //do dataPacket
            data_message = await _ssCompiler.dataPacket({...req_packet}, schema);

            //todo, check success
            if(header && header.then && data_message /*&& data_message.success*/) {
                header.then = ST.select(data_message).transformWith(header.then).root();
                if (header.then.$$header) {
                    return _ssCompiler.runPacket(header.then, _env);
                } else if(header.then.$$new) {
                    if(!data_message.$$new)
                        data_message.$$new = {};
                    for(let key in header.then.$$new){
                        data_message.$$new[key] = header.then.$$new[key];
                    }
                }
            }
        }

        /*if(this.appvars && this.appvars.usesocket)
            nlCompiler.checkEmits(req_packet, header, action, data_message);*/

        if(header && header.debug) {
            logger.log('Debug '+ new Date());
            logger.log('command', req_packet);
            logger.log('Response', data_message);
        }

        /*if(returnLength) {
            header.action = 'L';
            data_message = data_message?.length;
        }*/


        //check for push to listeners
        if(this.listeners.hasOwnProperty(req_packet.$$schema)){
            for(let lis of this.listeners[req_packet.$$schema]){
                //check header filter
                let check = true;
                if(lis.header?.filter){

                    for(let key in lis.header.filter) {
                        if(Array.isArray(data_message)){
                            data_message.map(doc=>{
                                check = check && (doc[key] === lis.header.filter[key]);
                            })
                        } else {
                            check = check && (data_message[key] === lis.header.filter[key]);
                        }
                    }
                }
                //todo check filterrules

                if(check && lis.listener.handler) {
                    lis.listener.handler(data_message);
                }
            }
        }

        //add to listeners
        if(header?.listen) {
            if(listener) {
                //init push list for this schema
                if(!this.listeners.hasOwnProperty(req_packet.$$schema)){
                    this.listeners[req_packet.$$schema] = [];
                }
                //add push request
                //todo check if not exists
                this.listeners[req_packet.$$schema].push({
                    // listenerId: uuid(),
                    header: header,
                    listener: listener
                })
            }
        }

        /*if ('WR'.indexOf(action) >= 0) {
            let renderedView = await _ssCompiler.renderViewTemp(req_packet, data_message);
            /!*if (data_message) {
                renderedView.message = data_message;
            }*!/
            return renderedView;
        }*/

        //render view
        if(header?.view) {
            data_message = await this.renderView(req_packet, data_message, _env);
        }

        //set cache
        if(header?.cache && this._nl_cache) {
            this._nl_cache.redisClient.set(header.cache?.key || env?.request?.url, JSON.stringify(data_message), {EX: header.cache.time});
        }

        return data_message;
    }

    preparePacket(req_packet1, values) {

        let req_packet = {...req_packet1};
        //do {{}} signs
        req_packet = ST.select(values).transformWith(req_packet).root();

        /*let thes = this;
        this.deepEach(req_packet, (k,obj)=>{
            if(obj.$$import) {
                obj = thes.ajv.getSchema(obj.$$import).schema;
            }
        })*/

        /*let thes = this;

        this.deepEach(req_packet, (k, obj) => {
            let objk = obj[k];
            // let values = evn;// {...env, this: objk};

            //do $$ handler
            if(typeof objk === 'object'){
                //calculate
                if (objk.$$) {
                    if(typeof objk.$$ === 'object') {
                        obj[k] = jsonLogic.apply(objk.$$, values);
                        logger.debug('$$ debug', objk, values)
                    } else if(typeof objk.$$ === 'string') {
                        obj[k] = jsonLogic.apply({var:objk.$$}, values);
                        logger.debug('$$ debug var', objk.$$, values)
                    }
                }

                /!*!//nested request
                if(objk.$$header) {
                    obj[k] = await thes.runPacket(objk);
                }*!/
            }
        });*/

        return req_packet;
    }

    /*async calculates(req_packet, env) {
        await this.deepEachAsync(req_packet, async function (k, obj) {
            // console.log('deepeach '+ k)
            if (obj[k] && obj[k].$$calc) {
                let _in = {...obj[k].$$calc.in};
                for (let _i in _in) {
                    if (_in[_i].$$header) {
                        _in[_i] = await _ssCompiler.runPacket(_in[_i]);
                    }
                }
                obj[k].$$calc.in = _in;
                logger.debug(JSON.stringify(obj[k].$$calc));
                obj[k] = jsonLogic.apply(obj[k].$$calc.do, obj[k].$$calc);
                logger.debug('$calc debug', obj[k])
            }
        });
    }*/

    getSchema(aschema) {
        let s = this.ajv.getSchema(aschema);
        if(s)
            return s.schema;
        else
            return null;
    }

    /*async renderIndex() {
        if(!this.ssConf.index) {
            console.error('there is no index in configuration of '+this.approot);
            return null;
        }
        let redistime = 1000;
        if(this.ssConf.cache && this.ssConf.cache.redis && this.ssConf.cache.redis.time)
            redistime = this.ssConf.cache.redis.time;
        let req_packet = await this.inRedis((this.appvars.appbase || this.ssConf.appdir)+'indexPacket', redistime, async ()=> {
            let indexfile = require(this.approot + this.ssConf.index);
            let req_packet = JSON.parse(JSON.stringify(indexfile));
            return req_packet;
        });

        let indexpacket = await this.handlePacket(req_packet,req_packet);
        return await this.renderViewTemp(indexpacket);
    }*/

    /*validatePacket(packet) {
        var validator = this.validator(packet);
        if (!validator) {
            console.error("$$ invalid schema " + packet.$id);
            console.error(this.validator.errors);
            if (process.env.NODE_ENV !== 'production') {
                console.error(this.validator.errors);
            }
            return this.validator.errors;
        } else {
            //very important:
            let _schema = packet.$$schema;

            delete packet.$$schema;
            delete packet.$schema;
            delete packet.$$header;

            // ajv.sscompile(json);
            var valid = this.ajv.validate(_schema, packet);
            if (!valid) {
                console.error("error in validating " + packet.$$schema);
                console.error(this.ajv.errors);
                return this.ajv.errors;
            }
        }
        return true;
    }*/

    validatePacket(packet) {
        let _schema = packet.$$schema;
        delete packet.$$schema;
        // delete packet.$$header;

        let valid = this.ajv.validate(_schema, packet);
        if (!valid) {
            logger.error("error in validating " + packet.$$schema);
            logger.error(this.ajv.errors);
            /*try {
                localize.fa(this.ajv.errors);
            } catch (e){
                logger.error(e);
            }*/
            return this.ajv.errors;
        }else{
            return true;
        }
    }

    /**
     * old handle packet
     * @param packet
     * @param values
     * @returns {*}
     */
    handlePacket(packet, values) {
        logger.log("handlePacket:")
        logger.log('packet',packet)
        logger.log('values',values)
        console.time("handleP");

        if(values) {
            let _values = {... values};
            //todo _values.currentuser = this.currentUser;
            //todo _values.appvars = this.appvars;

            //for assign values in {{...}}
            try {
                packet = ST.select(_values).transformWith(packet).root();
            } catch (e) {
                logger.error(e);
            }


            //for assign values by jsonLogic syntax
            // _.forEach(packet, function (value, key) {
            for(let key in packet){
                let value= packet[key];
                /*if (_.isString(value) && value.startsWith('@this.')) {
                 _.assign(packet, {[key]: values[key]})
                 } else */
                if (key.endsWith('=') && typeof value === 'object') {
                    try {
                        delete packet[key];
                        let _value = jsonLogic.apply(value, values);
                        packet[key.replace('=','')] = _value;
                        //_.assign(packet, {[key.replace('=','')]: _value});
                    } catch (e){
                        logger.error(e);
                    }
                }
            }
            /*)*/

            // this.calculates(packet, this, values);
        }

        logger.error(packet)
        console.timeEnd("handleP");

        return packet;
    }

    async runRuleOf(schema, ruleTime, packet) {
        let rules = schema.$$rules?.filter(rule => rule.ruleTime === ruleTime);
        if(!rules) return;

        async function runRule(rule) {
            if (Array.isArray(rule.ruleDef)) {
                for (let task of rule.ruleDef) {
                    let deepcopy = {...task};
                    await this.runPacket(this.handlePacket(deepcopy, packet));
                }
            } else {
                let deepcopy = {...rule.ruleDef};
                await this.runPacket(this.handlePacket(deepcopy, packet));
            }
        }

        for (let rule of rules) {
            if (rule.ruleType === 'trigger') {
                if(rule.ruleTime === 'every') {
                    let thes = this;
                    logger.log('add cron on '+rule.schedule+' for '+rule.ruleId)
                    cron.schedule(rule.schedule, () => {
                        runRule.bind(thes)(rule);
                    }, {
                        timezone: rule.timezone
                    })
                } else {
                    //await runRule.call(this);
                    runRule.bind(this)(rule);
                }
            }
        }
    }

    async dataPacket(packet, schema, env) {
        try {
            //do each item separately if packet is an array
            /*if(packet[0]){
             let thes = this;
             _.forEach(packet, function (_apacket) {
             thes.dataPacket({ ... _apacket});
             })

             return;
             }*/


            if(!schema){
                let Schema = this.ajv.getSchema(packet.$$schema);
                if(!Schema){
                    logger.error("dataPacket: no Schema "+packet.$$schema);
                    return null;
                }
                schema = {...Schema.schema};

                // schema = this.handlePacket(schema, schema);

            }

            if(env) {
                schema = this.preparePacket(schema, {...env, schema: schema});
                packet = this.preparePacket(packet, {...env, schema: schema});
            }


            let header = packet.$$header;

            //todo require adapter or factory

            let storage = {};

            if(this.conf.storage) {
                storage = {... this.conf.storage};
            }

            if(schema.$$storage){
                Object.assign(storage, schema.$$storage);
            } else {
                logger.error("storage is not set for " + packet.$$schema + ", default storage is set for it");
                //TODO change .error to .warning
            }

            if(storage === {}){//todo, check is this compare true way
                logger.error("storage is not set for " + packet.$$schema);
                return { //TODO uniform return with message and code
                    "message": "storage is not set",
                    "success": false
                }
            }

            //get storage from storage factory
            const storage_factory = require('./storage_adapters/storage_factory');
            let adapter = this.adapters[packet.$$schema];
            if(!adapter) {
                adapter = await storage_factory.call(this, storage);
                if(!adapter) {
                    logger.error('could not detect adapter for storage', storage);
                    return {success: false, error: 'storage detection unsuccessful.'}
                }
                this.adapters[packet.$$schema] = adapter;
            }


            //check permission
            if(schema.$$roles && this.conf.authenticate){

                console.time("checkpermission");
                if(! await this.checkRolesPermission(schema.$$roles, packet)) {
                    //return this.ajv.errors;
                    if(!this.currentUser){
                        return {
                            "success": false,
                            "requireAuthentication": true,
                            "message": "Need Authentication"
                        }
                    } else {
                        return {
                            "success": false,
                            "message": "No Permission to data action"
                        }
                    }
                }
                console.timeEnd("checkpermission");

            }

            //create
            if (header.action === 'C') {
                /*let isvalid = this.validatePacket(packet);
                 if (isvalid !== true) {//just use !== true
                 console.error('Create failed');
                 return isvalid;
                 }*/

                //check defaults
                logger.log("check defaults");
                for( let p in schema.properties){
                    let prp = schema.properties[p];
                    if( !packet[p] && prp.default) {
                        packet[p] = prp.default;
                        logger.log("default for "+p +"is");
                        logger.log(p.default);
                    }
                }

                let pschema = packet.$$schema;

                delete packet.$$schema;
                delete packet.$$header;

                let valid = this.ajv.validate(schema.$id, packet);

                delete packet.$id;


                // let valid = this.validateThis(schema.$id, packet, header);

                //just use valid != true
                if (valid !== true) {
                    logger.error("error in validating " + pschema);
                    logger.error(this.ajv.errors);
                    /*try {
                        localize.fa(this.ajv.errors);
                    } catch (e){
                        logger.error(e);
                    }*/
                    return {success: false, message: this.ajv.errors};
                } else {

                    packet.$$record =
                        {
                            //TODO  "user": header.user.username,
                            "action": "C",
                            "time": Date.now()
                        };

                    //uuid
                    //set a uuid as id
                    packet.$$objid = uuid();

                    //check beforeCreate event
                    /*if(schema.$$events) {
                        if (schema.$$events.beforeCreate) {
                            let deepcopy = {...schema.$$events.beforeCreate};
                            let data_message = await this.runPacket(this.handlePacket(deepcopy, packet));
                            if(data_message.$$new){
                                Object.assign(packet, data_message.$$new);
                            }
                        }
                    }*/
                    await this.runRuleOf(schema, 'beforeCreate', packet);

                    //create in storage
                    let ret = adapter.create(schema, packet);

                    //check afterCreate event
                    /*if(schema.$$events) {
                        if (schema.$$events.afterCreate) {
                            if(is_Array(schema.$$events.afterCreate)){
                                schema.$$events.afterCreate.map(async (afterCreate)=>{
                                    let deepcopy = {...afterCreate};
                                    await this.runPacket(this.handlePacket(deepcopy, packet));
                                })
                            } else {
                                let deepcopy = {...schema.$$events.afterCreate};
                                await this.runPacket(this.handlePacket(deepcopy, packet));
                            }
                        }
                    }*/
                    await this.runRuleOf(schema, 'afterCreate', packet);
                    ret.success = true;
                    return ret;
                }
            }
            //read
            else if(header.action === 'R') {
                //check onRead event
                /*if(schema.$$events) {
                    if (schema.$$events.onRead) {
                        let deepcopy = {...schema.$$events.onRead};
                        await this.runPacket(this.handlePacket(deepcopy, packet));
                    }
                }*/
                await this.runRuleOf(schema, 'onRead', packet);

                //read from storage
                let data = await adapter.read(
                    schema,
                    header.filter,
                    header.filterrules ?
                        function (obj) { return jsonLogic.apply(header.filterrules, obj);}
                        : null,
                    packet) ;
                /*if(is_Array(data) && data.length == 1){
                 data = data[0];
                 }*/
                return data;
            }
            //count
            else if(header.action === 'L') {
                //check onRead event
                /*if(schema.$$events) {
                    if (schema.$$events.onRead) {
                        let deepcopy = {...schema.$$events.onRead};
                        await this.runPacket(this.handlePacket(deepcopy, packet));
                    }
                }*/
                await this.runRuleOf(schema, 'onRead', packet);

                //read from storage
                let data = await adapter.count(
                    schema,
                    header.filter,
                    header.filterrules ?
                        function (obj) { return jsonLogic.apply(header.filterrules, obj);}
                        : null,
                    packet) ;
                /*if(is_Array(data) && data.length == 1){
                 data = data[0];
                 }*/
                return data;
            }
            //update
            else if(header.action === 'U') {
                // delete packet.$$header;
                delete packet.$id;
                //prevent change $$objid when update object
                delete packet.$$objid;
                //delete packet.$schema;



                //update in storage not commit , returns updatable objects //TODO performance checking for large results
                // let valid = this.ajv.validate(schema.$id, packet);/////todo new change

                packet.$$record =
                    {
                        //TODO "user": header.user.username,
                        "action": "U",
                        "time": Date.now()
                    };

                delete packet.$schema;
                // delete packet.$$schema;
                // delete packet.$$header;

                await this.runRuleOf(schema, 'beforeUpdate', packet);

                //todo, change here update to read and if was ok, update it , then remove commit method
                let updateList = await adapter.update(
                    schema,
                    packet,
                    header.filter,
                    header.filterrules ?
                        function (obj) { return jsonLogic.apply(header.filterrules, obj);}
                        : null);

                let thes = this;
                let notValid = false;
                updateList.value().map(async function (updated) {
                    let newValue = updated;

                    //add header because needed in validate of $$roles //TODO change because conflicted with additionalProperties=false

                    let _newValue = {... newValue};
                    delete _newValue.$$record;
                    delete _newValue.$$objid;
                    delete _newValue.$$header;
                    delete _newValue.$$schema;

                    //validating each updated object
                    let valid = thes.ajv.validate(schema.$id, _newValue);

                    if (!valid) {
                        notValid = true;
                        logger.error("error in validating " + schema.$id);
                        logger.error(thes.ajv.errors);
                        logger.error(_newValue);
                        return {success: false, message: thes.ajv.errors};
                    } else {
                        /*if (schema.$$events) {
                            if (schema.$$events.beforeUpdate) {
                                let deepcopy = {...schema.$$events.beforeUpdate};
                                await this.runPacket(this.handlePacket(deepcopy, newValue));
                            }
                            if (schema.$$events.afterUpdate) {//TODO change place to after commit
                                let deepcopy = {...schema.$$events.afterUpdate};
                                await this.runPacket(this.handlePacket(deepcopy, newValue));
                            }
                        }*/
                        await thes.runRuleOf(schema, 'afterUpdate', packet);
                    }
                });

                if(notValid) {

                    return {success: false, message: thes.ajv.errors};// JSON.stringify(this.ajv.errors) +"not Valid! update failed"
                } else {
                    await adapter.commit(updateList);
                    return { success: true, message: "update ok", updated: updateList.value().length};
                }
            }
            //delete
            else if(header.action === 'D') {
                if(schema.$$roles){
                    /*if(! this.checkRolesPermission(schema.$$roles, packet)) {
                     //return this.ajv.errors;
                     return "No Permission to Delete";
                     }*/
                }
                /*if(schema.$$events) {
                    if (schema.$$events.beforeDelete) {
                        let deepcopy = {...schema.$$events.beforeDelete};
                        await this.runPacket(this.handlePacket(deepcopy, packet));
                    }
                }*/
                await this.runRuleOf(schema, 'beforeDelete', packet);

                //delete in storage
                let ret = await adapter.delete(
                    schema,
                    header.filter,
                    header.filterrules ?
                        function (obj) { return jsonLogic.apply(header.filterrules, obj);}
                        : null
                );

                /*if(schema.$$events) {
                    if (schema.$$events.afterDelete) {
                        let deepcopy = {...schema.$$events.afterDelete};
                        await this.runPacket(this.handlePacket(deepcopy, packet));
                    }
                }*/
                await this.runRuleOf(schema, 'afterDelete', packet);

                ret.success = true;
                return ret;
            }
        }
        catch (e) {
            logger.error(e);
        }

    }

    async compileSchema(aSchema, force) {

        // console.log(loadedSchemas)
        if (!force && this.loadedSchemas.includes(aSchema.$id)) {
            if (!this.compiledSchemas.includes(aSchema.$id)) {
                logger.error("$$ DONT USE LOOP uses in id " + aSchema.$id);
            }
            return;
        }
        this.loadedSchemas.push(aSchema.$id);
        // console.log(loadedSchemas);
        //checking $ref
        /*if ("$$uses" in aSchema) {
            const uses = aSchema.$$uses;
            for (let u = 0; u < uses.length; u++) {
                let use = uses[u];
                console.debug("$$ preloading " + use);
                let dir = path.join(global.appPath, this.conf.schemas.path);
                /!*if (use.startsWith("~/")) {
                    dir = ss_modules;
                    use = use.replace("~/", "");
                } else {
                    dir = this.schemas;
                }*!/

                try {
                    var usefile = require(dir + "/" + use);
                } catch (e) {
                    console.error('could not find ' + use)
                }
                try{
                    // if (!usefile)
                    //     usefile = require(this.schemas + "/!**!/" + use);
                    this.compileSchema(usefile);
                } catch (e) {
                    console.error(e);
                }

            }
        }*/


        //very important:
        // aSchema.$schema = ssServerConf.ssschema;
        aSchema.$schema = "no://nolang.entity.schema";//todo


        //compiling schema
        logger.trace("compiling " + aSchema.$id);
        this.ajv.removeSchema(aSchema.$id);

        try {
            var valid = this.ajv.compile(aSchema);
        } catch (e) {
            logger.error("e1:"+ e);
        }

        if (!valid) {
            return this.ajv.errors;
        }

        this.compiledSchemas.push(aSchema.$id);

        this.runRuleOf(aSchema, 'every', {}).then(()=>{

        })

        //if auto reload
        logger.trace('auto reload');
        this.nlef?.endpoints.forEach((endpoint)=>endpoint.reload());
    }

    assertJson(json, file) {
        //very important:
        if(!json.$$schema){
            logger.error("Can't validate \"" + file + "\", has not $$schema");
            return false;
        }
        let $schema = json.$$schema;
        delete json.$$schema;
        // ajv.sscompile(json);
        try {
            const valid = this.ajv.validate($schema, json);
            if (!valid) {
                logger.error("error in validating " + file);
                logger.error(this.ajv.errors);
                return false;
            }
            else {
                logger.log(`${file} is valid ${$schema} `)
            }
        } catch (e){
            logger.error("error in validating " + file);
            logger.error(e.message);
            return false;
        }
        return true;
    }

    async checkRolesPermission(roles, packet) {
        //TODO create permission routing logs
        //TODO return permission messages to user

        const header = packet.$$header;
        let userAction = (header && header.action) ? header.action : '' ;

        let hasPermission = false;
        let _role = null;
        for (let r = 0; r < roles.length; r++) {
            const role = roles[r];

            //roleid *
            if(role.roleId === '*'){
                if(
                    role.permissions.some(per => per.access.includes(userAction))
                    ||
                    role.permissions.some(per => per.access.includes("A"))
                ){
                    hasPermission = true;
                    _role = role;
                    break;
                }
            }

            let userRoles = null;

            if(header.user){
                this.currentUser = header.user;

                //fixme not has security, change to JWT
                if(header.user.roles){
                    userRoles = header.user.roles;
                }

                //if header.user has username and password
                if(header.user.username) {
                    if(header.user.password) {
                        if(this.conf.user.schema) {
                            let _users = await this.runPacket({
                                $$schema: this.conf.user.schema,
                                $$header: {
                                    action: 'R',
                                    filter: {
                                        [this.conf.user.usernameField]: header.user[this.conf.user.usernameField] || header.user.username,
                                        [this.conf.user.passwordField]: header.user[this.conf.user.passwordField] || header.user.password
                                    }
                                }
                            }, null, {});
                            if(_users.length<1){
                                logger.error('No user with this username password',
                                    header.user[this.conf.user.usernameField] || header.user.username,
                                    header.user[this.conf.user.passwordField] || header.user.password
                                    )
                                return false;
                            }
                            userRoles = _users[0][this.conf.user.rolesField];
                        }
                    }
                }


            } else {
                if(this.currentUser){
                    userRoles = this.currentUser.roles;
                }
            }

            if (userRoles) {
                if (userRoles.some(ur => ur.roleId === role.roleId &&
                    (
                        role.permissions.some(per => per.access.includes(userAction))
                        ||
                        role.permissions.some(per => per.access.includes("A")))
                ) )
                {
                    hasPermission = true;
                    _role = role;
                    break;
                }
            }
        }

        if(hasPermission){
            if(_role.$$rules) {
                for (let rule of _role.$$rules) {
                    if (rule.ruleType && rule.ruleType === 'filter') {
                        logger.log(rule.ruleDef)
                        if (packet.$$header) {
                            if (!packet.$$header.filter) {
                                packet.$$header.filter = {}
                            }
                            Object.assign(packet.$$header.filter, this.handlePacket(rule.ruleDef, rule.ruleDef));
                        }
                    }
                }
            }
            return true;
        }

        logger.error("not permission " + userAction + " in schema  " + packet.$$schema);
        return false;
    }

    requireAuthentication(req, res, next, _ssCompiler){
        //jwt
        const jwt = require('jsonwebtoken');
        logger.log('verifying');
        const token = req.headers['x-access-token'];
        if (!token/* ^ _ssCompiler.ssConf.authenticate*/) {
            logger.error("no token");
            return res.status(401).send({ auth: false, message: 'No token provided.' })
            //.redirect("login");
        }
        if(token) {
            jwt.verify(token,
                _ssCompiler.ssConf.userbase.jwtsecurity,
                function (err, decoded) {
                    if (err) {
                        logger.error("ERROR WITH TOKEN:");
                        logger.error(token);
                        logger.error("ERROR DESCS:");
                        logger.error(err);
                        return res.status(401).send({
                            auth: false,
                            message: 'Failed to authenticate token.' + err.message
                        });
                    }
                    // .redirect("login?"+'Failed to authenticate token.' + err.message);
                    // if everything good, save to request for use in other routes
                    req.user = decoded.user;
                    next();
                }
            );
        } else {
            next();
        }
        // next()


    }

    readToken(token){
        const jwt = require('jsonwebtoken');
        console.time('readtoken');
        if (!token) {
            logger.error("no token");
            return null;
        }
        let thes = this;
        jwt.verify(token,
            this.conf.userbase.jwtsecurity,
            function (err, decoded) {
                if (err) {
                    logger.error("eeee");
                    logger.error(err);
                }
                // .redirect("login?"+'Failed to authenticate token.' + err.message);
                // if everything good, save to request for use in other routes
                if(decoded)
                    thes.sookuser = decoded.user;
            }
        );
        console.timeEnd('readtoken');
        return this.sookuser;
    }

    /*loadUser(req, res, next){
        console.log('Remove loadUser function!!!!!!');
        next()
    }*/

    /**
     * gives and return router
     * @param router a pre created router
     * @returns same router after dispatching
     */
    /*dispatchRouter(router) {

        const _ssCompiler = this;

        /!*router.post('/!*_ss_error_log_', function(req, res, next) {
            _ssCompiler.currentUser = req.user;
            let msg = req.param("msg");
            let url = req.param("url");
            let line = req.param("line");

            _ssCompiler.logger.error({
                msg : msg,
                url : url,
                line: line,
                user: req.user
            })
            console.error({
                msg : msg,
                url : url,
                line: line,
                user: req.user
            })

            res.json({});
        });
*!/

        router.get('/sw.js', function(req, res, next) {
            res.sendFile(path.join(__dirname + "/"+ _ssCompiler.approot+"/views/sw.js"));
        });

        router.get('/:man.manifest', function(req, res, next) {
            res.sendFile(path.join(__dirname + "/"+ _ssCompiler.approot+"/views/"+req.param('man')+".manifest"));
        });

        router.get('/ssmanifest.json', function(req, res, next) {
            res.json(_ssCompiler.ssConf.manifest);
        });

        router.get('/compile', function(req, res, next) {
            //_ssCompiler.currentUser = req.user;

            const compileReturn = _ssCompiler.nlCompile();
            // res.json(compileReturn);
            res.redirect(".");
        });

        router.get('/emitroommessage/:room/:from/:channel', async function(req, res, next) {
            //_ssCompiler.currentUser = req.user;
            let from = req.param('from');
            let room = req.param('room');
            let channel = req.param('channel');
            let roomid = 'room-'+room;
            sockio.to(roomid).emit('from' , from);
            if(channel==='login'){
                //TODO check and restrict sender IP
                //checking user
                await _ssCompiler.forceLogin(from, roomid);
            }
            res.send('OK')
        });

        router.get('/!*appvars', function(req, res, next) {
            _ssCompiler.currentUser = req.user;
            // _ssCompiler.appvars.currentuser = _ssCompiler.currentUser;
            res.json(_ssCompiler.appvars);
        });

        router.get('/login', function(req, res, next) {
            res.sendFile(path.join(__dirname + "/"+ _ssCompiler.approot+_ssCompiler.ssConf.loginpage));
        });

        router.get('/__catch/:key', async function(req, res, next) {
            let key = req.param('key');
            let catchdata = await redisClient.get(key);
            if(! catchdata) return res.end('');
            let img = Buffer.from(catchdata.replace(/^data:image\/png;base64,/, ''), 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            });
            res.end(img);
        });

        router.get('/', function(req, res, next) {
            /!*!/routing
            /!*if(req.query && _ssCompiler.ssConf.routing && _ssCompiler.ssConf.routing.query){
                for(let q in _ssCompiler.ssConf.routing.query) {
                    if(req.query[q]){
                        let qval = req.query[q];
                        if(_ssCompiler.ssConf.routing.query[q][qval])
                            router.currentUser = _ssCompiler.ssConf.routing.query[q][qval].currentuser;
                        else
                            router.currentUser = {};
                    }
                }
            }*!/
            //res.sendFile(path.join(__dirname + "/"+ _ssCompiler.approot+"/views/index.html"));
            res.send(_ssCompiler.index_html);
        });

        //login process
        router.post('/login', async function(req, res, next) {
            let jwt = require('jsonwebtoken');

            let username = req.param("username");
            let password = req.param("password");

            //checking user
            _ssCompiler.currentUser = _ssCompiler.ssConf.userbase.authuser;
            let thisUser = await _ssCompiler.dataPacket({
                $$header : {
                    "action": "R",
                    "filter": {
                        [_ssCompiler.ssConf.userbase.usernamefield]: username,
                        [_ssCompiler.ssConf.userbase.passwordfield]: password
                    }
                },
                $$schema: _ssCompiler.ssConf.userbase.userschema
            });


            if(thisUser.length <= 0) {
                res.status(401).send({auth: false, message: "Failed to authenticate"});
                return;
            }


            // create a token TODO according to username and password set user and roles
            thisUser = thisUser[0];

            let _user = {
                "name": thisUser[_ssCompiler.ssConf.userbase.usernamefield],
                "roles": thisUser.roles,
                "id": thisUser.$$objid
            };

            Object.assign(_user, thisUser);
            delete _user[_ssCompiler.ssConf.userbase.passwordfield];

            _ssCompiler.currentUser = _user;

            let token = jwt.sign(
                {
                    user: _user
                },
                _ssCompiler.ssConf.userbase.jwtsecurity,
                {
                    expiresIn: "60 days"
                }
            );
            res.status(200).send({ auth: true, user: _user, token: token, message: "Successful" });

            // sook.emit('message','شما وارد فودپیج شدید');
        });


        //!************** requireAuthentication ************************!//

        router.all('*', function (req, res, next) {
                if(_ssCompiler.ssConf.authenticate || req.headers['x-access-token'])
                    return _ssCompiler.requireAuthentication(req, res, next, _ssCompiler);
                else
                    next();
            }
            , this.loadUser);


        async function getIndex(req, res) {

            if(req.user && _ssCompiler.appvars.logintype.method === 'SMSKEY') {
                let u = await _ssCompiler.dataPacket({
                    $$header: {
                        "action": "R",
                        "filter": {
                            $$objid: req.user.$$objid
                        }
                    },
                    $$schema: _ssCompiler.ssConf.userbase.userschema
                });
                _ssCompiler.currentUser = u[0];
            } else {
                _ssCompiler.currentUser = req.user;
            }

            let renderedView = await _ssCompiler.renderIndex();
            res.json(renderedView);

            /!*let rediskey = '_index'+ req.user ? req.user.id : '';
            let redistime = 3600;
            redisClient.get(rediskey, async (err, result) => {
                let renderedView;
                if (result) {
                    renderedView = JSON.parse(result);
                    console.log('found in redis')
                    console.log(renderedView)
                } else {
                    renderedView = await _ssCompiler.renderIndex();
                    redisClient.setex(rediskey, redistime, JSON.stringify(renderedView))
                }
                res.json(renderedView);
            });*!/
        }

        router.get('/index', async function(req, res, next) {
            await getIndex(req, res);
        });


        if (_ssCompiler.ssConf.routing) {
            if(_ssCompiler.ssConf.routing.path) {
                for (let path in _ssCompiler.ssConf.routing.path) {
                    router.get('/'+path+'/index' , async function (req, res) {
                        let packet = _ssCompiler.ssConf.routing.path[path];
                        _ssCompiler.currentUser = req.user;

                        let renderedView = await _ssCompiler.renderViewTemp(packet);
                        res.contentType("application/json");
                        res.send(renderedView);
                    });
                }
            }
        }


        router.get('/!*!/index', async function(req, res, next) {
            await getIndex(req, res);
        });

        router.get('/schema/:schema', function(req, res, next) {
            _ssCompiler.currentUser = req.user;

            const schema = _ssCompiler.getSchema(req.param('schema'));
            res.send(schema || {'success': false, 'message': `No Schema ${req.param('schema')}`});
        });

        router.get('/lookup/:schema/:fields', async function(req, res, next) {
            _ssCompiler.currentUser = req.user;

            let p = {
                $$header : {
                    action : "R"
                },
                $$schema: req.param('schema')
            };

            let lookups = await _ssCompiler.dataPacket(p);
            let results = [];
            // lookups.forEach(lookup => results.push({value: lookup.$$objid, text: lookup.$$objid}));
            lookups.value().forEach(function (item, key) {
                let fields = req.param('fields');

                let text = "";

                if(fields.indexOf("{{") !== -1) {
                    text = ST.select(item).transformWith(fields).root();
                } else {
                    fields = fields.split(",");
                    fields.forEach(field => text += item[field]);
                }


                results.push({value: item.$$objid, text: text});
            });

            res.send(results);
        });

        router.post('/validate', function (req, res) {
            let packet = req.body;
            _ssCompiler.currentUser = req.user;

            const validmessage = _ssCompiler.validatePacket(packet);
            res.json(validmessage);
        });

        router.post('/data', async function (req, res) {
            let packet = req.body;

            _ssCompiler.currentUser = req.user;
            let datamessage = await _ssCompiler.dataPacket(packet);
            res.json(datamessage);
        });

        router.post('/view', async function (req, res) {
            let packet = req.body;
            _ssCompiler.currentUser = req.user;

            let renderedView = await _ssCompiler.renderViewTemp(packet);
            res.contentType("application/json");
            res.send(renderedView);
        });

        //TODO complete me
        //routing
        /!*if (_ssCompiler.ssConf.routing) {
            /!*if(req.query && _ssCompiler.ssConf.routing.query) {
             for (let q in _ssCompiler.ssConf.routing.query) {
             if (req.query[q]) {
             let qval = req.query[q];
             if (_ssCompiler.ssConf.routing.query[q][qval])
             router.currentUser = _ssCompiler.ssConf.routing.query[q][qval].currentuser;
             else
             router.currentUser = {};
             }
             }
             }*!/

            if(_ssCompiler.ssConf.routing.path) {
                for (let path in _ssCompiler.ssConf.routing.path) {
                    router.get('/'+path , async function (req, res) {
                        let packet = _ssCompiler.ssConf.routing.path[path];
                        _ssCompiler.currentUser = req.user;

                        let renderedView = await _ssCompiler.renderViewTemp(packet);
                        res.contentType("application/json");
                        res.send(renderedView);
                    });
                }
            }
        }*!/
        router.get('/!*', function(req, res, next) {
            res.sendFile(path.join(__dirname + "/"+ _ssCompiler.approot+"/views/index.html"));
        });


        /!*if(_ssCompiler.ssConf.routing){
            for(let routing in _ssCompiler.ssConf.routing) {
                router.get(routing, function(req, res, next) {

                    _ssCompiler.currentUser = req.user || {};
                    console.log('req.params');
                    for(let par in req.params){
                        _ssCompiler.appvars[par] = eval(req.param(par));
                        console.log("set "+par+"="+req.param(par));
                    }

                    if(_ssCompiler.ssConf.routing[routing].appvars){
                        console.log("assign to appvars "+ JSON.stringify(_ssCompiler.ssConf.routing[routing].appvars));
                        Object.assign(_ssCompiler.appvars, _ssCompiler.ssConf.routing[routing].appvars);
                    }

                    if(_ssCompiler.ssConf.routing[routing].currentuser){
                        console.log("assign to currentuser "+ JSON.stringify(_ssCompiler.ssConf.routing[routing].currentuser));
                        Object.assign(_ssCompiler.currentUser, _ssCompiler.ssConf.routing[routing].currentuser);
                    }

                    res.redirect(_ssCompiler.ssConf.appdir+'/');
                    // res.sendFile(path.join(__dirname + "/"+ _ssCompiler.approot+"/views/index.html"));
                });
            }
        }*!/

        router.post('/!*', async function(req, res, next) {
            // sook.emit('message', 'Hoora')

            let packet = req.body;
            console.log(packet);
            _ssCompiler.currentUser = req.user;


            /!**
             * TODO we can use "emit" mode
             * means dont wait for reply and not await for runPacket
             * if $$header has "emit": "an emit"
             * send json message immediately as soon as possible
             * then send for me reply via socket to emit "emit" "an emit"
             *!/

            console.log('currentUser is '+ JSON.stringify(_ssCompiler.currentUser));

            let renderedView;
            if(packet.$$header && packet.$$header.cache) {
                let header = packet.$$header;
                renderedView = await _ssCompiler.inRedis((_ssCompiler.appvars.appbase || _ssCompiler.ssConf.appdir) + header.cache.key, header.cache.time, async ()=>{
                    return await _ssCompiler.runPacket(packet, req.user);
                });
            } else {
                renderedView = await _ssCompiler.runPacket(packet, req.user);
            }



            //let renderedView = await _ssCompiler.runPacket(packet, req.user);

            if(renderedView && renderedView.requireAuthentication){
                return _ssCompiler.requireAuthentication(req, res, next, _ssCompiler);
            }
            res.contentType("application/json");
            res.send(renderedView);

        });

        return router;
    }*/

    /*async forceLogin(from, roomid) {
        this.currentUser = this.ssConf.userbase.authuser;
        let thisUser = await this.dataPacket({
            $$header: {
                "action": "R",
                "filter": {
                    [this.ssConf.userbase.usernamefield]: from
                }
            },
            $$schema: this.ssConf.userbase.userschema
        });


        if (thisUser.length <= 0) {
            let thes = this;
            thisUser = await this.runPacket({
                $$header: {
                    "action": "C",
                    "success": {
                        $$header: {
                            "action": "R",
                            "filter": {
                                "$$objid": "{{newId}}"
                            }
                        },
                        $$schema: thes.ssConf.userbase.userschema
                    },

                },
                $$schema: this.ssConf.userbase.userschema,
                [this.ssConf.userbase.usernamefield]: from,
                [this.ssConf.userbase.passwordfield]: from
            });
            /!*thisUser = {
                new: true,
                [this.ssConf.userbase.usernamefield]: from
            }*!/
            //thisUser.new = true;
            thisUser = thisUser.data[0];
        } else {
            thisUser = thisUser[0];
        }


        // create a token TODO according to username and password set user and roles


        /!*let _user = {
            "name": thisUser[this.ssConf.userbase.usernamefield],
            "roles": thisUser.roles,
            "id": thisUser.$$objid
        }*!/

        let _user = {};
        Object.assign(_user, thisUser);
        delete _user[this.ssConf.userbase.passwordfield];

        this.currentUser = _user;

        let jwt = require('jsonwebtoken');
        let token = jwt.sign(
            {
                user: _user
            },
            this.ssConf.userbase.jwtsecurity,
            {
                expiresIn: "60 days"
            }
        );

        let logindata = {auth: true, user: _user, token: token, message: "Successful"};

        redisClient.setex(roomid, 36000, JSON.stringify(logindata));//save this smsed value 10 hours

        if (sockio.sockets.adapter.rooms[roomid] && sockio.sockets.adapter.rooms[roomid].length > 0) { //emit if user is online
            console.log('force login for roomid '+roomid);
            sockio.to(roomid).emit('login', logindata);
        } else {

            console.log(roomid + " is not online");
        }

    }*/


    /*static checkEmits(packet, header, action, data_message){
        logger.log('check emits ');
        // let itsSchema = this.ajv.getSchema(packet.$$schema).schema;
        // let roles = itsSchema.$$roles;

        if (header && header.emit) {
            let emit = header.emit;
            // sook.broadcast.emit(/!*header.emit.receiver.role || header.emit.receiver.user ||*!/ 'message', header.emit.message);
            let room = emit.receiver.role || emit.receiver.user;
            let event = 'message';
            let msg = '';
            if(emit.notify){
                event = 'notify';
                msg = emit.notify;
            } else {
                msg = emit.message;
            }
            sockio.to(room).emit(event , msg);
        }
    }*/

}





let _conf = getAppConf(getAppName());
if(_conf?.cluster) {
    const cluster = require('cluster');
    cluster.schedulingPolicy = cluster.SCHED_RR;
    const process1 = require('process');
    let numCPUs = require('os').cpus().length;

    if((typeof _conf.cluster === 'number') && (_conf.cluster > 0) && (_conf.cluster<numCPUs)){
        numCPUs = _conf.cluster;
    }

    if (cluster.isMaster) {
        logger.trace(`Primary ${process1.pid} is running`);

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            logger.log('Run Nolang on cluster ' + (i + 1))
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            logger.log(`worker ${worker.process.pid} died`);
        });
    } else {
        const _nlCompiler = new nlCompiler();
    }
} else {
    const _nlCompiler = new nlCompiler();
}

// module.exports = _nlCompiler.runPacket;

function is_Array(item) {
    return (
        Array.isArray(item) ||
        (!!item &&
            typeof item === 'object' && typeof item.length === 'number' &&
            (item.length === 0 || (item.length > 0 && (item.length - 1) in item))
        )
    );
}


