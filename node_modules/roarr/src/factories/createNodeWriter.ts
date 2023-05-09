import { type LogWriter } from '../types';

const createBlockingWriter = (stream: NodeJS.WritableStream): LogWriter => {
  return (message: string) => {
    stream.write(message + '\n');
  };
};

export const createNodeWriter = (): LogWriter => {
  // eslint-disable-next-line node/no-process-env
  const targetStream = (process.env.ROARR_STREAM ?? 'STDOUT').toUpperCase();

  const stream =
    targetStream.toUpperCase() === 'STDOUT' ? process.stdout : process.stderr;

  stream.on('error', (error) => {
    if (error.code === 'EPIPE') {
      return;
    }

    throw error;
  });

  return createBlockingWriter(stream);
};
