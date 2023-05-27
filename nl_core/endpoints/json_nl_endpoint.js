const nl_endpoint = require('./nl_endpoint');
const logger = global.logger;

/**
 * @desc endpoint from a .json or .json5 file contain a NoLang script
 * @type {module.json_nl_endpoint|{}}
 */
module.exports = class json_nl_endpoint extends nl_endpoint{

    async start() {
        let script = this.conf.script;
        logger.log('############   Inline Json Endpoint  ############');
        try {
            let listener = {
                handler: (response) => {
                    logger.log(response);
                }
            }
            this.nl_endpoint_method(script, listener).then(res => {
                logger.log(res);
            });
        } catch (e) {
            logger.error(e.message)
        }
    }
}
