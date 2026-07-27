'use client';

import { create } from 'zustand';
import { ReaderSettings } from '@/types/book';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  fontFamily: 'system-ui',
  lineHeight: 1.5,
  theme: 'light',
  viewMode: 'paginated',
  margins: 16,
  maxWidth: 800,
};

interface SettingsState {
  settings: ReaderSettings;
  updateSettings: (changes: Partial<ReaderSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('reader-settings');
      if (stored) {
        DEFAULT_SETTINGS.theme = JSON.parse(stored).theme || 'light';
      }
    } catch {}
  }

  return {
    settings: { ...DEFAULT_SETTINGS },

    updateSettings: async (changes: Partial<ReaderSettings>) => {
      set(state => {
        const updated = { ...state.settings, ...changes };
        if (typeof window !== 'undefined') {
          localStorage.setItem('reader-settings', JSON.stringify(updated));
        }
        return { settings: updated };
      });
    },
  };
});
