const logger = global.logger;

module.exports = class nl_microservice_factory {
    /**
     *
     * @param endpoint equals to section "endpoints" in nlpackage.json
     * @param nl_endpoint_method nolang endpoint function
     */
    constructor(microservices) {
        this.microservices = {};
        for(let microservice of microservices) {
            let microserviceFile = `${microservice.type}_nl_microservice`;
            try {
                const _nl_microservice = require(`./${microserviceFile}`);
                this.microservices[microservice.name] = new _nl_microservice(microservice);
            } catch (err) {
                logger.error(`Error on create microservice , module "./${microserviceFile}" not found.`)
            }
        }
    }

    //todo need show which microservice client is using one service endpoint and log them

    /**
     *
     * @param microservice name of microservice as the key
     * @param packet
     */
    runMicroservice(microservice, packet) {
        return this.microservices[microservice].runPacket(packet);
    }
}
