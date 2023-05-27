const nl_endpoint = require('./nl_endpoint');
const path = require('path');
const logger = global.logger;

/**
 * @desc endpoint from a .js file contains
 * @example
 module.exports = async function (endpoint){
        let res1 = await endpoint({
            $$schema: "user",
            $$header: {
                action: 'R',
                filter: {
                    name: 'fatemeh'
                }
            }
        })
        console.log(res1[0].name)
    }

 * @type {module.file_nl_endpoint|{}}
 */
module.exports = class file_nl_endpoint extends nl_endpoint{

    async start(){
        let filename = this.conf.filename;
        logger.log('############   Script Endpoint '+filename+'  ############');
        try {
            let route = path.isAbsolute(filename) ? filename : path.join(global.appPath, filename);
            let callback = require(route);
            callback(this.nl_endpoint_method);
            /*let listener = {
                handler: (response) => {
                    console.log(response);
                }
            }
            let req = file;
            this.nl_endpoint_method(req, listener).then(res => {
                console.log(res);
            });*/
        } catch (e) {
            logger.error(e.message)
        }
    }
}
