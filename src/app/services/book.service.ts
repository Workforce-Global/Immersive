import { Injectable } from "@angular/core";
import { open } from "@tauri-apps/api/dialog";
import {
  readBinaryFile,
  writeBinaryFile,
  readDir,
  createDir,
  BaseDirectory,
  removeFile,
} from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { BehaviorSubject } from "rxjs";
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  path: string;
  format: 'epub' | 'pdf';
  progress: number;
  bookmarks: Bookmark[];
  highlights: Highlight[];
  lastRead: Date;
  language?: string;
}

export interface Bookmark {
  id: string;
  cfi: string;
  text: string;
  createdAt: Date;
}

export interface Highlight {
  id: string;
  cfi: string;
  text: string;
  color: string;
  note?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: "root",
})
export class BookService {
  private books = new BehaviorSubject<Book[]>([]);
  books$ = this.books.asObservable();
  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  private searchResults = new BehaviorSubject<Book[]>([]);
  searchResults$ = this.searchResults.asObservable();

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await createDir("books", { dir: BaseDirectory.AppData, recursive: true });
      await createDir("metadata", {
        dir: BaseDirectory.AppData,
        recursive: true,
      });
      await this.loadBooks();
    } catch (error) {
      console.error("Failed to initialize storage:", error);
    }
  }

  private async loadBooks() {
    try {
      this.loading.next(true);
      const metadataFiles = await readDir("metadata", {
        dir: BaseDirectory.AppData,
      });
      const books: Book[] = [];

      const bookPromises = metadataFiles
        .filter(file => file.name?.endsWith('.json'))
        .map(async file => {
          try {
            const content = await readBinaryFile(`metadata/${file.name}`, {
              dir: BaseDirectory.AppData,
            });
            return JSON.parse(new TextDecoder().decode(content));
          } catch (error) {
            console.error(`Failed to parse book metadata: ${file.name}`, error);
            return null;
          }
        });

      const loadedBooks = await Promise.all(bookPromises);
      books.push(...loadedBooks.filter(book => book !== null));

      this.books.next(
        books.sort(
          (a, b) =>
            new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to load books:", error);
    } finally {
      this.loading.next(false);
    }
  }

  searchLibrary(query: string) {
    if (!query.trim()) {
      this.searchResults.next([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const results = this.books.value.filter(book => 
      book.title.toLowerCase().includes(searchTerm) ||
      book.author.toLowerCase().includes(searchTerm)
    );
    
    this.searchResults.next(results);
  }

  async searchBookContent(book: Book, query: string): Promise<any[]> {
    if (book.format === 'pdf') {
      return this.searchPdfContent(book.path, query);
    } else {
      return [];
    }
  }

  private async searchPdfContent(path: string, query: string): Promise<any[]> {
    try {
      const data = await readBinaryFile(path);
      const pdf = await pdfjsLib.getDocument(data).promise;
      const maxPages = pdf.numPages;
      const searchResults = [];

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item: any) => item.str).join(' ');

        if (text.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({
            page: pageNum,
            text: this.extractSnippet(text, query),
          });
        }
      }

      return searchResults;
    } catch (error) {
      console.error('Error searching PDF:', error);
      return [];
    }
  }

  private extractSnippet(text: string, query: string, contextLength = 50): string {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + query.length + contextLength);
    return text.slice(start, end);
  }

  async importBooks(): Promise<Book[]> {
    try {
      this.loading.next(true);
      const selected = await open({
        multiple: true,
        filters: [{ 
          name: "Books", 
          extensions: ["epub", "pdf"] 
        }],
      });

      if (!selected || !Array.isArray(selected)) return [];

      const existingBooks = this.books.value;
      const newBooks: Book[] = [];

      const importPromises = selected.map(async (filePath) => {
        const fileName = filePath.split(/[\\/]/).pop() || "unknown";
        const format = fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'epub';

        const isDuplicate = existingBooks.some(
          (b) =>
            b.path === filePath ||
            b.title.toLowerCase() === fileName.toLowerCase()
        );
        if (isDuplicate) {
          console.warn(`Book "${fileName}" is already imported.`);
          return null;
        }

        const bookId = crypto.randomUUID();
        const bookStoragePath = `books/${bookId}.${format}`;

        const bookContent = await readBinaryFile(filePath);
        await writeBinaryFile(bookStoragePath, bookContent, {
          dir: BaseDirectory.AppData,
        });

        const bookPath = (await invoke("check_storage_path", { handle: {} })) +
          `/${bookId}.${format}`;

        let metadata: { title: string; author: string; cover?: string; language?: string };
        
        if (format === 'pdf') {
          metadata = await this.extractPdfMetadata(bookContent);
        } else {
          metadata = await invoke("extract_metadata", {
            filePath: bookPath,
          });
        }

        const book: Book = {
          id: bookId,
          title: metadata.title || fileName,
          author: metadata.author || 'Unknown Author',
          path: bookPath,
          format,
          coverUrl: metadata.cover,
          progress: 0,
          bookmarks: [],
          highlights: [],
          lastRead: new Date(),
          language: metadata.language || 'EN'
        };

        await this.saveBookMetadata(book);
        return book;
      });

      const importedBooks = await Promise.all(importPromises);
      newBooks.push(...importedBooks.filter(book => book !== null));

      this.books.next([...newBooks, ...existingBooks]);
      return newBooks;

    } catch (error) {
      console.error("Failed to import books:", error);
      return [];
    } finally {
      this.loading.next(false);
    }
  }

  private async extractPdfMetadata(data: Uint8Array) {
    try {
      const pdf = await pdfjsLib.getDocument(data).promise;
      const metadata = await pdf.getMetadata();
      const info = metadata.info as Record<string, any>;
      
      return {
        title: info?.["Title"] || 'Untitled PDF',
        author: info?.["Author"] || 'Unknown Author',
        language: info?.["Language"] || 'EN'
      };
    } catch (error) {
      console.error('Error extracting PDF metadata:', error);
      return {
        title: 'Untitled PDF',
        author: 'Unknown Author',
        language: 'EN'
      };
    }
  }

  async loadCover(book: Book) {
    if (book.coverUrl && book.coverUrl.startsWith("data:")) {
      return;
    }

    try {
      const coverPath = book.path.replace(`.${book.format}`, ".cover.jpg");

      const coverBase64 = await invoke<string>("get_cover_base64", {
        filePath: coverPath,
      });

      book.coverUrl = coverBase64;

      const updatedBooks = this.books.value.map((b) =>
        b.id === book.id ? { ...b, coverUrl: coverBase64 } : b
      );
      this.books.next(updatedBooks);
    } catch (error) {
      console.error(`Failed to load cover for book ${book.id}:`, error);
    }
  }

  async saveBookMetadata(book: Book) {
    try {
      await writeBinaryFile(
        `metadata/${book.id}.json`,
        new TextEncoder().encode(JSON.stringify(book, null, 2)),
        { dir: BaseDirectory.AppData }
      );
    } catch (error) {
      console.error("Failed to save book metadata:", error);
      throw error;
    }
  }

  async updateBookProgress(book: Book, progress: number) {
    book.progress = progress;
    book.lastRead = new Date();
    await this.saveBookMetadata(book);

    const updatedBooks = this.books.value.map((b) =>
      b.id === book.id ? book : b
    );
    this.books.next(updatedBooks);
  }

  async readBookFile(path: string): Promise<ArrayBuffer> {
    try {
      const content = await readBinaryFile(path);
      return content.buffer.slice(
        content.byteOffset,
        content.byteOffset + content.byteLength
      ) as ArrayBuffer;
    } catch (error) {
      console.error("Failed to read book file:", error);
      throw new Error("Could not read book content");
    }
  }

  async addHighlight(
    book: Book,
    cfi: string,
    text: string,
    color: string,
    note?: string
  ) {
    const highlight: Highlight = {
      id: crypto.randomUUID(),
      cfi,
      text,
      color,
      note,
      createdAt: new Date(),
    };

    book.highlights.push(highlight);
    await this.saveBookMetadata(book);
    return highlight;
  }

  async deleteBook(book: Book) {
    try {
      const bookId = book.id;

      await removeFile(`books/${bookId}.${book.format}`, {
        dir: BaseDirectory.AppData,
      }).catch((err) => console.warn("Failed to delete book file:", err));

      await removeFile(`metadata/${bookId}.json`, {
        dir: BaseDirectory.AppData,
      }).catch((err) => console.warn("Failed to delete metadata:", err));

      await removeFile(`books/${bookId}.cover.jpg`, {
        dir: BaseDirectory.AppData,
      }).catch((err) => console.warn("Failed to delete cover image:", err));

      this.books.next(this.books.value.filter((b) => b.id !== book.id));
    } catch (error) {
      console.error("Failed to delete book:", error);
    }
  }
}