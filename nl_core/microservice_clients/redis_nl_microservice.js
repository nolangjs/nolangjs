const nl_microservice = require('./nl_microservice');
const redis = require("redis");
const logger = global.logger;

/**
 * @example
 {
            name: "chatrooms",
            type: "redis",
            publishChannel: "channelR222request",
            subscribeChannel: "channelR222response"
        }
 * @type {module.redis_nl_microservice}
 */
module.exports = class redis_nl_microservice extends nl_microservice{

    constructor(conf) {
        super(conf);
        let thes = this;
        this.client = redis.createClient({url: thes.conf.url});
        this.publisher = this.client.duplicate();

        this.client.on('error', (err) => {
            logger.error(err)
        });

        this.client.connect().then( function () {
            logger.log('############     Microservice Redis '+thes.conf.name+ ' Connected    ############')

            thes.resolveFunc = (resolve) => {
                thes.client.subscribe(thes.conf.subscribeChannel, (message) => {
                    resolve(JSON.parse(message.toString()))
                })
            };
        })
        this.publisher.connect().then(null);

        this.client.on('disconnect', function () {
            logger.debug('mqtt microservice '+thes.conf.name+ ' disconnected');
        })
    }

    async runPacket(packet) {
        let thes = this;

        let rejectFunc = reject => {
            thes.client.on('disconnect', function () {
                reject({success: false, error:'mqtt connection disconnected'});
            })
        };

        thes.publisher.publish(thes.conf.publishChannel, JSON.stringify(packet));

        return new Promise(thes.resolveFunc, rejectFunc);
    }
}
