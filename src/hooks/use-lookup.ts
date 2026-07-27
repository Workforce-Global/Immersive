'use client';

import { useState, useCallback } from 'react';
import { LookupResult } from '@/types/book';

export function useLookup() {
  const [result, setResult] = useState<LookupResult | null>(null);

  const lookupWord = useCallback(async (word: string) => {
    setResult({ word, type: 'dictionary', loading: true });

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();

      if (response.ok) {
        const definition = data[0].meanings
          .map((m: any) => `${m.partOfSpeech}: ${m.definitions[0].definition}`)
          .join('\n');
        setResult({ word, type: 'dictionary', definition, loading: false });
      } else {
        throw new Error('Word not found');
      }
    } catch {
      try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${word}`);
        const data = await response.json();
        if (response.ok) {
          setResult({ word, type: 'wikipedia', summary: data.extract, url: data.content_urls?.desktop?.page, loading: false });
        } else {
          throw new Error('No results found');
        }
      } catch {
        setResult({ word, type: 'dictionary', loading: false, error: 'No definition or article found' });
      }
    }
  }, []);

  const clearLookup = useCallback(() => setResult(null), []);

  return { result, lookupWord, clearLookup };
}
