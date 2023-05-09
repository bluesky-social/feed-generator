import { ROARR_VERSION } from '../config';
import { type RoarrGlobalState } from '../types';
import { createNodeWriter } from './createNodeWriter';
import compareSemver from 'semver-compare';

export const createRoarrInitialGlobalState = (
  currentState: any,
): RoarrGlobalState => {
  const versions = (currentState.versions || []).concat();

  if (versions.length > 1) {
    versions.sort(compareSemver);
  }

  const currentIsLatestVersion =
    !versions.length ||
    compareSemver(ROARR_VERSION, versions[versions.length - 1]) === 1;

  if (!versions.includes(ROARR_VERSION)) {
    versions.push(ROARR_VERSION);
  }

  versions.sort(compareSemver);

  let newState = {
    onceLog: new Set<string>(),
    sequence: 0,
    ...currentState,
    versions,
  };

  if (currentIsLatestVersion || !newState.write) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const AsyncLocalStorage = require('node:async_hooks').AsyncLocalStorage;

      const asyncLocalStorage = new AsyncLocalStorage();

      newState = {
        ...newState,

        asyncLocalStorage,
        write: createNodeWriter(),
      };
      // eslint-disable-next-line no-empty
    } catch {}
  }

  return newState;
};
