'use client';

import { LookupResult } from '@/types/book';

interface LookupPanelProps {
  result: LookupResult | null;
  onClose: () => void;
}

export function LookupPanel({ result, onClose }: LookupPanelProps) {
  if (!result) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{result.word}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl leading-none"
        >
          &times;
        </button>
      </div>
      {result.loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto" />
        </div>
      )}
      {!result.loading && (
        <div>
          {result.error && <div className="text-red-500 dark:text-red-400">{result.error}</div>}
          {result.definition && (
            <div className="space-y-2">
              {result.definition.split('\n').map((def, i) => (
                <div key={i} className="text-sm">{def}</div>
              ))}
            </div>
          )}
          {result.summary && (
            <div className="space-y-4">
              <p className="text-sm">{result.summary}</p>
              {result.url && (
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm inline-block">
                  Read more on Wikipedia
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
