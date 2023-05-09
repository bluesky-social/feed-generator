import { type LogLevelName } from './types';

export const getLogLevelName = (numericLogLevel: number): LogLevelName => {
  if (numericLogLevel <= 10) {
    return 'trace';
  }

  if (numericLogLevel <= 20) {
    return 'debug';
  }

  if (numericLogLevel <= 30) {
    return 'info';
  }

  if (numericLogLevel <= 40) {
    return 'warn';
  }

  if (numericLogLevel <= 50) {
    return 'error';
  }

  return 'fatal';
};
