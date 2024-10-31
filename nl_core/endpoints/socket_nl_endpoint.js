const nl_endpoint = require('./nl_endpoint');
const logger = global.logger;

/**
 * @desc endpoint on a socket with a port
 * @type {module.socket_nl_endpoint}
 */
module.exports = class socket_nl_endpoint extends nl_endpoint{

    async start(){
        let thes = this;

        const net = require('net');
        const server = net.createServer((c) => {
            // 'connection' listener.
            logger.log('client connected--'+c.remoteAddress);
            let listener = {};
            c.on('data', data => {
                try{
                    let command = JSON.parse(data.toString());

                    if(command.$$header?.listen){
                        listener = {
                            handler: (response)=>{
                                try{
                                    c.write(JSON.stringify(response));
                                } catch (err0) {
                                    logger.error(err0);
                                }
                            }
                        }
                    }
                    thes.nl_endpoint_method(command, listener, {}).then(res => {
                        try{
                            c.write(JSON.stringify(res));
                        } catch (err0) {
                            logger.error(err0);
                        }
                    });
                } catch (err){
                    logger.error(err, data.toString());
                }
            })
            c.on('end', () => {
                logger.info('client disconnected--'+c.remoteAddress);
                listener.handler = null;
            });
            c.write('{"Nolang":"Hello"}');
            c.pipe(c);
        });
        server.on('error', (err) => {
            throw err;
        });
        server.listen(this.conf.port, () => {
            logger.info(`############     Nolang  Socket on port ${thes.conf.port}  ############`)
        });
    }
}
