import { logLevels } from '../constants';
import {
  type Logger,
  type MessageContext,
  type MessageEventHandler,
} from '../types';

const createChildLogger = (log: Logger, logLevel: number) => {
  return (a, b, c, d, e, f, g, h, index, index_) => {
    log.child({
      logLevel,
    })(a, b, c, d, e, f, g, h, index, index_);
  };
};

export const createMockLogger = (
  onMessage: MessageEventHandler,
  parentContext?: MessageContext,
): Logger => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const log: Logger = () => {
    return undefined;
  };

  log.adopt = async (routine) => {
    return routine();
  };

  log.child = () => {
    return createMockLogger(onMessage, parentContext);
  };

  log.getContext = () => {
    return {};
  };

  log.debug = createChildLogger(log, logLevels.debug);
  log.debugOnce = createChildLogger(log, logLevels.debug);
  log.error = createChildLogger(log, logLevels.error);
  log.errorOnce = createChildLogger(log, logLevels.error);
  log.fatal = createChildLogger(log, logLevels.fatal);
  log.fatalOnce = createChildLogger(log, logLevels.fatal);
  log.info = createChildLogger(log, logLevels.info);
  log.infoOnce = createChildLogger(log, logLevels.info);
  log.trace = createChildLogger(log, logLevels.trace);
  log.traceOnce = createChildLogger(log, logLevels.trace);
  log.warn = createChildLogger(log, logLevels.warn);
  log.warnOnce = createChildLogger(log, logLevels.warn);

  return log;
};
