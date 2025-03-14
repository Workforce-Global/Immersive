import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BookService, Book } from './book.service';

export interface SearchResult {
  cfi?: string;
  page?: number;
  excerpt: string;
  percentage?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private results = new BehaviorSubject<SearchResult[]>([]);
  results$ = this.results.asObservable();
  
  private currentQuery = new BehaviorSubject<string>('');
  currentQuery$ = this.currentQuery.asObservable();

  constructor(private bookService: BookService) {}

  async search(book: any, query: string) {
    if (!query.trim()) {
      this.results.next([]);
      return;
    }

    this.currentQuery.next(query);

    if (book.format === 'pdf') {
      const results = await this.bookService.searchBookContent(book, query);
      const searchResults = results.map(result => ({
        page: result.page,
        excerpt: this.highlightSearchTerm(result.text, query)
      }));
      this.results.next(searchResults);
    } else {
      // EPUB search
      const results = await book.search(query);
      const enhancedResults = await Promise.all(
        results.map(async (result: any) => {
          const { cfi, excerpt } = result;
          const percentage = await book.locations.percentageFromCfi(cfi);
          
          return {
            cfi,
            excerpt: this.highlightSearchTerm(excerpt, query),
            percentage: Math.round(percentage * 100)
          };
        })
      );
      this.results.next(enhancedResults);
    }
  }

  private highlightSearchTerm(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  clearSearch() {
    this.results.next([]);
    this.currentQuery.next('');
  }
}