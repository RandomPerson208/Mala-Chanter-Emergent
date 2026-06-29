import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mantra = {
  id: string;
  name: string; // English/transliteration
  devanagari?: string;
  meaning?: string;
  isCustom?: boolean;
};

export type HistoryEntry = {
  id: string;
  mantraId: string;
  mantraName: string;
  malaCount: number; // number of malas completed in this session (usually 1)
  beadCount: number; // 108 per mala
  completedAt: string; // ISO
  durationMs?: number;
};

export type Settings = {
  themeMode: 'dark' | 'light';
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  selectedMantraId: string;
};

const KEYS = {
  mantras: '@zenmala/mantras',
  history: '@zenmala/history',
  settings: '@zenmala/settings',
  currentCount: '@zenmala/current_count',
};

export const DEFAULT_MANTRAS: Mantra[] = [
  { id: 'om-namah-shivaya', name: 'Om Namah Shivaya', devanagari: 'ॐ नमः शिवाय', meaning: 'I bow to Shiva, the inner Self.' },
  { id: 'hare-krishna', name: 'Hare Krishna', devanagari: 'हरे कृष्ण', meaning: 'Invocation of divine love and presence.' },
  { id: 'om-mani-padme-hum', name: 'Om Mani Padme Hum', devanagari: 'ॐ मणि पद्मे हूँ', meaning: 'The jewel is in the lotus — compassion.' },
  { id: 'gayatri', name: 'Gayatri Mantra', devanagari: 'ॐ भूर्भुवः स्वः', meaning: 'May we meditate on the divine light.' },
  { id: 'om', name: 'Om', devanagari: 'ॐ', meaning: 'The primordial sound.' },
  { id: 'so-hum', name: 'So Hum', devanagari: 'सो हम्', meaning: 'I am that.' },
];

const DEFAULT_SETTINGS: Settings = {
  themeMode: 'dark',
  hapticsEnabled: true,
  soundEnabled: true,
  selectedMantraId: 'om-namah-shivaya',
};

export async function getMantras(): Promise<Mantra[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.mantras);
    if (!raw) return DEFAULT_MANTRAS;
    const custom: Mantra[] = JSON.parse(raw);
    return [...DEFAULT_MANTRAS, ...custom];
  } catch {
    return DEFAULT_MANTRAS;
  }
}

export async function addCustomMantra(m: Omit<Mantra, 'id' | 'isCustom'>): Promise<Mantra> {
  const raw = await AsyncStorage.getItem(KEYS.mantras);
  const custom: Mantra[] = raw ? JSON.parse(raw) : [];
  const newMantra: Mantra = { ...m, id: `custom-${Date.now()}`, isCustom: true };
  custom.push(newMantra);
  await AsyncStorage.setItem(KEYS.mantras, JSON.stringify(custom));
  return newMantra;
}

export async function deleteCustomMantra(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEYS.mantras);
  const custom: Mantra[] = raw ? JSON.parse(raw) : [];
  const filtered = custom.filter((m) => m.id !== id);
  await AsyncStorage.setItem(KEYS.mantras, JSON.stringify(filtered));
}

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(s));
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.history);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const list = await getHistory();
  list.unshift(entry);
  await AsyncStorage.setItem(KEYS.history, JSON.stringify(list));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.history);
}

export async function getCurrentCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.currentCount);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function setCurrentCount(n: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.currentCount, String(n));
}

// Stats helpers
export function computeStats(history: HistoryEntry[]) {
  const totalMalas = history.reduce((s, h) => s + h.malaCount, 0);
  const totalBeads = history.reduce((s, h) => s + h.beadCount, 0);

  // Streak: consecutive days with at least one entry, ending today or yesterday
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const days = new Set(history.map((h) => dayKey(new Date(h.completedAt))));

  let streak = 0;
  const today = new Date();
  // Allow yesterday-only streaks to still count today as 0; standard streak from today backward
  let cursor = new Date(today);
  // If today not present but yesterday is, start from yesterday
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) {
      return { totalMalas, totalBeads, streak: 0, weekly: weeklyBuckets(history) };
    }
  }
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { totalMalas, totalBeads, streak, weekly: weeklyBuckets(history) };
}

function weeklyBuckets(history: HistoryEntry[]) {
  // Last 7 days incl today
  const buckets: { label: string; date: string; malas: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    const malas = history
      .filter((h) => h.completedAt.slice(0, 10) === key)
      .reduce((s, h) => s + h.malaCount, 0);
    buckets.push({ label, date: key, malas });
  }
  return buckets;
}
