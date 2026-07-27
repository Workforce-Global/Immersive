'use client';

import { create } from 'zustand';
import { isTauri } from '@/lib/tauri';
import { browserStorage } from '@/lib/browser-storage';
import type { Book } from '@/types/book';

interface BookState {
  books: Book[];
  loading: boolean;
  searchResults: Book[];
  initialized: boolean;

  init: () => Promise<void>;
  importBooks: () => Promise<Book[]>;
  deleteBook: (book: Book) => Promise<void>;
  loadCover: (book: Book) => Promise<void>;
  saveBookMetadata: (book: Book) => Promise<void>;
  readBookFile: (path: string) => Promise<ArrayBuffer>;
  updateBookProgress: (book: Book, progress: number) => Promise<void>;
  addHighlight: (book: Book, cfi: string, text: string, color: string, note?: string) => Promise<Book['highlights'][0]>;
  searchLibrary: (query: string) => void;
  searchBookContent: (book: Book, query: string) => Promise<any[]>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  loading: false,
  searchResults: [],
  initialized: false,

  searchLibrary: (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const searchTerm = query.toLowerCase();
    const results = get().books.filter(book =>
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm)
    );
    set({ searchResults: results });
  },

  searchBookContent: async (book: Book, query: string) => {
    if (book.format === 'pdf') {
      return searchPdfContent(book.path, query);
    }
    return [];
  },

  init: async () => {
    if (get().initialized) return;
    set({ loading: true });

    try {
      if (!isTauri()) {
        const books = browserStorage.getBooks();
        set({ books, initialized: true });
        return;
      }

      const { mkdir, readDir, readFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await mkdir('books', { baseDir: BaseDirectory.AppData, recursive: true });
      await mkdir('metadata', { baseDir: BaseDirectory.AppData, recursive: true });

      const metadataFiles = await readDir('metadata', { baseDir: BaseDirectory.AppData });
      const batchSize = 5;
      const books: Book[] = [];

      for (let i = 0; i < metadataFiles.length; i += batchSize) {
        const batch = metadataFiles.slice(i, i + batchSize);
        const batchPromises = batch
          .filter(file => file.name?.endsWith('.json'))
          .map(async file => {
            try {
              const content = await readFile(`metadata/${file.name}`, { baseDir: BaseDirectory.AppData });
              const book = JSON.parse(new TextDecoder().decode(content));
              book.lastRead = new Date(book.lastRead);
              return book;
            } catch (err) {
              console.error(`Failed to parse metadata: ${file.name}`, err);
              return null;
            }
          });
        const batchResults = await Promise.all(batchPromises);
        books.push(...batchResults.filter((b): b is Book => b !== null));
      }

      books.sort((a, b) => b.lastRead.getTime() - a.lastRead.getTime());
      set({ books, initialized: true });
    } catch (error) {
      console.error('Failed to load books:', error);
      set({ books: [] });
    } finally {
      set({ loading: false });
    }
  },

  importBooks: async () => {
    if (!isTauri()) {
      console.warn('Import is only available in Tauri desktop app');
      return [];
    }

    try {
      set({ loading: true });
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readFile, writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const { invoke } = await import('@tauri-apps/api/core');
      const pdfjsLib = await import('pdfjs-dist');

      const selected = await open({
        multiple: true,
        filters: [{ name: 'Books', extensions: ['epub', 'pdf'] }],
      });

      if (!selected || !Array.isArray(selected)) return [];

      const existingBooks = get().books;
      const newBooks: Book[] = [];

      for (const filePath of selected) {
        const fileName = filePath.split(/[\\/]/).pop() || 'unknown';
        const format = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'epub';

        if (existingBooks.some(b => b.path === filePath || b.title.toLowerCase() === fileName.toLowerCase())) continue;

        const bookId = crypto.randomUUID();
        const bookStoragePath = `books/${bookId}.${format}`;
        const bookContent = await readFile(filePath);
        await writeFile(bookStoragePath, bookContent, { baseDir: BaseDirectory.AppData });

        const bookPath = (await invoke('check_storage_path', { handle: {} })) + `/${bookId}.${format}`;

        let metadata: { title: string; author: string; cover?: string; language?: string };
        if (format === 'pdf') {
          const pdf = await pdfjsLib.getDocument(bookContent).promise;
          const info = (await pdf.getMetadata()).info as Record<string, any>;
          metadata = { title: info?.['Title'] || 'Untitled PDF', author: info?.['Author'] || 'Unknown Author', language: info?.['Language'] || 'EN' };
        } else {
          metadata = await invoke('extract_metadata', { filePath: bookPath });
        }

        const book: Book = {
          id: bookId, title: metadata.title || fileName, author: metadata.author || 'Unknown Author',
          path: bookPath, format, coverUrl: metadata.cover,
          progress: 0, bookmarks: [], highlights: [], lastRead: new Date(), language: metadata.language || 'EN',
        };

        await get().saveBookMetadata(book);
        newBooks.push(book);
      }

      set(state => ({ books: [...newBooks, ...state.books] }));
      return newBooks;
    } catch (error) {
      console.error('Failed to import books:', error);
      return [];
    } finally {
      set({ loading: false });
    }
  },

  deleteBook: async (book: Book) => {
    if (!isTauri()) {
      set(state => ({ books: state.books.filter(b => b.id !== book.id) }));
      return;
    }
    const { remove, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    await remove(`books/${book.id}.${book.format}`, { baseDir: BaseDirectory.AppData }).catch(() => {});
    await remove(`metadata/${book.id}.json`, { baseDir: BaseDirectory.AppData }).catch(() => {});
    await remove(`books/${book.id}.cover.jpg`, { baseDir: BaseDirectory.AppData }).catch(() => {});
    set(state => ({ books: state.books.filter(b => b.id !== book.id) }));
  },

  loadCover: async (book: Book) => {
    if (!isTauri()) return;
    if (book.coverUrl?.startsWith('data:')) return;
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const coverPath = book.path.replace(`.${book.format}`, '.cover.jpg');
      const coverBase64 = await invoke<string>('get_cover_base64', { filePath: coverPath });
      set(state => ({
        books: state.books.map(b => b.id === book.id ? { ...b, coverUrl: coverBase64 } : b),
      }));
    } catch (error) {
      console.error(`Failed to load cover for book ${book.id}:`, error);
    }
  },

  saveBookMetadata: async (book: Book) => {
    if (isTauri()) {
      const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await writeFile(`metadata/${book.id}.json`, new TextEncoder().encode(JSON.stringify(book, null, 2)), { baseDir: BaseDirectory.AppData });
    } else {
      const books = get().books.map(b => b.id === book.id ? book : b);
      browserStorage.setBooks(books);
    }
  },

  readBookFile: async (path: string) => {
    if (!isTauri()) throw new Error('File reading requires Tauri');
    const { readFile } = await import('@tauri-apps/plugin-fs');
    let retries = 3;
    let lastError: unknown;
    let delay = 1000;
    while (retries > 0) {
      try {
        const content = await readFile(path);
        return content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength);
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
    throw lastError;
  },

  updateBookProgress: async (book: Book, progress: number) => {
    book.progress = progress;
    book.lastRead = new Date();
    await get().saveBookMetadata(book);
    set(state => {
      const updated = state.books.map(b => b.id === book.id ? { ...book } : b);
      updated.sort((a, b) => b.lastRead.getTime() - a.lastRead.getTime());
      return { books: updated };
    });
  },

  addHighlight: async (book: Book, cfi: string, text: string, color: string, note?: string) => {
    const highlight = { id: crypto.randomUUID(), cfi, text, color, note, createdAt: new Date() };
    book.highlights.push(highlight);
    await get().saveBookMetadata(book);
    return highlight;
  },
}));

async function searchPdfContent(path: string, query: string): Promise<any[]> {
  if (!isTauri()) return [];
  const { readFile } = await import('@tauri-apps/plugin-fs');
  const pdfjsLib = await import('pdfjs-dist');
  try {
    const data = await readFile(path);
    const pdf = await pdfjsLib.getDocument(data).promise;
    const results: any[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(' ');
      if (text.toLowerCase().includes(query.toLowerCase())) {
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, idx - 50);
        const end = Math.min(text.length, idx + query.length + 50);
        results.push({ page: pageNum, text: text.slice(start, end) });
      }
    }
    return results;
  } catch (error) {
    console.error('Error searching PDF:', error);
    return [];
  }
}
