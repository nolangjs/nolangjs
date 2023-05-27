const path = require('path');
const pino = require('pino');
/*const pretty = require('pino-pretty');*/
/*let pino1 = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
});*/
/*let pinoLogger = pino(pretty(/!*{
    colorize: true
}*!/));*/

let targets = [{
    level: 'info',
    target: 'pino-pretty' // must be installed separately
}/*, {
    level: 'trace',
    target: 'pino/file',
    options: { destination: `${__dirname}/combined.log` }
}*/];


class nl_logger {

    getTransport(targets) {
        return pino.transport({
            targets: targets
        });
    }

    constructor() {
        this.pinoLogger = pino(this.getTransport(targets))
    }

    opt = null

    setOptions(opt) {
        if (opt.files) {
            let targets = [{
                level: 'trace',
                target: 'pino-pretty' // must be installed separately
            }];
            for (let level in opt.files) {
                let destination = opt.files[level];
                if (!path.isAbsolute(destination)) {
                    destination = path.join(global.appPath, destination);
                }

                targets.push({
                    level: level,
                    target: 'pino/file',
                    options: {destination: destination}
                })
            }
            this.pinoLogger = pino(this.getTransport(targets));
        }
    }

    /*levels = {
        emerg: 80,
        alert: 70,
        crit: 60,
        error: 50,
        warn: 40,
        notice: 30,
        info: 20,
        debug: 10,
    }*/

    fatal(msg, data) {
        this.log(msg, 'fatal', data);
    }

    error(msg, data) {
        this.log(msg, 'error', data);
    }

    warn(msg, data) {
        this.log(msg, 'warn', data);
    }

    info(msg, data) {
        this.log(msg, 'info', data);
    }

    debug(msg, data) {
        this.log(msg, 'debug', data);
    }

    trace(msg, data) {
        this.log(msg, 'trace', data);
    }

    log(msg, level, data) {
        //format msg
        if (data) {
            if (typeof data === 'object') {
                if (typeof msg === 'object') {
                    Object.assign(msg, data);
                } else {
                    data.msg = msg;
                    msg = data;
                }
            } else {
                if (typeof msg === 'object') {
                    msg.data = data;
                } else {
                    msg = {msg: msg, data: data}
                }
            }
        }
        let pinoLogger = this.pinoLogger;
        if(!pinoLogger) return;
        switch (level) {
            case 'fatal':
                pinoLogger.fatal(msg);
                break;
            case 'error':
                pinoLogger.error(msg);
                break;
            case 'warn':
                pinoLogger.warn(msg);
                break;
            case 'trace':
                pinoLogger.trace(msg);
                break;
            case 'info':
                pinoLogger.info(msg);
                break;
            case 'debug':
                pinoLogger.debug(msg);
                break;
            default:
                pinoLogger.info(msg);
        }
    }
}

module.exports = nl_logger;
