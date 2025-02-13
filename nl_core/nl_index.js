
//enable json5 require
require('json5/lib/register');

require('make-promises-safe');

//Ajv
const Ajv = require('ajv');
const addFormats = require("ajv-formats");
const localize = require('ajv-i18n');

//JsonLogic
const jsonLogic = require("json-logic-js");

const {JSONPath} = require('jsonpath-plus');

//uuid
const uuid = require('uuid-random');

//logger
const nl_logger = require('./nl_logger');
const logger = new nl_logger();
global.logger = logger;


//rule_runner
const rule_runner = require('./nl_rule_runner');

//starting Nolang compile
logger.debug("$$ running Nolang compiler $$");

const path = require('path');

const fs = require('fs');

const ST = require('stjs');

const entitySchema = require('../basic_schemas/nolang.entity.schema.json');
const appSchema = require('../basic_schemas/nolang.app.schema.json');
class nlCompiler {

    loadedSchemas = [];
    compiledSchemas = [];
    conf = {};
    listeners = {};
    inited = false;
    adapters = {};

    constructor (appName, appConf) {
        this.nlCompile(appName, appConf);
    }

    nlCompile(appName, appConf) {
        // redisClient.flushall();

        this.loadedSchemas = [];
        logger.info("start to compile");

        //init ajv
        this.initAjv();
        let compileReturn = {
            messages: [],
            errors: []
        };

        let thes = this;

        logger.debug('app nolang file loaded', appConf);

        //validating appConf
        let _ajv = new Ajv({
            jtd: true,
            schemaId:"$id"
        });
        addFormats(_ajv);
        _ajv.addSchema(entitySchema);


        let confIsValid = _ajv.validate(appSchema, appConf);
        if(!confIsValid) {
            logger.error('ERROR',appName,'is not valid',_ajv.errors);
            return ;
        }
        logger.log(appName, 'is valid');

        this.conf = appConf;


        //cache
        if(appConf.cache?.redis) {
            const nl_cache = require('./nl_cache');
            this._nl_cache = new nl_cache(appConf.cache?.redis, () => {
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
            path: path.join( __dirname,'../nl_modules/**')
        }, (schema, filename, force)=>{
            thes.validateCompileSchema(schema, filename, compileReturn, force);
            delete thes.adapters[schema.$id]
        });

        //load schemas of app
        /*this.schema_loader = */new schema_loader_factory( appConf.schemas, (schema, filename, force)=>{
            // console.log(filename, schema, force);
            thes.validateCompileSchema(schema, filename, compileReturn, force);
            delete thes.adapters[schema.$id]
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
        this.ajv.addSchema(entitySchema);

        //first compile master schema
        this.validator = this.ajv.compile(entitySchema);

        //add custom keywords

        const thes = this;

        //todo need to refactor to a section for add keywords

        this.ajv.addKeyword( {
            keyword: '$$rules',
            type: 'object',
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
                        if(rule.hasOwnProperty('before') || rule.hasOwnProperty('after')){
                            continue;
                        }
                        //checking rules:
                        if( rule.check ) {

                            // console.info('$$ rule '+rule.ruleId + ' in id ' + parentSchema.$id + ' checking:');
                            let passed = jsonLogic.apply(rule.check, data);
                            if (!passed) {
                                //todo add error to ajv errors

                                logger.error('$$ rule ' + rule.ruleId + ' in schema ' + parentSchema.$id + ' not passed', {rule, data});

                                allpassed = false;
                            }
                        }
                        //set rules
                        if(rule.set) {
                            logger.log(data);
                            // data[rule.ruleDef.key] = jsonLogic.apply(rule.ruleDef.value, data)
                            for(let key in rule.set){
                                data[key] = jsonLogic.apply(rule.set[key], data);
                                // data[key] = thes.handlePacket(rule.set[key], data)
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

        this.ajv.addKeyword({
            keyword: '$$rel',
            type: 'object',
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
                },null, env );

                let exists = returns?.length === 1;//todo check maybe length>1
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

    async callMethod(req_packet, env) {
        //todo implement return of method
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
                    let method = itsSchema.$$methods?.find(m=>m.name === header.method);
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
                                    endpoint: (req_packet, listener, env)=>thes.runPacket(req_packet, listener, env),
                                };
                                return await methodJs.call(thisObj)
                            } catch (e){
                                return {success: false, message: e.message};
                            }
                        } else if(method.handler){
                            let lastReturn = null;
                            //method.handler.map(async function (iPacket) {
                            let pre = [];//todo document of pre
                            for(let iPacket of method.handler) {
                                let deepcopy = {...iPacket};

                                //assigning value parameters
                                if(header.params) {
                                    deepcopy = await thes.handlePacket(deepcopy, {params: header.params, env: env, schema: itsSchema, pre: pre});
                                }

                                lastReturn = await thes.runPacket(deepcopy, null, env);
                                pre.push(lastReturn);
                            };

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
            logger.error(e)
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
            await this.preparePacket(req_packet, _ssCompiler, false);

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
                                if(rel && !rel.hasOwnProperty('key')) {
                                    rel.key = '$$objid';
                                }
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
                                                    fields: [rel.key].concat(rel.return)
                                                }
                                            }, null, env);
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
                                                    [rel.key]: obj[field]
                                                },
                                                fields: [rel.key].concat(rel.return)
                                            }
                                        }, null, env);
                                        if(val.length > 0) {
                                            if (Array.isArray(rel.return)) {
                                                for (let r of rel.return) {
                                                    obj[field + '.' + r] = val[0][r];
                                                }
                                            } else {
                                                obj[field + '.' + rel.key] = val[0][rel.return]
                                            }
                                        }
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

