// localStorage read/write with safe JSON parsing. No DOM, no app logic.

export const DATA_KEY = 'campusPlanner:data';
export const SETTINGS_KEY = 'campusPlanner:settings';

export const DEFAULT_SETTINGS = {
  weeklyCapHours: 10,
  unitDisplay: 'minutes', // 'minutes' | 'hours'
  theme: 'light',         // 'light' | 'dark'
  ignoreCase: true,
};

/**
 * Load the records array. Returns [] on missing or malformed data, so a
 * corrupt store never breaks the app.
 */
export function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveData(records) {
  localStorage.setItem(DATA_KEY, JSON.stringify(records));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_SETTINGS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
