const nl_endpoint = require('./nl_endpoint');
const mqtt = require('mqtt');
const logger = global.logger;

/**
 * @desc mqtt endpoint
 * @example
 {
            type: "mqtt",
            url: "mqtt://test.mosquitto.org",
            publishTopic: "chatroom/+/req",
            subscribeTopic: "chatroom/+/res"
        }
 * @type {module.mqtt_nl_endpoint|{}}
 */
module.exports = class mqtt_nl_endpoint extends nl_endpoint{

    async start() {
        let thes = this;

        const client  = mqtt.connect(thes.conf.url, this.conf.options)

        client.on('connect', function () {
            logger.log('############     Nolang  Mqtt Connected    ############')
            client.subscribe(thes.conf.subscribeTopic, function (err) {
                if (err) {
                    logger.error(err)
                    //client.publish('presence', 'Hello mqtt')
                }
            })
        })

        /**
         * topic : this microservice id/client microservice id/command
         */
        client.on('message', function (topic, message) {
            // message is Buffer
            // console.log(topic, message.toString())

            let publishTopic = thes.conf.publishTopic;

            if(thes.conf.subscribeTopic.includes('/') && thes.conf.publishTopic.includes('/') && topic.includes('/')) {
                let senderIndex = thes.conf.subscribeTopic.split('/').findIndex(s=>s==='+');
                let sender = topic.split('/')[senderIndex];
                publishTopic = publishTopic.replace('+',sender);
            }

            let listener = {
                handler: (response) => {
                    client.publish(publishTopic, JSON.stringify(response))
                }
            }

            //to dont detect reply payloads as command
            // if(req?.$$header){
                thes.nl_endpoint_method(message.toString(), listener).then(res => {
                    if(res)
                        client.publish(publishTopic, JSON.stringify(res))
                });
            // }
        })

        client.on('disconnect', function (){
            listener.handler = null;
        })
    }
}
