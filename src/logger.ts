import appConfig from '../appConfig.json';

const noOp = () => {
  /* intentionally left empty */
};

enum LogLevel {
  error,
  warn,
  info,
  debug,
}

const getLogLevelsAsStringArray = () => Object.keys(LogLevel).filter((value: any) => !isFinite(value));

const currentLogLevel = LogLevel[appConfig.logLevel as keyof typeof LogLevel];
if (!currentLogLevel) {
  // instantiate error message outside the Error instance
  // this is because the stack trace looks horrible otherwise on standard output
  const errorMessage = `[Logger] ERROR - Invalid log level in appConfig.json: ${
    appConfig.logLevel
  }. It must be one of (case-sensitive): ${getLogLevelsAsStringArray()}`;
  throw new Error(errorMessage);
}

/* eslint-disable @typescript-eslint/ban-types */
const logWithTimestamp = (logLevel: LogLevel, consoleFn: Function) => {
  const logLevelPrefix = LogLevel[logLevel].toUpperCase();
  return (...args: any[]) => {
    const now = new Date();
    return consoleFn(`[${now.getTime()}]`, `[${now.toISOString()}]`, `[${logLevelPrefix}]`, ...args);
  };
}; /* eslint-enable */

export default {
  error: currentLogLevel >= LogLevel.error ? logWithTimestamp(LogLevel.error, console.error) : noOp,
  warn: currentLogLevel >= LogLevel.warn ? logWithTimestamp(LogLevel.warn, console.warn) : noOp,
  info: currentLogLevel >= LogLevel.info ? logWithTimestamp(LogLevel.info, console.log) : noOp,
  debug: currentLogLevel >= LogLevel.debug ? logWithTimestamp(LogLevel.debug, console.debug) : noOp,
};
