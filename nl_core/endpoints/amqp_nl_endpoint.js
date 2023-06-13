const nl_endpoint = require('./nl_endpoint');
const amqp = require('amqplib/callback_api');
const logger = global.logger;

/**
 * @desc mqtt endpoint
 * @example
 {
            type: "amqp",
            url: "amqp://localhost",
            queue: "queue1"
        }
 * @type {module.amqp_nl_endpoint|{}}
 */
module.exports = class amqp_nl_endpoint extends nl_endpoint{

    async start() {
        let thes = this;

        amqp.connect(thes.conf.url, function(error0, connection) {
            if (error0) {
                throw error0;
            }
            let subscribeQueue = thes.conf.subscribeQueue;
            let publishQueue = thes.conf.publishQueue;
            connection.createChannel(function(error1, channel) {
                logger.log(`############     Nolang  AMQP ${subscribeQueue}    ############`);
                if (error1) {
                    throw error1;
                }

                channel.assertQueue(subscribeQueue, {durable: false});

                channel.consume(subscribeQueue, function(msg) {
                    let message = msg.content.toString();
                    console.log(" [x] Received %s", message);
                    let listener = {
                        handler: (response) => {
                            channel.sendToQueue(publishQueue, Buffer.from(response));
                        }
                    }

                    thes.nl_endpoint_method(message, listener).then(res => {
                        if(res)
                            channel.sendToQueue(publishQueue, Buffer.from(JSON.stringify(res)));
                    });
                }, {noAck: true});

                channel.on('close', function (){
                    listener.handler = null;
                })
            });
        });
    }
}
