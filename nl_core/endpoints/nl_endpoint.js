/**
 * each nolang endpoint is a way to connect to nolang endpoint function
 * @type {module.nl_endpoint}
 */
const logger = global.logger;

module.exports = class nl_endpoint {
    /**
     *
     * @param conf of one endpoint
     * @param nl_endpoint_method nolang endpoint function
     */
    constructor(conf, nl_endpoint_method) {
        this.conf = conf;
        this.nl_endpoint_method = nl_endpoint_method;
        this.start().then(r => {
            logger.debug( conf.type + ' endpoint started');
        });
    }

    async start(){
       logger.debug('connect to endpoint')
    }

    reload(){

    }
}
