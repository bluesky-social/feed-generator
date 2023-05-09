import { ROARR_VERSION } from '../config';
import { type RoarrGlobalState } from '../types';
import compareSemver from 'semver-compare';

export const createRoarrInitialGlobalStateBrowser = (
  currentState: any,
): RoarrGlobalState => {
  const versions = (currentState.versions || []).concat();

  if (versions.length > 1) {
    versions.sort(compareSemver);
  }

  if (!versions.includes(ROARR_VERSION)) {
    versions.push(ROARR_VERSION);
  }

  versions.sort(compareSemver);

  return {
    sequence: 0,
    ...currentState,
    versions,
  };
};