            //todo move to engine factory
            if(view) {
                if(view.engine === 'html') {
                    let render_html = require('./view_render/render_html');
                    return await render_html(schema, view, data2 || data || req_packet, _ssCompiler, env)
                } else if(view.engine === 'file' && view.render) {
                    let render_file = require(path.join(global.appPath, view.render));
                    return await render_file(schema, view, data2 || data || req_packet, _ssCompiler, env)
                }
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
        logger.log("Validating "+ filename);
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
            /*if (process.env.NODE_ENV !== 'production') {
                logger.error(this.validator.errors);
            }*/

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
        let data_message;
        let _env = {...env};

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
                lastReturn = await thes.runPacket({ ... _apacket}, null, env);
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

        let header = req_packet.$$header;




        //depricated
        // req_packet = this.handlePacket(req_packet, req_packet);

        let Schema = req_packet.$$schema ? this.ajv.getSchema(req_packet.$$schema) : null;

        if(!header) {
            header = {
                action : "W"
            }
            /*if(Schema) {
               header = {
                   action : "W"
               }
            } else
                return {success: false, message: "$$header not exists!", error: 'MISSING_$$HEADER'}*/
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


        /*if(!Schema){
            logger.error("dataPacket: no Schema "+req_packet.$$schema);
            return {success:false, errorcode: 'SCHEMA_NOT_EXISTS', message: "No Schema with id "+req_packet.$$schema};
        }*/
        if(Schema) {
            let schema = {...Schema.schema};

            // schema = this.handlePacket(schema, schema);

            schema = await this.preparePacket(schema, {env: _env, data: req_packet, schema: schema}, false);

            //prepare packet
            req_packet = await this.preparePacket(req_packet, {env: _env, data: req_packet, schema: schema}, true);


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



            if ('M'.indexOf(action) >= 0) {
                data_message = await _ssCompiler.callMethod(req_packet, _env);
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
                let _packet = {...req_packet};
                data_message = await _ssCompiler.dataPacket(_packet, schema, _env);

                if (header?.hasOwnProperty('path')) {
                    try {
                        data_message = JSONPath(header.path, data_message);
                    } catch (e) {
                        logger.error(e);
                    }
                }

                if (header?.hasOwnProperty('get') && Array.isArray(data_message)) {
                    data_message = data_message[header.get];
                }

                let _then = () => (data_message && ((Array.isArray(data_message) && data_message.length > 0) || (!Array.isArray(data_message) && typeof data_message === 'object' /*&& data_message.success*/)));
                if (header?.then && _then()) {
                    header.then = ST.select({
                        script: req_packet,
                        [req_packet.$$schema]: Array.isArray(data_message) ? data_message[0] : data_message
                    }).transformWith(header.then).root();
                    if (header.then.$$header) {
                        return _ssCompiler.runPacket(header.then, null, _env);
                    }
                    if (header.then.$$set) {
                        for (let key in header.then.$$set) {
                            data_message[key] = header.then.$$set[key];
                        }
                    }
                    if (header.then.$$remove) {
                        for (let key of header.then.$$remove) {
                            delete data_message[key];
                        }
                    }
                }

                let _else = () => (!data_message || ((!Array.isArray(data_message) && typeof data_message === 'object' && !data_message.success) || (Array.isArray(data_message) && data_message.length < 1)));
                if (header?.else && _else()) {
                    header.else = ST.select({
                        script: req_packet,
                        [req_packet.$$schema]: Array.isArray(data_message) ? data_message[0] : data_message
                    }).transformWith(header.else).root();
                    if (header.else.$$header) {
                        return _ssCompiler.runPacket(header.else, null, _env);
                    }/* else if(header.else.$$new) {
                    if(!data_message.$$new)
                        data_message.$$new = {};
                    for(let key in header.then.$$new){
                        data_message.$$new[key] = header.then.$$new[key];
                    }
                }*/
                }
            }

            /*if(returnLength) {
            header.action = 'L';
            data_message = data_message?.length;
        }*/


            //check for push to listeners //todo except action R
            if(data_message && action !== 'R' && this.listeners.hasOwnProperty(req_packet.$$schema)){
                for(let lis of this.listeners[req_packet.$$schema]){
                    //check header filter
                    let check = true;
                    if(lis.header?.filter){

                        for(let key in lis.header.filter) {
                            if(Array.isArray(data_message)) {
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
        }

        /*if(this.appvars && this.appvars.usesocket)
            nlCompiler.checkEmits(req_packet, header, action, data_message);*/

        if(header?.debug) {
            logger.log('Debug '+ new Date());
            logger.log(req_packet);
            logger.log('Response');
            logger.log(data_message);
        }

        //render view
        if(header?.view) {
            data_message = await this.renderView(req_packet, data_message, _env);
        }

        //return in header
        if(header?.return) {
            data_message = this.handlePacket(header.return, {data:data_message, env: _env});
        }

        //set cache
        if(header?.cache && this._nl_cache) {
            this._nl_cache.redisClient.set(header.cache?.key || _env?.request?.url, JSON.stringify(data_message), {EX: header.cache.time});
        }

        return data_message;
    }

    async preparePacket(req_packet1, env, calc) {

        let req_packet = {...req_packet1};
        //do {{}} signs
        req_packet = ST.select(env).transformWith(req_packet).root();

        /*let thes = this;
        this.deepEach(req_packet, (k,obj)=>{
            if(obj.$$import) {
                obj = thes.ajv.getSchema(obj.$$import).schema;
            }
        })*/

        if(calc){
            let thes = this;
            await this.deepEachAsync(req_packet, async (k, obj) => {
                let objk = obj[k];
                // let env = evn;// {...env, this: objk};

                //do $$ handler
                //if(typeof objk === 'object'){
                //calculate
                if (objk?.$$calc) {
                    if (typeof objk.$$calc === 'object') {
                        /*if (objk.$$calc.$$header) {
                            let x = await thes.runPacket(objk.$$calc, null, env);
                            obj[k] = x;
                        } else*/
                            obj[k] = jsonLogic.apply(objk.$$calc, env);
                        logger.debug('$$ debug', objk, env)
                    } else if (typeof objk.$$calc === 'string') {
                        obj[k] = jsonLogic.apply({var: objk.$$calc}, env);
                        logger.debug('$$ debug var', objk.$$calc, env)
                    }
                } else
                    //nested request
                if (objk?.$$header && !["then","else","$$data"].includes(k) && !objk?.$$header.ignore) {
                    let _result = await thes.runPacket(objk, null, env);
                    obj[k] = _result;
                }
                //}
            });
        }

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
            /*for(let key in packet){
                let value= packet[key];
                if (key.endsWith('=') && typeof value === 'object') {
                    try {
                        delete packet[key];
                        let _value = jsonLogic.apply(value, values);
                        packet[key.replace('=','')] = _value;
                    } catch (e){
                        logger.error(e);
                    }
                }
            }*/
            /*)*/

            // this.calculates(packet, this, values);
        }

        logger.error(packet)
        console.timeEnd("handleP");

        return packet;
    }

    async dataPacket(packet, schema, env, ignoreUser) {
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
                schema = await this.preparePacket(schema, {env: env, schema: schema}, false);
                packet = await this.preparePacket(packet, {env: env, schema: schema}, true);
            }


            let header = packet.$$header;

            //todo require adapter or factory

            let storage = {};

            if(this.conf.storage) {
                storage = {... this.conf.storage};
            }

            if(schema.$$storage){
                Object.assign(storage, schema.$$storage);
                if(schema.$$storage.adapter === 'default') {
                    storage.adapter = this.conf.storage.adapter;
                }
            } else {
                logger.debug("storage is not set for " + packet.$$schema + ", default storage is set for it");
                //TODO change .error to .warning
            }

            if(Object.keys(storage).length === 0) {
                logger.error("storage is not set for " + packet.$$schema);
                return { //TODO uniform return with message and code
                    "message": "storage is not set",
                    "success": false
                }
            }

            //get storage from storage factory
            const storage_factory = require('./storage_adapters/storage_factory');
            let adapter = this.adapters[packet.$$schema];
            if(!adapter /*|| this.conf.schemas?.watch*/) {
                adapter = await storage_factory.call(this, storage);
                if(!adapter) {
                    logger.error('could not detect adapter for storage', storage);
                    return {success: false, error: 'storage detection unsuccessful.'}
                }
                this.adapters[packet.$$schema] = adapter;
            }


            //check permission
            if(schema.$$roles && this.conf.user?.authenticate && !ignoreUser) {
                console.time("checkpermission");
                let checkRolesPermission = require('./nl_check_permission');
                let checkResult = await checkRolesPermission.bind(this)(schema.$$roles, packet, env);
                if(!checkResult.hasPermission) {
                    //return this.ajv.errors;
                    /*if(!this.currentUser){
                        // this.runRuleOf(schema, 'error')
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
                    }*/
                    if(checkResult.token) {
                        return {
                            success: true,
                            token: checkResult.token,
                            message: 'Save this token and use it in next requests.$$header.user.token'
                        };
                    }
                    if(checkResult.cookies) {
                        return {
                            success: true,
                            $$res: {
                                cookies: checkResult.cookies
                            }
                        };
                    }
                    return {
                        success: false,
                        error: checkResult.error
                    };
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
                    //await this.runRuleOf(schema, 'beforeCreate', packet);
                    let _result = await rule_runner.runOnAction.bind(this)(schema, 'before', header.action, packet, env);
                    if(_result?.success === false) {
                        return {
                            error : _result.error,
                            success: false
                        };
                    }

                    //create in storage
                    let _ret = adapter.create(schema, packet);

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
                    //await this.runRuleOf(schema, 'afterCreate', packet);
                    await rule_runner.runOnAction.bind(this)(schema, 'after', header.action, packet, env);
                    _ret.success = true;
                    return _ret;
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
                //await this.runRuleOf(schema, 'onRead', packet);
                let _result = await rule_runner.runOnAction.bind(this)(schema, 'before', header.action, packet, env);
                if(_result===false) {
                    return {
                        error : " not passed a rule",
                        success: false
                    };
                }

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
                //await this.runRuleOf(schema, 'onRead', packet);
                let _result = await rule_runner.runOnAction.bind(this)(schema, 'before', header.action, packet, env);
                if(_result===false) {
                    return {
                        error : " not passed a rule",
                        success: false
                    };
                }

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

                //await this.runRuleOf(schema, 'beforeUpdate', packet);
                let _result = await rule_runner.runOnAction.bind(this)(schema, 'before', header.action, packet, env);
                if(_result===false) {
                    return {
                        error : " not passed a rule",
                        success: false
                    };
                }

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
                        //await thes.runRuleOf(schema, 'afterUpdate', packet);
                        await rule_runner.runOnAction.bind(this)(schema, 'after', header.action, packet, env);
                    }
                });

                if(notValid) {

                    return {success: false, message: thes.ajv.errors};// JSON.stringify(this.ajv.errors) +"not Valid! update failed"
                } else {
                    await adapter.commit(updateList);
                    return { success: true, message: "update ok", updated: updateList.value().length, $$objid: updateList.value()[0]?.$$objid};
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
                // await this.runRuleOf(schema, 'beforeDelete', packet);
                let _result = await rule_runner.runOnAction.bind(this)(schema, 'before', header.action, packet, env);
                if(_result===false) {
                    return {
                        error : " not passed a rule",
                        success: false
                    };
                }

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
                // await this.runRuleOf(schema, 'afterDelete', packet);
                await rule_runner.runOnAction.bind(this)(schema, 'after', header.action, packet, env);

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
        if(aSchema.$id)
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

        //start rules by ruleTime:"every"
        rule_runner.runSchedulesOf.bind(this)(aSchema);
        // this.runRuleOf(aSchema, {}, ).then(()=>{})

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
}

function is_Array(item) {
    return (
        Array.isArray(item) ||
        (!!item &&
            typeof item === 'object' && typeof item.length === 'number' &&
            (item.length === 0 || (item.length > 0 && (item.length - 1) in item))
        )
    );
}

module.exports = nlCompiler;


