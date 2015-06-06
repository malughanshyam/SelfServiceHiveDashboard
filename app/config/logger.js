var winston = require('winston');


winston.addColors({
    debug: 'green',
    info:  'cyan',
    silly: 'magenta',
    warn:  'yellow',
    error: 'red'
});


//
// Configure the logger for 'High Level Logs'
//
winston.loggers.add('HighLevelLog', {
  console: {
    level: 'debug',
    colorize: true,
    label: 'High Level Log',
    exitOnError: false  ,
    //prettyPrint:true
    json:false
  },
  file: {
    level: 'debug',
    // colorize: true,
    filename: './logs/HighLevelLog.log',
    exitOnError: false ,
    // prettyPrint:true,
    // logstash: false,
    json: false
  }
});


//
// Configure the logger for 'Detailed Logs'
//
winston.loggers.add('DetailedLog', {
  console: {
    level: 'debug',
    colorize: true,
    label: 'Detailed Log',
    exitOnError: false,
    handleExceptions: false,
    json: false
//    prettyPrint:true
  },
  file: {
    level: 'debug',
    // colorize: true,
    filename: './logs/DetailedLog.log',
    exitOnError: false,
    handleExceptions: false,
    // prettyPrint:true,
    // logstash: true,
    json: false
  }
});
