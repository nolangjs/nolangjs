const logger = global.logger;

module.exports = class nl_endpoint_factory {
    /**
     *
     * @param endpoint equals to section "endpoints" in nlpackage.json
     * @param nl_endpoint_method nolang endpoint function
     */
    constructor(endpoints, nl_endpoint_method, watch) {
        this.endpoints = [];
        for(let endpoint of endpoints) {
            try {
                const _nl_endpoint = require(`./${endpoint.type}_nl_endpoint`);
                endpoint.watch = watch;
                this.endpoints.push(new _nl_endpoint(endpoint, nl_endpoint_method));
            } catch (err) {
                logger.error(`Error on create endpoint , module "./${endpoint.type}_nl_endpoint" not found.`)
            }
        }
    }
}
