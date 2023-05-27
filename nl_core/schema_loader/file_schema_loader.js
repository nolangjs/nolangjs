const schema_loader = require('./schema_loader');
const glob = require('glob'), path = require('path');
const chokidar = require('chokidar');
const logger = global.logger;

module.exports = class file_schema_loader extends schema_loader{

    async loadAll() {
        logger.log('load schema files ');
        let schemaFiles;
        if(!path.isAbsolute(this.conf.path))
            schemaFiles = path.join(global.appPath , this.conf.path , '/*.{json,json5,js}');
        else
            schemaFiles = this.conf.path;

        schemaFiles = schemaFiles.replace(/\\/g,'/');

        let thes = this;
        glob.sync(schemaFiles).forEach(function (fileName) {
            try {
                delete require.cache[path.resolve(fileName)];
                let schema = require(path.resolve(fileName));
                schema.filepath = fileName;
                //trigger onLoad
                thes.onLoad(schema, fileName, false);
            } catch (e) {
                logger.error(e)
            }
        });

        if(this.conf.watch) {
            // Initialize watcher.
            let watcher = chokidar.watch(schemaFiles, {
                ignored: /(^|[\/\\])\../,
                persistent: true
            });
            // let log = logger.log.bind(console);
            // Add event listeners.
            watcher
                // .on('add', path => log(`File ${path} has been added`))
                .on('change', fileName => {
                    logger.trace(`File ${fileName} is updated`);
                    delete require.cache[path.resolve(fileName)];
                    try {
                        let schema = require(path.resolve(fileName));
                        //trigger onLoad , force to replace current loaded schema
                        thes.onLoad(schema, fileName, true);
                    } catch (e) {
                        logger.error(e.message)
                    }
                })
                .on('unlink', fileName => logger.trace(`File ${fileName} has been removed`));
        }
    }

    async loadOne(schemaIndicator){
        try {
            let schemaFile = path.join(global.appPath , this.conf.path , schemaIndicator);
            delete require.cache[path.resolve(schemaFile)];
            let schema = require(path.resolve(schemaFile));
            //trigger onLoad
            await this.onLoad(schema, schemaIndicator, false);
        } catch (e) {

        }
    }
}
