const nl_microservice = require('./nl_microservice');
const axios = require('axios');
// const logger = global.logger;

/**
 * @example
 {
    name: "chatrooms",
    type: "http",
    url: "http://localhost:1000"
 }
 * @type {module.http_nl_microservice}
 */
module.exports = class http_nl_microservice extends nl_microservice{

    async runPacket(packet) {
        let res = await axios({
            method: this.conf.method || 'post',
            url: this.conf.url,
            data: packet
        });
        return res.data;
    }
}
