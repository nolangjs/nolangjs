const nl_endpoint = require('./nl_endpoint');
const logger = global.logger;

/**
 * @desc endpoint on a ipc without a port
 * @type {module.ipc_nl_endpoint}
 */
module.exports = class ipc_nl_endpoint extends nl_endpoint{

    async start(){
        let thes = this;

        const ipc = require('node-ipc').default;

        Object.assign(ipc.config, this.conf);
        // ipc.config.id = this.conf.id;
        // ipc.config.silent = true;

        let listener = {};

        ipc.serve(() => {
            logger.log(`############     Nolang IPC listening on id ${this.conf.id}    ############`)
            ipc.server.on('connect', () => {
                logger.log('client connected');
            });

            ipc.server.on('message', (data, socket) => {
                logger.log('Received message:', data);

                try{
                    let command = JSON.parse(data.toString());

                    if(command.$$header?.listen){
                        listener = {
                            handler: (response)=>{
                                try{
                                    ipc.server.emit(socket, 'message', JSON.stringify(response));
                                } catch (err0) {
                                    logger.error(err0);
                                }
                            }
                        }
                    }
                    thes.nl_endpoint_method(command, listener, {}).then(res => {
                        try{
                            ipc.server.emit(socket, 'message', JSON.stringify(res));
                        } catch (err0) {
                            logger.error(err0);
                        }
                    });
                } catch (err){
                    logger.error(err, data.toString());
                }
            });
        });

        ipc.server.start();


    }
}
