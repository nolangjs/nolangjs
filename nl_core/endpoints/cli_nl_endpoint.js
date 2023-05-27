const nl_endpoint = require('./nl_endpoint');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const logger = global.logger;

/**
 * @desc cli endpoint
 * @type {module.cli_nl_endpoint|{}}
 */
module.exports = class cli_nl_endpoint extends nl_endpoint{

    async start(){
        logger.log('#############################################')
        logger.log('############     Nolang  CLI     ############')
        logger.log('#############################################')
        let thes = this;
        let listener = {
            handler: (response) => {
                logger.log(response);
            }
        }
        rl.on('line', async function (line) {
            logger.log('user:', line);

            try{
                let req = JSON.parse(line);

                thes.nl_endpoint_method(req, listener).then(res => {
                    logger.log(res);
                });
            } catch (err){
                logger.error(err);
            }

        });

        rl.on('close', ()=>{
            listener.handler = null;
        })
    }
}
