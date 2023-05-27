const nl_microservice = require('./nl_microservice');
const net = require('net');

const logger = global.logger;

/** todo must be tested
 * @example
 {
    name: "chatrooms",
    type: "socket",
    port: 23,
    host: "localhost"
 }
 * @type {module.socket_nl_microservice}
 */
module.exports = class socket_nl_microservice extends nl_microservice{

    async runPacket(packet) {

        return await new Promise(resolve => {
            let client = net.createConnection({host: this.conf.host, port: this.conf.port }, () => {
                // 'connect' listener.
                logger.debug('connected to socket microservice '+this.conf.name);

                client.write(JSON.stringify(packet));
            });
            client.on('data', (data) => {
                logger.debug('data received from microservice '+this.conf.name);
                resolve(data.toString());
            });
            client.on('end', () => {
                logger.debug('disconnected from microservice '+this.conf.name);
            });
        })
    }
}
