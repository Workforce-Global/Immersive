'use client';

import { useState } from 'react';
import { useExcerptStore } from '@/stores/excerpt-store';

interface ExcerptPanelProps {
  bookId: string;
  text: string;
  cfi: string;
  onClose: () => void;
}

export function ExcerptPanel({ bookId, text, cfi, onClose }: ExcerptPanelProps) {
  const [note, setNote] = useState('');
  const addExcerpt = useExcerptStore(s => s.addExcerpt);

  const handleSave = () => {
    addExcerpt(bookId, text, cfi, note || undefined);
    onClose();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Save Excerpt</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl leading-none">
          &times;
        </button>
      </div>
      <div className="mb-4">
        <div className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-sm mb-2">{text}</div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          className="w-full p-2 rounded-sm border dark:bg-gray-700 dark:text-white text-sm"
          rows={3}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button onClick={onClose} className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          Cancel
        </button>
        <button onClick={handleSave} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-sm hover:bg-blue-700">
          Save Excerpt
        </button>
      </div>
    </div>
  );
}
