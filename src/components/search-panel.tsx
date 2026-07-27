'use client';

import { useState, useCallback } from 'react';
import { SearchResult } from '@/types/book';
import { useSearch } from '@/hooks/use-search';

interface SearchPanelProps {
  book: any;
  onNavigate: (target: string) => void;
}

export function SearchPanel({ book, onNavigate }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const { results, search } = useSearch();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    search(book, value);
  }, [book, search]);

  return (
    <div className="bg-white dark:bg-gray-800 h-full w-80 p-4 overflow-y-auto">
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search in book..."
          className="w-full p-2 rounded-sm border dark:bg-gray-700 dark:text-white"
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="p-3 rounded-sm bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => result.cfi && onNavigate(result.cfi)}
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {result.percentage !== undefined ? `${result.percentage}% through book` : `Page ${result.page}`}
              </div>
              <div
                className="text-sm [&>mark]:bg-yellow-200 dark:[&>mark]:bg-yellow-500"
                dangerouslySetInnerHTML={{ __html: result.excerpt }}
              />
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-4">
          No results found
        </div>
      )}
    </div>
  );
}
