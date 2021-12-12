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

export default {
  error: currentLogLevel >= LogLevel.error ? console.error : noOp,
  warn: currentLogLevel >= LogLevel.warn ? console.warn : noOp,
  info: currentLogLevel >= LogLevel.info ? console.log : noOp,
  debug: currentLogLevel >= LogLevel.debug ? console.debug : noOp,
};
