import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { SearchService, SearchResult } from '../services/search.service';

@Component({
    selector: 'app-search-panel',
    imports: [FormsModule],
    template: `
    <div class="bg-white dark:bg-gray-800 h-full w-80 p-4 overflow-y-auto">
      <div class="mb-4">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch($event)"
          placeholder="Search in book..."
          class="w-full p-2 rounded border dark:bg-gray-700 dark:text-white"
          />
        </div>
    
        @if (results.length > 0) {
          <div class="space-y-4">
            @for (result of results; track result) {
              <div
                class="p-3 rounded bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                (click)="navigateToResult(result)">
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  {{ result.percentage }}% through book
                </div>
                <div [innerHTML]="result.excerpt"
                  class="text-sm [&>mark]:bg-yellow-200 dark:[&>mark]:bg-yellow-500">
                </div>
              </div>
            }
          </div>
        }
    
        @if (searchQuery && results.length === 0) {
          <div
            class="text-center text-gray-500 dark:text-gray-400 mt-4">
            No results found
          </div>
        }
      </div>
    `
})
export class SearchPanelComponent {

  @Input() book: any;

  @Output() navigate = new EventEmitter<string>();
  
  searchQuery = '';
  results: SearchResult[] = [];

  constructor(private searchService: SearchService) {
    this.searchService.results$.subscribe(results => {
      this.results = results;
    });
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.searchService.search(this.book, query);
  }

  navigateToResult(result: SearchResult) {
    this.navigate.emit(result.cfi);
  }
}