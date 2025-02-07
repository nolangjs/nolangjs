const path = require('path');

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, json, printf } = format;
const winston = require('winston');

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        verbose: 3,
        debug: 4,
        silly: 5,
        trace: 6 // Adding custom trace level
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        verbose: 'cyan',
        debug: 'blue',
        silly: 'magenta',
        trace: 'gray' // Adding custom color for trace level
    }
};

// Apply custom colors to Winston
winston.addColors(customLevels.colors);

// Define a custom log format
const logFormat = printf(({ timestamp, level, message }) => {
    if(typeof message === 'object')
        message = JSON.stringify(message, null, 4)
    return `${timestamp} ${level}: ${message}`;
});

let _transports = [
    new transports.Console({ format: combine(timestamp(),colorize(), logFormat) })
];

// Create a Winston logger with separate file transports for each log level
const logger = createLogger({
    levels: customLevels.levels,
    format: timestamp(),
    transports: _transports
});


class nl_logger {

    constructor() {
        this.Logger = logger
    }

    opt = null

    setOptions(opt) {
        if (opt.files) {

            for (let level in opt.files) {
                let destination = opt.files[level];
                if (!path.isAbsolute(destination)) {
                    destination = path.join(global.appPath, destination);
                }

                _transports.push(
                    new transports.File({ filename: destination, level: level, format: json() })
                )
            }
            this.Logger = createLogger({
                levels: customLevels.levels,
                format: timestamp(),
                transports: _transports
            });
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

    log(msg, level, _data) {
        let data = _data ? {..._data} : null;
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
        let _logger = this.Logger;
        if(!_logger) return;
        switch (level) {
            case 'fatal':
                _logger.fatal(msg);
                break;
            case 'error':
                _logger.error(msg);
                break;
            case 'warn':
                _logger.warn(msg);
                break;
            case 'trace':
                _logger.trace(msg);
                break;
            case 'info':
                _logger.info(msg);
                break;
            case 'debug':
                _logger.debug(msg);
                break;
            default:
                _logger.info(msg);
        }
    }
}

module.exports = nl_logger;
