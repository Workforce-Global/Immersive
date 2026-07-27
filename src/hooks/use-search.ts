'use client';

import { useState, useCallback } from 'react';
import { SearchResult } from '@/types/book';
import { useBookStore } from '@/stores/book-store';

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const searchBookContent = useBookStore(s => s.searchBookContent);

  const search = useCallback(async (book: any, query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setCurrentQuery(query);

    if (book.format === 'pdf') {
      const pdfResults = await searchBookContent(book, query);
      setResults(pdfResults.map((r: any) => ({
        page: r.page,
        excerpt: highlightSearchTerm(r.text, query),
      })));
    } else {
      const epubResults = await book.search(query);
      const enhanced = await Promise.all(
        epubResults.map(async (result: any) => {
          const { cfi, excerpt } = result;
          const percentage = await book.locations.percentageFromCfi(cfi);
          return { cfi, excerpt: highlightSearchTerm(excerpt, query), percentage: Math.round(percentage * 100) };
        })
      );
      setResults(enhanced);
    }
  }, [searchBookContent]);

  const clearSearch = useCallback(() => {
    setResults([]);
    setCurrentQuery('');
  }, []);

  return { results, currentQuery, search, clearSearch };
}

function highlightSearchTerm(text: string, query: string): string {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
