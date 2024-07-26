const nl_endpoint = require('./nl_endpoint');
const express = require('express');
// const bodyParser = require('body-parser');
// const express_ws = require('express-ws');
const WebSocketServer = require('ws');
const cookieParser = require('cookie-parser');

const path = require('path');
const fs = require('fs');
const logger = global.logger;
let _reloadReturned;

/**
 * @desc http endpoint
 * @type {module.http_nl_endpoint}
 */
module.exports = class http_nl_endpoint extends nl_endpoint {

    async start() {
        const app = express();
        app.use(cookieParser());

        const port = this.conf.port;

        function customHeaders( req, res, next ){
            app.disable( 'x-powered-by' );

            res.setHeader( 'X-Powered-By', 'Nolang Http Endpoint' );

            next();
        }

        app.use( customHeaders );

        let thes = this;

        //public folder
        const staticPath = this.conf.static;
        if(staticPath) {
            let publicPath;
            if(path.isAbsolute(staticPath)) {
                publicPath = staticPath;
            } else {
                publicPath = path.join(global.appPath, staticPath)
            }
            app.use(express.static(publicPath));
        }

        //cors for all
        if(this.conf.cors) {
            const cors = require('cors');
            app.use(cors(this.conf.cors))
        }

        //filter for all
        if(this.conf.filter) {
            const ipfilter = require('express-ipfilter').IpFilter;
            app.use(ipfilter(this.conf.filter.ips, {mode: this.conf.filter.mode}));

            const {IpDeniedError} = require("express-ipfilter");
            app.use((err, req, res, _next) => {
                console.log('Error handler', err)
                if (err instanceof IpDeniedError) {
                    res.status(err.status || 401).json({'error':err, 'message': 'Your ip has not access'})
                } else {
                    res.status(err.status || 500)
                }

                res.render('error', {
                    message: 'You shall not pass',
                    error: err
                })
            })
        }

        //file upload for all
        let uploadRoot = '';
        if(this.conf.upload) {
            const fileUpload = require("express-fileupload");
            app.use(fileUpload({
                limits: { fileSize: 500 * 1024 * 1024 },
            }));
            uploadRoot = this.conf.upload.root;
            if(!path.isAbsolute(uploadRoot)) {
                uploadRoot = path.join(global.appPath, uploadRoot)
            }
        }

        //helmet
        //https://helmetjs.github.io/
        //todo test helmet
        if(this.conf.helmet) {
            const helmet = require("helmet");
            app.use(helmet(this.conf.helmet));
        }

        //routes handlers
        if(this.conf.routes && this.conf.routes.length > 0)
        for(let route of this.conf.routes) {
            const method = route.method.toLowerCase();
            let _cors = (req, res, next)=>next();

            //cors for route
            if(route.cors){
                const cors = require('cors');
                _cors = cors(route.cors);
            }

            // app.use(bodyParser.json());
            let bp = 'json';
            let opt = {};
            if(route.bodyParser) {
                if(typeof route.bodyParser === 'string')
                    bp = route.bodyParser;
                else {
                    bp = route.bodyParser.method;
                    opt = route.bodyParser.opt || {};
                }
            }

            if(method === 'ws') {} else
                /*const expressWs = express_ws(app);

                //listen to every web socket connection
                app[method].bind(app)(route.path, _cors , (ws, req) => {
                    //listener method if msg has listen //todo describe concept "listeners"
                    let listener = {
                        handler: (response) => {
                            ws.send(JSON.stringify(response));
                        }
                    }
                    ws.on('message', (msg) => {
                        thes.nl_endpoint_method(msg, listener, {request: req}).then(response=>{
                            ws.send(JSON.stringify(response));
                        })
                    });

                    ws.on('close', function close() {
                        logger.debug('websocket disconnected');
                        //set listener to null to prevent to listen more
                        listener.handler = null;
                    });
                })
            }*/
            //create a handler method bounded to "app" with path "route.path"
            //which runs nl_endpoint_method , by command "route.return" or "req.body"
            app[method].bind(app)(route.path, [_cors, express[bp](opt)] , (req, res)=>{
                let command = route.return || req.body;
                if(req.files && req.body.command) {
                    command = JSON.parse(req.body.command);
                    for (let fileKey of Object.keys(req.files) ) {
                        let file = req.files[fileKey];
                        if (this.conf.upload.maxSize) {
                            if(this.conf.upload.maxSize<file.size){
                                res.status(500).json({success: false, message: 'big file'});
                                return;
                            }
                        }
                        let fileExt = path.extname(file.name);
                        if(!fileExt || fileExt === '') {
                            fileExt = '.' + require('mime').extension(file.mimetype);
                        }
                        command[fileKey] = {
                            fileName: file.name,
                            size: file.size,
                            ext: fileExt
                        }
                    }
                }
                let listener = {};
                let _env = {
                    request: {
                        params: req.params,
                        body: req.body,
                        query: req.query,
                        url: req.url,
                        headers: req.headers,
                        cookies: req.cookies,
                        signedCookies: req.signedCookies,
                        z: Math.random()
                    }
                };
                let _req = {
                    data: command,
                    env: _env
                }
                const ST = require('stjs');
                command = ST.select(_req).transformWith(command).root();
                //check is listener for SSE
                if(command?.$$header?.listen) {
                    res.set({
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'text/event-stream',
                        'Connection': 'keep-alive'
                    });
                    res.flushHeaders();
                    // Tell the client to retry every 10 seconds if connectivity is lost
                    // res.write('retry: 10000\n\n');
                    listener = {
                        handler: (response) => {
                            res.write(`data: ${JSON.stringify(response)}\n\n`);
                        }
                    }

                    res.on('close', ()=>{
                        //delete listener handler
                        listener.handler = null;
                    })
                    thes.nl_endpoint_method(command, listener, _env).then(response=>{
                        //res.json(response);
                        res.write(`retry: 10000\n\ndata: ${JSON.stringify(response)}\n\n`);
                    })
                    return;//ignore rest of handler
                }

                thes.nl_endpoint_method(command, listener, _env).then(response=>{
                    //check upload files
                    if(req.files){
                        try {
                            for (let fileKey of Object.keys(req.files) ) {
                                let file = req.files[fileKey];
                                let fileExt = path.extname(file.name);
                                if(!fileExt || fileExt === '') {
                                    fileExt = '.' + require('mime').extension(file.mimetype);
                                }
                                try {
                                    let filePath = path.join(uploadRoot, command.$$schema, response?.$$objid+'');
                                    if(!fs.existsSync(filePath))
                                        fs.mkdirSync(filePath, {recursive: true});
                                    file.mv(filePath+'/'+fileKey+fileExt, (err)=>{
                                        // if (err)
                                        // return res.status(500).send(err);
                                        ;
                                    })
                                } catch (e) {
                                    logger.error('file could not be saved!', e.message)
                                }
                            }
                        } catch (e) {
                            logger.error(e)
                        }

                    }

                    //cookies
                    if(route.type === 'json') {//todo, how to set cookies for non json types
                        if(response?.cookie) {
                            for(let [name,value] of Object.entries(response.cookie.vals)) {
                                res.cookie(name, value, response.cookie.options );
                            }
                        }
                    }

                    res.type(route.type || 'json');
                    res.send(response);
                })
            })
        }

        let doListen = ()=>{
            let httpServer;
            if(this.conf.https && this.conf.https.enabled) {
                const https = require('https');
                const privateKey = fs.readFileSync(this.conf.https.privateKey, 'utf8');
                const certificate = fs.readFileSync(this.conf.https.certificate, 'utf8');
                const ca = this.conf.https.ca ? fs.readFileSync(this.conf.https.ca, 'utf8') : null;
                const credentials = {
                    key: privateKey,
                    cert: certificate,
                    ca: ca
                };
                httpServer = https.createServer(credentials, app);
                httpServer.listen(this.conf.https.port || 443, () => {
                    logger.log('######    Nolang HTTPS Server running on port '+(this.conf.https.port || 443) + '    ######');
                });
            } else {
                httpServer = app.listen(port, () => {
                    logger.log(`############     Nolang HTTP listening on port ${port}    ############`)
                })
            }


            const wss = new WebSocketServer.Server({server: httpServer });

            wss.on("connection", ws => {
                //Execute on connection

                let listener = {
                    handler: (response) => {
                        ws.send(JSON.stringify(response));
                    }
                }


                //Execute when recieving data
                ws.on("message", raw_data => {
                    logger.log(`Received: ${raw_data}`);

                    //Parse the data, execute the event.
                    try {
                        let data = JSON.parse(raw_data)
                        // let event = new Event(data.type, socket, data)
                        // event.Execute();

                        thes.nl_endpoint_method(data, listener, {}).then(response=>{
                            ws.send(JSON.stringify(response));
                        })
                    } catch (err) {
                        logger.error(err);
                        ws.send(JSON.stringify({success: false, type: err.type, error: err.message}))
                    }
                })

                //Execute on disconnect
                ws.on("close", () => {
                    logger.log('socket disconnected!')
                })

                //Execute on error
                ws.onerror = error =>{
                    logger.log(`Client Error: ${error}`);
                }
            });
        }

        if(this.conf?.watch) {
            const reload_ = require('reload');
            let opt = {};
            if(typeof this.conf.watch === "number") {
                logger.info('http reload is activated on port '+ this.conf.watch);
                opt.port = this.conf.watch;
            }
            reload_(app, opt).then(function (reloadReturned) {
                // reloadReturned is documented in the returns API in the README
                // Reload started, start web server
                /*server.listen(app.get('port'), function () {
                    console.log('Web server listening on port ' + app.get('port'))
                })*/
                _reloadReturned = reloadReturned;
                doListen();
            }).catch(function (err) {
                console.error('Reload could not start, could not start server/sample app', err)
            })
        } else {
            doListen();
        }
    }

    reload() {
        _reloadReturned?.reload();
    }
}
