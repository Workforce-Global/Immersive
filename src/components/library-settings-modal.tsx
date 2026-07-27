'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface LibrarySettingsModalProps {
  onClose: () => void;
}

const themes: Array<'light' | 'dark' | 'sepia'> = ['light', 'dark', 'sepia'];
const viewModes: Array<'grid' | 'list'> = ['grid', 'list'];
const gridSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

interface LibrarySettings {
  theme: 'light' | 'dark' | 'sepia';
  sortBy: 'title' | 'author' | 'lastRead';
  viewMode: 'grid' | 'list';
  gridSize: 'small' | 'medium' | 'large';
}

function loadSettings(): LibrarySettings {
  if (typeof window === 'undefined') return { theme: 'light', sortBy: 'lastRead', viewMode: 'grid', gridSize: 'medium' };
  try {
    const stored = localStorage.getItem('library-settings');
    return stored ? JSON.parse(stored) : { theme: 'light', sortBy: 'lastRead', viewMode: 'grid', gridSize: 'medium' };
  } catch {
    return { theme: 'light', sortBy: 'lastRead', viewMode: 'grid', gridSize: 'medium' };
  }
}

export function LibrarySettingsModal({ onClose }: LibrarySettingsModalProps) {
  const [settings, setSettings] = useState<LibrarySettings>(loadSettings);

  const updateSettings = (changes: Partial<LibrarySettings>) => {
    const updated = { ...settings, ...changes };
    setSettings(updated);
    localStorage.setItem('library-settings', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Library Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
            <div className="flex space-x-4">
              {themes.map(theme => (
                <button
                  key={theme}
                  onClick={() => updateSettings({ theme })}
                  className={`w-10 h-10 rounded-full focus:outline-hidden ${
                    settings.theme === theme ? 'ring-2 ring-blue-500' : ''
                  } ${theme === 'light' ? 'bg-white' : theme === 'dark' ? 'bg-gray-900' : 'bg-[#f4ecd8]'}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sort Books By</label>
            <select
              value={settings.sortBy}
              onChange={e => updateSettings({ sortBy: e.target.value as LibrarySettings['sortBy'] })}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="lastRead">Last Read</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">View Mode</label>
            <div className="flex space-x-4">
              {viewModes.map(mode => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ viewMode: mode })}
                  className={`px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 ${
                    settings.viewMode === mode ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grid Size</label>
            <div className="flex space-x-4">
              {gridSizes.map(size => (
                <button
                  key={size}
                  onClick={() => updateSettings({ gridSize: size })}
                  className={`px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 ${
                    settings.gridSize === size ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
