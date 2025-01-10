const nl_microservice = require('./nl_microservice');
const ipc = require('node-ipc').default;
const logger = global.logger;

/** todo must be tested
 * @example
 {
    name: "chatrooms",
    type: "ipc",
    id: "ipc1"
 }
 * @type {module.ipc_nl_microservice}
 */
module.exports = class ipc_nl_microservice extends nl_microservice{

    async runPacket(packet) {

        return await new Promise(resolve => {

            // ipc.config.id = this.conf.id;
            // ipc.config.silent = true;

            ipc.connectTo(this.conf.id, () => {
                let toIpc = ipc.of[this.conf.id];
                toIpc.on('connect', () => {
                    logger.log('connected to ipc '+this.conf.id);
                    toIpc.emit('message', JSON.stringify(packet));
                });

                toIpc.on('message', (data) => {
                    logger.debug('data received from ipc '+this.conf.id);
                    resolve(data.toString());
                });
            });
        })
    }
}
