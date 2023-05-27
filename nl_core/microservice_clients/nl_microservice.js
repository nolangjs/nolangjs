/**
 * each nolang microservice is a connector to another nolang service endpoint
 * @type {module.nl_endpoint}
 */
const logger = global.logger;

module.exports = class nl_microservice {

    /**
     *
     * @param conf of one endpoint
     * @param nl_endpoint_method nolang endpoint function
     */
    constructor(conf) {
        this.conf = conf;
        logger.info( `############     MicroService ${conf.name} by type ${conf.type} added.    ############`);
    }

    runPacket(packet) {

    }
}
