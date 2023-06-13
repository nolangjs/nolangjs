const { parentPort } = require('worker_threads');
const endpoint = require(__dirname+'/nl_index');

parentPort.once('message', async (message) => {
    console.log(message)
    let result = await endpoint(message.packet, message.listener, message.env);
    parentPort.postMessage(result);
});


//todo use workerpool or Piscina or poolifier
