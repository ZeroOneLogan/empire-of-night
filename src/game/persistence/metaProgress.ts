import type { MetaProgress } from '../simulation/types';

const STORAGE_KEY = 'empire-of-night.meta.v1';

export const defaultMetaProgress = (): MetaProgress => ({
  version: 1,
  completedRuns: 0,
  victories: 0,
  unlockedRelics: [],
  lastRunResult: 'none',
  runHistory: [],
});

export const loadMetaProgress = (): MetaProgress => {
  if (typeof window === 'undefined') {
    return defaultMetaProgress();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultMetaProgress();
  }

  try {
    const parsed = JSON.parse(raw) as MetaProgress;
    if (parsed.version !== 1) {
      return defaultMetaProgress();
    }
    return {
      ...defaultMetaProgress(),
      ...parsed,
      unlockedRelics: Array.isArray(parsed.unlockedRelics) ? parsed.unlockedRelics : [],
      runHistory: Array.isArray(parsed.runHistory) ? parsed.runHistory : [],
    };
  } catch {
    return defaultMetaProgress();
  }
};

export const saveMetaProgress = (meta: MetaProgress): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
};
