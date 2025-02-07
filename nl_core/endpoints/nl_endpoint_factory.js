const logger = global.logger;
const allendpoints = {
    amqp: require('./amqp_nl_endpoint'),
    cli: require('./cli_nl_endpoint'),
    file: require('./file_nl_endpoint'),
    grpc: require('./grpc_nl_endpoint'),
    http: require('./http_nl_endpoint'),
    ipc: require('./ipc_nl_endpoint'),
    js: require('./js_nl_endpoint'),
    json: require('./json_nl_endpoint'),
    mqtt: require('./mqtt_nl_endpoint'),
    redis: require('./redis_nl_endpoint'),
    socket: require('./socket_nl_endpoint'),
}

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
                // const _nl_endpoint = require(`./${endpoint.type}_nl_endpoint`);
                const _nl_endpoint = allendpoints[endpoint.type];
                endpoint.watch = watch;
                this.endpoints.push(new _nl_endpoint(endpoint, nl_endpoint_method));
            } catch (err) {
                logger.error(`Error on create endpoint , module "./${endpoint.type}_nl_endpoint" not found.`)
            }
        }
    }
}
