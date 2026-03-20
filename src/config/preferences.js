import { tuning } from './runtime-config.js';

const STORAGE_KEY = 'world.preferences.v1';
const VERSION = 1;

const DEFAULT_PREFERENCES = Object.freeze({
  version: VERSION,
  hudVisible: false,
  constellationsVisible: false,
  polarisVisible: false,
  hasSeenHelp: false,
  desktopLookSensitivity: tuning.player.desktopLookSensitivity,
  touchLookSensitivity: tuning.player.touchLookSensitivity,
  bloomStrength: tuning.bloom.strength,
  starLimitingMagnitude: tuning.stars.limitingMagnitude,
  constellationOpacity: tuning.constellationLines.opacity,
});

let preferences = null;

function canUseStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch (_error) {
    return false;
  }
}

function normalizePreferences(candidate = {}) {
  return {
    ...DEFAULT_PREFERENCES,
    ...candidate,
    version: VERSION,
  };
}

function readPreferences() {
  if (!canUseStorage()) {
    return normalizePreferences();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return normalizePreferences();
    }

    const parsed = JSON.parse(raw);
    return normalizePreferences(parsed);
  } catch (_error) {
    return normalizePreferences();
  }
}

function writePreferences(nextPreferences) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
  } catch (_error) {
    // Ignore storage failures so runtime controls still work.
  }
}

export function getPreferences() {
  if (!preferences) {
    preferences = readPreferences();
  }

  return preferences;
}

export function updatePreferences(patch) {
  preferences = {
    ...getPreferences(),
    ...patch,
    version: VERSION,
  };
  writePreferences(preferences);
  return preferences;
}

export function resetPreferences() {
  preferences = normalizePreferences();
  writePreferences(preferences);
  return preferences;
}
