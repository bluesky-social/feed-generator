import { ROARR_LOG_FORMAT_VERSION } from '../config';
import { logLevels } from '../constants';
import {
  type AsyncLocalContext,
  type Logger,
  type MessageContext,
  type MessageEventHandler,
  type RoarrGlobalState,
  type TopLevelAsyncLocalContext,
  type TransformMessageFunction,
} from '../types';
import { hasOwnProperty } from '../utilities';
import { printf } from 'fast-printf';
import createGlobalThis from 'globalthis';
import safeStringify from 'safe-stable-stringify';

let loggedWarningAsyncLocalContext = false;

const globalThis = createGlobalThis();

const getGlobalRoarrContext = (): RoarrGlobalState => {
  return globalThis.ROARR;
};

const createDefaultAsyncLocalContext = (): TopLevelAsyncLocalContext => {
  return {
    messageContext: {},
    transforms: [],
  };
};

const getAsyncLocalContext = (): AsyncLocalContext => {
  const asyncLocalStorage = getGlobalRoarrContext().asyncLocalStorage;

  if (!asyncLocalStorage) {
    throw new Error('AsyncLocalContext is unavailable.');
  }

  const asyncLocalContext = asyncLocalStorage.getStore();

  if (asyncLocalContext) {
    return asyncLocalContext;
  }

  return createDefaultAsyncLocalContext();
};

const isAsyncLocalContextAvailable = (): boolean => {
  return Boolean(getGlobalRoarrContext().asyncLocalStorage);
};

const getSequence = () => {
  if (isAsyncLocalContextAvailable()) {
    const asyncLocalContext = getAsyncLocalContext();

    if (
      hasOwnProperty(asyncLocalContext, 'sequenceRoot') &&
      hasOwnProperty(asyncLocalContext, 'sequence') &&
      typeof asyncLocalContext.sequence === 'number'
    ) {
      return (
        String(asyncLocalContext.sequenceRoot) +
        '.' +
        String(asyncLocalContext.sequence++)
      );
    }

    return String(getGlobalRoarrContext().sequence++);
  }

  return String(getGlobalRoarrContext().sequence++);
};

const createChildLogger = (log: Logger, logLevel: number) => {
  return (a, b, c, d, e, f, g, h, index, index_) => {
    log.child({
      logLevel,
    })(a, b, c, d, e, f, g, h, index, index_);
  };
};

const MAX_ONCE_ENTRIES = 1_000;

const createOnceChildLogger = (log: Logger, logLevel: number) => {
  return (a, b, c, d, e, f, g, h, index, index_) => {
    const key = safeStringify({
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h,
      i: index,
      j: index_,
      logLevel,
    });

    if (!key) {
      throw new Error('Expected key to be a string');
    }

    const onceLog = getGlobalRoarrContext().onceLog;

    if (onceLog.has(key)) {
      return;
    }

    onceLog.add(key);

    if (onceLog.size > MAX_ONCE_ENTRIES) {
      onceLog.clear();
    }

    log.child({
      logLevel,
    })(a, b, c, d, e, f, g, h, index, index_);
  };
};

