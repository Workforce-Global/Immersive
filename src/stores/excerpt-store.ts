'use client';

import { create } from 'zustand';
import { Excerpt } from '@/types/book';

interface ExcerptState {
  excerpts: Excerpt[];
  addExcerpt: (bookId: string, text: string, cfi: string, note?: string) => Excerpt;
  deleteExcerpt: (id: string) => void;
  updateExcerptNote: (id: string, note: string) => void;
  getExcerptsForBook: (bookId: string) => Excerpt[];
}

function loadExcerpts(): Excerpt[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('book-excerpts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveExcerpts(excerpts: Excerpt[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('book-excerpts', JSON.stringify(excerpts));
}

export const useExcerptStore = create<ExcerptState>((set, get) => ({
  excerpts: loadExcerpts(),

  addExcerpt: (bookId: string, text: string, cfi: string, note?: string) => {
    const excerpt: Excerpt = { id: crypto.randomUUID(), bookId, text, cfi, note, createdAt: new Date() };
    set(state => {
      const updated = [...state.excerpts, excerpt];
      saveExcerpts(updated);
      return { excerpts: updated };
    });
    return excerpt;
  },

  deleteExcerpt: (id: string) => {
    set(state => {
      const updated = state.excerpts.filter(e => e.id !== id);
      saveExcerpts(updated);
      return { excerpts: updated };
    });
  },

  updateExcerptNote: (id: string, note: string) => {
    set(state => {
      const updated = state.excerpts.map(e => e.id === id ? { ...e, note } : e);
      saveExcerpts(updated);
      return { excerpts: updated };
    });
  },

  getExcerptsForBook: (bookId: string) => {
    return get().excerpts.filter(e => e.bookId === bookId);
  },
}));
