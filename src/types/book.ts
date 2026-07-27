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

export interface Excerpt {
  id: string;
  bookId: string;
  text: string;
  cfi: string;
  note?: string;
  createdAt: Date;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  viewMode: 'scroll' | 'paginated';
  margins: number;
  maxWidth: number;
}

export interface SearchResult {
  cfi?: string;
  page?: number;
  excerpt: string;
  percentage?: number;
}

export interface LookupResult {
  word: string;
  type: 'dictionary' | 'wikipedia';
  definition?: string;
  summary?: string;
  url?: string;
  loading: boolean;
  error?: string;
}
