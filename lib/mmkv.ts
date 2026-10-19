import { Platform } from 'react-native';

let mmkvInstance: any = null;

try {
  // react-native-mmkv v4+ uses createMMKV factory
  const { createMMKV } = require('react-native-mmkv');
  mmkvInstance = createMMKV({ id: 'ironforge-active-state' });
} catch (e) {
  // Graceful fallback for non-native environments (unit tests, web, preview)
  console.warn('[MMKV] Native module unavailable, utilizing persistent in-memory bridge.');
}

const memoryStore = new Map<string, string>();

/**
 * High-speed synchronous key-value storage engine backed by MMKV JSI.
 * Conforms to Zustand StateStorage interface.
 */
export const mmkvStorage = {
  setItem: (name: string, value: string): void => {
    if (mmkvInstance) {
      try {
        mmkvInstance.set(name, value);
        return;
      } catch (err) {
        console.warn('[MMKV setItem error]:', err);
      }
    }
    memoryStore.set(name, value);
  },

  getItem: (name: string): string | null => {
    if (mmkvInstance) {
      try {
        const value = mmkvInstance.getString(name);
        return value ?? null;
      } catch (err) {
        console.warn('[MMKV getItem error]:', err);
      }
    }
    return memoryStore.get(name) ?? null;
  },

  removeItem: (name: string): void => {
    if (mmkvInstance) {
      try {
        mmkvInstance.remove(name);
        return;
      } catch (err) {
        console.warn('[MMKV removeItem error]:', err);
      }
    }
    memoryStore.delete(name);
  },

  clearAll: (): void => {
    if (mmkvInstance) {
      try {
        mmkvInstance.clearAll();
        return;
      } catch (err) {
        console.warn('[MMKV clearAll error]:', err);
      }
    }
    memoryStore.clear();
  },
};

