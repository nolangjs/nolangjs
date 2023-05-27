const nl_endpoint = require('./nl_endpoint');
const path = require('path');
const logger = global.logger;

/**
 * @desc endpoint from a .json or .json5 file contain a NoLang script
 * @type {module.file_nl_endpoint|{}}
 */
module.exports = class file_nl_endpoint extends nl_endpoint{

    async start(){
        let filename = this.conf.filename;
        logger.log('############   File Endpoint '+filename+'  ############');
        try {
            let route = path.isAbsolute(filename) ? filename : path.join(global.appPath, filename);
            let file = require(route);
            let listener = {
                handler: (response) => {
                    logger.log(response);
                }
            }
            this.nl_endpoint_method(file, listener).then(res => {
                logger.log(res);
            });
        } catch (e) {
            logger.error(e.message)
        }
    }
}
