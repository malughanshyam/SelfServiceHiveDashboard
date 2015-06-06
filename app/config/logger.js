var winston = require('winston');

winston.setLevels({
    debug:0,
    info: 1,
    silly:2,
    warn: 3,
    error:4,
});

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
    level: 'info',
    colorize: true,
    label: 'High Level Log',
    exitOnError: false,
    prettyPrint:true
  },
  file: {
    level: 'info',
    colorize: true,
    filename: './logs/HighLevelLog.log',
    exitOnError: false,
    prettyPrint:true
  }
});


//
// Configure the logger for 'Detailed Logs'
//
winston.loggers.add('DetailedLog', {
  console: {
    level: 'verbose',
    colorize: true,
    label: 'Detailed Log',
    exitOnError: false,
    handleExceptions: true,
    prettyPrint:true
  },
  file: {
    level: 'verbose',
    colorize: true,
    filename: './logs/DetailedLog.log',
    exitOnError: false,
    handleExceptions: true,
    prettyPrint:true
  }
});
