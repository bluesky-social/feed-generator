/* eslint-disable import/order */

import http from 'http';
import waitFor from 'p-wait-for';
import type {
  Duplex,
} from 'stream';
import {
  Logger,
} from '../Logger';
import type {
  HttpTerminatorConfigurationInput,
  InternalHttpTerminator,
} from '../types';

const log = Logger.child({
  namespace: 'createHttpTerminator',
});

const configurationDefaults = {
  gracefulTerminationTimeout: 1_000,
};

export const createInternalHttpTerminator = (
  configurationInput: HttpTerminatorConfigurationInput,
): InternalHttpTerminator => {
  const configuration = {
    ...configurationDefaults,
    ...configurationInput,
  };

  const server = configuration.server;

  const sockets = new Set<Duplex>();
  const secureSockets = new Set<Duplex>();

  let terminating;

  server.on('connection', (socket) => {
    if (terminating) {
      socket.destroy();
    } else {
      sockets.add(socket);

      socket.once('close', () => {
        sockets.delete(socket);
      });
    }
  });

  server.on('secureConnection', (socket) => {
    if (terminating) {
      socket.destroy();
    } else {
      secureSockets.add(socket);

      socket.once('close', () => {
        secureSockets.delete(socket);
      });
    }
  });

  /**
   * Evaluate whether additional steps are required to destroy the socket.
   *
   * @see https://github.com/nodejs/node/blob/57bd715d527aba8dae56b975056961b0e429e91e/lib/_http_client.js#L363-L413
   */
  const destroySocket = (socket) => {
    socket.destroy();

    if (socket.server instanceof http.Server) {
      sockets.delete(socket);
    } else {
      secureSockets.delete(socket);
    }
  };

  const terminate = async () => {
    if (terminating) {
      log.warn('already terminating HTTP server');

      return terminating;
    }

    let resolveTerminating;
    let rejectTerminating;

    terminating = new Promise((resolve, reject) => {
      resolveTerminating = resolve;
      rejectTerminating = reject;
    });

    server.on('request', (incomingMessage, outgoingMessage) => {
      if (!outgoingMessage.headersSent) {
        outgoingMessage.setHeader('connection', 'close');
      }
    });

    for (const socket of sockets) {
      // This is the HTTP CONNECT request socket.
      // @ts-expect-error Unclear if I am using wrong type or how else this should be handled.
      if (!(socket.server instanceof http.Server)) {
        continue;
      }

      // @ts-expect-error Unclear if I am using wrong type or how else this should be handled.
      const serverResponse = socket._httpMessage;

      if (serverResponse) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader('connection', 'close');
        }

        continue;
      }

      destroySocket(socket);
    }

    for (const socket of secureSockets) {
      // @ts-expect-error Unclear if I am using wrong type or how else this should be handled.
      const serverResponse = socket._httpMessage;

      if (serverResponse) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader('connection', 'close');
        }

        continue;
      }

      destroySocket(socket);
    }

    // Wait for all in-flight connections to drain, forcefully terminating any
    // open connections after the given timeout
    try {
      await waitFor(() => {
        return sockets.size === 0 && secureSockets.size === 0;
      }, {
        interval: 10,
        timeout: configuration.gracefulTerminationTimeout,
      });
    } catch {
      // Ignore timeout errors
    } finally {
      for (const socket of sockets) {
        destroySocket(socket);
      }

      for (const socket of secureSockets) {
        destroySocket(socket);
      }
    }

    server.close((error) => {
      if (error) {
        rejectTerminating(error);
      } else {
        resolveTerminating();
      }
    });

    return terminating;
  };

  return {
    secureSockets,
    sockets,
    terminate,
  };
};
