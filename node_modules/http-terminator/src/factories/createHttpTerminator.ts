import type {
  HttpTerminator,
  HttpTerminatorConfigurationInput,
} from '../types';
import {
  createInternalHttpTerminator,
} from './createInternalHttpTerminator';

export const createHttpTerminator = (
  configurationInput: HttpTerminatorConfigurationInput,
): HttpTerminator => {
  const httpTerminator = createInternalHttpTerminator(configurationInput);

  return {
    terminate: httpTerminator.terminate,
  };
};
