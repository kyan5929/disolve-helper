var winston = require('winston')
module.exports = function (file) {
  var logger = new(winston.Logger)({
    level: process.env.LOG_LEVEL || 'debug',
    transports: [
      new winston.transports.Console({ colorize: true }),
      new winston.transports.File({ filename: `${__dirname}/${file}` })
    ]
  })
  return logger
}