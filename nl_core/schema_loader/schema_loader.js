const logger = global.logger;

module.exports = class schema_loader {
    constructor(conf, cb) {
        logger.debug('loading schema base');
        this.conf = conf;
        this.cb = cb;
        this.loadAll().then(r => {
            logger.debug('load schemas finished')
        });
    }

    /**
     * loads all schemas
     * @returns {Promise<void>}
     */
    async loadAll(){
        logger.debug('load function base')
    }

    /**
     * triggered when each schema is loaded and then main nolang callback will be called
     * then checks if it has $$uses to load its dependencies
     * @param aSchema json of schema
     * @param schemaTitle title of schema, its $id or its file name
     * @returns {Promise<void>}
     */
    async onLoad(aSchema, schemaTitle, force){
        this.cb(aSchema, schemaTitle, force);
        // check $$uses
        if ("$$uses" in aSchema) {
            const uses = aSchema.$$uses;
            for (let u = 0; u < uses.length; u++) {
                let use = uses[u];
                logger.debug("$$ preloading " + use);
                await this.loadOne(use);

                /*let dir = path.join(global.appPath, this.conf.schemas.path);
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
                }*/

            }
        }
    }

    /**
     * load one schema by its indicator , i.e. its $id or its file name
     * @param schemaIndicator
     * @returns {Promise<void>}
     */
    async loadOne(schemaIndicator){

    }
}
