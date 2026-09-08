import type { Settings, SettingKey } from "./types";
import { DEFAULT_SETTINGS } from "./types";

interface Store {
  settings: Settings;
}

const globalForStore = globalThis as unknown as { __settingsStore?: Store };

function getStore(): Store {
  if (!globalForStore.__settingsStore) {
    globalForStore.__settingsStore = { settings: { ...DEFAULT_SETTINGS } };
  }
  return globalForStore.__settingsStore;
}

export function getSettings(): Settings {
  return getStore().settings;
}

export function setSetting(key: SettingKey, value: boolean): Settings {
  const store = getStore();
  store.settings = { ...store.settings, [key]: value };
  return store.settings;
}
