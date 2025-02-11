const { createLogger, format, transports } = require('winston');
const {join} = require("node:path");
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `LOGFROM::: ${timestamp} ${level}: ${message}`;
});
const getLabel = function(callingModule) {
    const parts = callingModule.filename.split(path.sep);
    return join(parts[parts.length - 2], parts.pop());
};
const logger = createLogger({
    level: 'debug',
    format: combine(
        timestamp(),
        myFormat
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or higher to `error.log`
        //   (i.e., error, fatal, but not other levels)
        //
        // new transports.File({ filename: 'error.log', level: 'error' }),
        //
        // - Write all logs with importance level of `info` or higher to `combined.log`
        //   (i.e., fatal, error, warn, and info, but not trace)
        //
        new transports.File({ filename: 'app.log' }),
        new transports.Console()
    ],
});
logger.error('Logger ready')
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
console.log(typeof logger)
module.exports = {logger};