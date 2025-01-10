#! /usr/bin/env node
// #! /usr/bin/env node --no-warnings


const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
let pargv = process.argv;
pargv[1] = 'nolang'

const argv = yargs(hideBin(pargv))
    .command({
        command: '*',
        describe: 'runs nolang apps',
        builder: {
            app: {
                alias: 'a',
                type: 'string',
                description: 'File name of app for example app.json5',
                demandOption: false,
                // default: 'app.json5'
            },
            dir: {
                alias: 'd',
                type: 'string',
                description: 'Path of app',
            }
        },
        handler: (argv) => {
            let appFile = argv._[0] || argv.app;
            let appPath = argv._[1] || argv.dir || process.cwd();

            run(appFile, appPath)
        }
    })
    .command({
        command: 'init',
        // desc: "Creates a new Nolang project with a basic structure",
        builder: {
            name: {
                alias: 'n',
                type: 'string',
                description: 'The name of the new project',
                demandOption: true,
            }
        },
        handler: (argv) => {
            //todo
        }
    })
    // .example('$0 count -f foo.js', 'count the lines in the given file')
    .help()
    .alias('help', 'h')
    .alias('version', 'v')
    .demandCommand(1, 'Please provide a command')
    .epilog('For more information, visit: https://www.nolang.org')
    .epilog('Please send feedback to info@nolang.org')
    .epilog('Or add your issues at https://github.com/nolangjs/nolangjs/issues')
    .parse();

function run(appName, appPath) {
    const nlCompiler = require('./nl_index');
    appPath = path.resolve(appPath)

    global.appPath = appPath;
    let appConf;
    if(appName) {
        let _path = path.join(appPath, appName);
        if (fs.existsSync(_path)) {
            // console.log('----------', fs.stat)
            appConf = require(_path);
        } else {
            console.error('Error: app name or path is not true!' )
            return
        }
    } else {
        if (fs.existsSync(path.join(appPath, 'app.json5'))) {
            // console.log('----------', fs.stat)
            appConf = require(path.join(appPath, 'app.json5'));
            appName = 'app.json5';
        } else if (fs.existsSync(path.join(appPath, 'app.json'))){
            appConf = require(path.join(appPath, 'app.json'));
            appName = 'app.json';
        } else {
            appConf = {
                schemas: {
                    adapter: "file",
                    path: global.appPath
                },
                endpoints: [
                    {
                        type: 'http',
                        port: process.argv[2] || 3000,
                        routes: [
                            {
                                path: '/',
                                method: 'post'
                            },
                            {
                                path: '/',
                                method: 'get',
                                return: {$$res: {
                                        "status": 404
                                    }}
                            }
                        ]
                    }
                ]
            };
            appName = '[?]'
        }
    }

    console.log(`Running ${appPath}/${appName || '?'} ...`);

    if(appConf?.cluster) {
        const cluster = require('cluster');
        cluster.schedulingPolicy = cluster.SCHED_RR;
        const process1 = require('process');
        let numCPUs = require('os').cpus().length;

        if((typeof appConf.cluster === 'number') && (appConf.cluster > 0) && (appConf.cluster<numCPUs)){
            numCPUs = appConf.cluster;
        }

        if (cluster.isMaster) {
            logger.trace(`Primary ${process1.pid} is running`);

            // Fork workers.
            for (let i = 0; i < numCPUs; i++) {
                logger.log('Run Nolang on cluster ' + (i + 1))
                cluster.fork();
            }

            cluster.on('exit', (worker, code, signal) => {
                logger.log(`worker ${worker.process.pid} died`);
            });
        } else {
            const _nlCompiler = new nlCompiler(appName, appConf);
        }
    } else {
        const _nlCompiler = new nlCompiler(appName, appConf);
    }
}