export const createLogger = (
  onMessage: MessageEventHandler,
  parentMessageContext: MessageContext = {},
  transforms: ReadonlyArray<TransformMessageFunction<MessageContext>> = [],
): Logger => {
  const log = (
    a: any,
    b: any,
    c: any,
    d: any,
    e: any,
    f: any,
    g: any,
    h: any,
    index: any,
    index_: any,
  ) => {
    const time = Date.now();
    const sequence = getSequence();

    let asyncLocalContext: AsyncLocalContext;

    if (isAsyncLocalContextAvailable()) {
      asyncLocalContext = getAsyncLocalContext();
    } else {
      asyncLocalContext = createDefaultAsyncLocalContext();
    }

    let context;
    let message;

    if (typeof a === 'string') {
      context = {
        ...asyncLocalContext.messageContext,
        ...parentMessageContext,
      };
    } else {
      context = {
        ...asyncLocalContext.messageContext,
        ...parentMessageContext,
        ...a,
      };
    }

    if (typeof a === 'string' && b === undefined) {
      message = a;
    } else if (typeof a === 'string') {
      if (!a.includes('%')) {
        throw new Error(
          'When a string parameter is followed by other arguments, then it is assumed that you are attempting to format a message using printf syntax. You either forgot to add printf bindings or if you meant to add context to the log message, pass them in an object as the first parameter.',
        );
      }

      message = printf(a, b, c, d, e, f, g, h, index, index_);
    } else {
      let fallbackMessage = b;

      if (typeof b !== 'string') {
        if (b === undefined) {
          fallbackMessage = '';
        } else {
          throw new TypeError(
            'Message must be a string. Received ' + typeof b + '.',
          );
        }
      }

      message = printf(fallbackMessage, c, d, e, f, g, h, index, index_);
    }

    let packet = {
      context,
      message,
      sequence,
      time,
      version: ROARR_LOG_FORMAT_VERSION,
    };

    for (const transform of [...asyncLocalContext.transforms, ...transforms]) {
      packet = transform(packet);

      if (typeof packet !== 'object' || packet === null) {
        throw new Error(
          'Message transform function must return a message object.',
        );
      }
    }

    onMessage(packet);
  };

  /**
   * Creates a child logger with the provided context.
   * If context is an object, then its properties are prepended to all descending logs.
   * If context is a function, then that function is used to process all descending logs.
   */
  log.child = (context) => {
    let asyncLocalContext: AsyncLocalContext;

    if (isAsyncLocalContextAvailable()) {
      asyncLocalContext = getAsyncLocalContext();
    } else {
      asyncLocalContext = createDefaultAsyncLocalContext();
    }

    if (typeof context === 'function') {
      return createLogger(
        onMessage,
        {
          ...asyncLocalContext.messageContext,
          ...parentMessageContext,
          ...context,
        },
        [context, ...transforms],
      );
    }

    return createLogger(
      onMessage,
      {
        ...asyncLocalContext.messageContext,
        ...parentMessageContext,
        ...context,
      },
      transforms,
    );
  };

  log.getContext = () => {
    let asyncLocalContext: AsyncLocalContext;

    if (isAsyncLocalContextAvailable()) {
      asyncLocalContext = getAsyncLocalContext();
    } else {
      asyncLocalContext = createDefaultAsyncLocalContext();
    }

    return {
      ...asyncLocalContext.messageContext,
      ...parentMessageContext,
    };
  };

  log.adopt = async (routine, context) => {
    if (!isAsyncLocalContextAvailable()) {
      if (loggedWarningAsyncLocalContext === false) {
        loggedWarningAsyncLocalContext = true;

        onMessage({
          context: {
            logLevel: logLevels.warn,
            package: 'roarr',
          },
          message:
            'async_hooks are unavailable; Roarr.adopt will not function as expected',
          sequence: getSequence(),
          time: Date.now(),
          version: ROARR_LOG_FORMAT_VERSION,
        });
      }

      return routine();
    }

    const asyncLocalContext = getAsyncLocalContext();

    let sequenceRoot;

    if (
      hasOwnProperty(asyncLocalContext, 'sequenceRoot') &&
      hasOwnProperty(asyncLocalContext, 'sequence') &&
      typeof asyncLocalContext.sequence === 'number'
    ) {
      sequenceRoot =
        asyncLocalContext.sequenceRoot +
        '.' +
        String(asyncLocalContext.sequence++);
    } else {
      sequenceRoot = String(getGlobalRoarrContext().sequence++);
    }

    let nextContext = {
      ...asyncLocalContext.messageContext,
    };

    const nextTransforms = [...asyncLocalContext.transforms];

    if (typeof context === 'function') {
      nextTransforms.push(context);
    } else {
      nextContext = {
        ...nextContext,
        ...context,
      };
    }

    const asyncLocalStorage = getGlobalRoarrContext().asyncLocalStorage;

    if (!asyncLocalStorage) {
      throw new Error('Async local context unavailable.');
    }

    return asyncLocalStorage.run(
      {
        messageContext: nextContext,
        sequence: 0,
        sequenceRoot,
        transforms: nextTransforms,
      },
      () => {
        return routine();
      },
    );
  };

  log.debug = createChildLogger(log, logLevels.debug);
  log.debugOnce = createOnceChildLogger(log, logLevels.debug);
  log.error = createChildLogger(log, logLevels.error);
  log.errorOnce = createOnceChildLogger(log, logLevels.error);
  log.fatal = createChildLogger(log, logLevels.fatal);
  log.fatalOnce = createOnceChildLogger(log, logLevels.fatal);
  log.info = createChildLogger(log, logLevels.info);
  log.infoOnce = createOnceChildLogger(log, logLevels.info);
  log.trace = createChildLogger(log, logLevels.trace);
  log.traceOnce = createOnceChildLogger(log, logLevels.trace);
  log.warn = createChildLogger(log, logLevels.warn);
  log.warnOnce = createOnceChildLogger(log, logLevels.warn);

  return log;
};
