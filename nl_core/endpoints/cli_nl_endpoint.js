const nl_endpoint = require('./nl_endpoint');
const JSON5 = require('json5');
const readline = require("node:readline");//todo use autocomplete
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
            // logger.log('Enter NoScript:', line);

            try{
                let req = JSON5.parse(line);

                thes.nl_endpoint_method(req, listener)
                    .then(res => console.table(res))
                    .catch (err => logger.error(err));
            } catch (err){
                logger.error(err.message);
            }

        });

        rl.on('close', ()=>{
            listener.handler = null;
        })
    }
}
