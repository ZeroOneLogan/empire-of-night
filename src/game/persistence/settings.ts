import type { SettingsState } from '../simulation/types';

const STORAGE_KEY = 'empire-of-night.settings.v1';

export const defaultSettings = (): SettingsState => ({
  muted: false,
  reducedMotion: false,
});

export const loadSettings = (): SettingsState => {
  if (typeof window === 'undefined') {
    return defaultSettings();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultSettings();
  }

  try {
    return {
      ...defaultSettings(),
      ...(JSON.parse(raw) as Partial<SettingsState>),
    };
  } catch {
    return defaultSettings();
  }
};

export const saveSettings = (settings: SettingsState): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
