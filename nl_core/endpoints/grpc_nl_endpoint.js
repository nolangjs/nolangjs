const nl_endpoint = require('./nl_endpoint');
const logger = global.logger;

/**
 * @desc endpoint on a grpc with a port
 * @type {module.grpc_nl_endpoint}
 */
module.exports = class grpc_nl_endpoint extends nl_endpoint {

    async start() {
        let thes = this;

        const grpc = require('@grpc/grpc-js');

        // Define the service and messages directly
        const proto = {
            MyService: {
                MyMethod: {
                    path: this.conf.path || '/',
                    requestStream: false,
                    responseStream: false,
                    // requestType: 'MyRequest',
                    // responseType: 'MyResponse',
                    requestSerialize: (value) => Buffer.from(JSON.stringify(value)),
                    requestDeserialize: (value) => JSON.parse(value.toString()),
                    responseSerialize: (value) => Buffer.from(JSON.stringify(value)),
                    responseDeserialize: (value) => JSON.parse(value.toString()),
                },
            },
        };

        // Implement the service
        const myServiceImplementation = {
            MyMethod: (call, callback) => {
                let listener = {
                    handler: (response) => {
                        callback(null, response)
                    }
                }

                thes.nl_endpoint_method(call.request, listener).then(res => {
                    if(res)
                        callback(null, JSON.stringify(res))
                });
            },
        };

        // Create a server and add the service
        const server = new grpc.Server();
        server.addService(proto.MyService, myServiceImplementation);

        // Start the server
        server.bindAsync(`0.0.0.0:${this.conf.port}`, grpc.ServerCredentials.createInsecure(), () => {
            logger.info(`############     Nolang  gRPC on port ${this.conf.port} path ${this.conf.path}  ############`)
            server.start();
        });
    }

    /*secureSample() {
        const grpc = require('@grpc/grpc-js');
        const fs = require('fs');

// Load SSL certificates
        const serverCert = fs.readFileSync('server.crt');
        const serverKey = fs.readFileSync('server.key');

// Define the service and messages directly
        const proto = {
            MyService: {
                MyMethod: {
                    path: '/MyService/MyMethod',
                    requestStream: false,
                    responseStream: false,
                    requestType: 'MyRequest',
                    responseType: 'MyResponse',
                    requestSerialize: (value) => Buffer.from(JSON.stringify(value)),
                    requestDeserialize: (value) => JSON.parse(value.toString()),
                    responseSerialize: (value) => Buffer.from(JSON.stringify(value)),
                    responseDeserialize: (value) => JSON.parse(value.toString()),
                },
            },
        };

// Implement the service
        const myServiceImplementation = {
            MyMethod: (call, callback) => {
                const name = call.request.name;
                callback(null, { message: `Hello, ${name}` });
            },
        };

// Create a secure server and add the service
        const server = new grpc.Server();
        server.addService(proto.MyService, myServiceImplementation);

// Create server credentials
        const serverCredentials = grpc.ServerCredentials.createSsl(
            null, // No client certificate required
            [{ cert_chain: serverCert, private_key: serverKey }],
            true // Require client certificate
        );

// Start the server
        const PORT = 50051;
        server.bindAsync(`0.0.0.0:${PORT}`, serverCredentials, () => {
            console.log(`Secure server running at https://127.0.0.1:${PORT}`);
            server.start();
        });
    }*/
}
