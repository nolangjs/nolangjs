const nl_endpoint = require('./nl_endpoint');
const redis = require("redis");
const logger = global.logger;

/**
 * @desc redis endpoint
 * @example
 {
            type: "redis",
            publishChannel: "channelR*request",
            subscribeChannel: "channelR*response"
        }
 * @type {module.mqtt_nl_endpoint|{}}
 */
module.exports = class mqtt_nl_endpoint extends nl_endpoint{

    async start() {
        let thes = this;

        const client = redis.createClient({url: thes.conf.url});

        client.on('error', (err) => {
            logger.error(err)
        });

        const publisher = client.duplicate();

        client.connect().then(() => {
            logger.info('############     Nolang  Redis endpoint Connected    ############');

            client.pSubscribe(thes.conf.subscribeChannels, function (message, channel) {
                let publishChannel = thes.conf.publishChannels;

                if(thes.conf.subscribeChannels.includes('*') && thes.conf.publishChannels.includes('*')) {
                    let left_right = thes.conf.subscribeChannels.split('*');
                    let left = left_right[0];
                    let right = left_right[1];
                    let sender = channel.substr(left.length,channel.length-left.length-right.length);
                    publishChannel = publishChannel.replace('*',sender);
                }

                let listener = {
                    handler: (response) => {
                        publisher.publish(publishChannel, JSON.stringify(response))
                    }
                }

                //to dont detect reply payloads as command
                // if(req?.$$header){
                thes.nl_endpoint_method(message, listener).then(res => {
                    if(res)
                        publisher.publish(publishChannel, JSON.stringify(res))
                });
            })
        });

        await publisher.connect();

        client.on('disconnect', function (){
            listener.handler = null;
        })
    }
}
