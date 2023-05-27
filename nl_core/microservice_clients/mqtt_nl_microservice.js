const nl_microservice = require('./nl_microservice');
const mqtt = require('mqtt');
const logger = global.logger;

/**
 *@example
  {
            name: "chatrooms",
            type: "mqtt",
            url: "mqtt://test.mosquitto.org",
            publishTopic: "chatroom/client1/req",
            subscribeTopic: "chatroom/client1/res"
        }
 * @type {module.mqtt_nl_microservice}
 */
module.exports = class mqtt_nl_microservice extends nl_microservice{

    constructor(conf) {
        super(conf);
        let thes = this;
        this.client  = mqtt.connect(this.conf.url, this.conf.options)


        this.client.on('connect', function () {
            logger.log('############     Microservice Mqtt '+thes.conf.name+ ' Connected    ############')
            thes.client.subscribe(thes.conf.subscribeTopic, function (err) {
                if (err) {
                    logger.error(err)
                    //client.publish('presence', 'Hello mqtt')
                }
            })
        })

        this.client.on('disconnect', function () {
            logger.debug('mqtt microservice '+thes.conf.name+ ' disconnected');
        })
    }

    async runPacket(packet) {
        let thes = this;

        let resolveFunc = resolve => {
            /**
             * topic : this microservice id/client microservice id/command
             */
            thes.client.on('message', function (topic, message) {
                // message is Buffer
                resolve(JSON.parse(message.toString()))
            })
        };

        let rejectFunc = reject => {
            thes.client.on('disconnect', function () {
                reject({success: false, error:'mqtt connection disconnected'});
            })
        };

        thes.client.publish(thes.conf.publishTopic, JSON.stringify(packet));

        return new Promise(resolveFunc, rejectFunc);
    }
}
